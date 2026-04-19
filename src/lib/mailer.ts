import { generateTaxInvoice } from "./invoiceGenerator";
import { uploadInvoice } from "./storage";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * High-fidelity Simulated Mailer.
 * Generates invoice -> Uploads to Cloud -> Logs simulated email delivery -> Updates DB.
 */
export async function sendNotificationEmail(appointmentId: string, type: 'CONFIRMED' | 'CANCELLED') {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true, tenant: true, service: true }
    });

    if (!appointment) throw new Error("Appointment not found for notification.");

    // 1. Fetch group context if applicable
    let appointments = [appointment];
    if ((appointment as any).bookingGroupId) {
        appointments = await prisma.appointment.findMany({
            where: { bookingGroupId: (appointment as any).bookingGroupId },
            include: { service: true, customer: true, tenant: true }
        });
    }

    const totalServicePrice = appointments.reduce((sum, a) => sum + a.service.price, 0);

    // 2. Generate PDF Data
    const invoiceData = {
      bookingId: (appointment as any).bookingGroupId || appointment.id.substring(appointment.id.length - 8).toUpperCase(),
      customerName: appointment.customer.name || "Valued Customer",
      tenantName: appointment.tenant.name,
      tenantAddress: appointment.tenant.address || "Main St, Australia",
      tenantPhone: appointment.tenant.phone || "",
      tenantABN: (appointment.tenant as any).abn || "00 000 000 000",
      date: appointment.startTime.toLocaleDateString("en-AU", { weekday: "short", year: "numeric", month: "short", day: "numeric" }),
      time: appointment.startTime.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true }),
      services: appointments.map(a => ({ name: a.service.name, price: a.service.price })),
      totalPrice: totalServicePrice
    };

    // 2. Archive to Cloud Storage
    const pdfBlob = await generateTaxInvoice(invoiceData);
    const invoiceUrl = await uploadInvoice(appointmentId, pdfBlob);

    // 3. Real Email Delivery via Resend (or fall back to simulated)
    const subject = type === 'CONFIRMED' 
      ? `Booking Confirmed: ${invoiceData.bookingId} at ${appointment.tenant.name}`
      : `Booking Cancelled: ${invoiceData.bookingId} at ${appointment.tenant.name}`;

    const emailHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #3b82f6;">Booking ${type === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}</h2>
        <p>Hello ${appointment.customer.name || 'Member'},</p>
        <p>Your booking <strong>#${invoiceData.bookingId}</strong> at <strong>${appointment.tenant.name}</strong> has been ${type.toLowerCase()}.</p>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #6b7280; font-size: 0.8rem; text-transform: uppercase;">Services:</p>
            ${invoiceData.services.map(s => `<div style="display: flex; justify-content: space-between; margin-top: 5px;"><span>${s.name}</span> <span>$${s.price.toFixed(2)}</span></div>`).join('')}
            <div style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold;">
                <span>Total</span> <span>$${invoiceData.totalPrice.toFixed(2)}</span>
            </div>
        </div>

        <p>View your official tax invoice here:</p>
        <a href="${invoiceUrl}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Download Invoice (PDF)</a>
        
        <p style="margin-top: 30px; font-size: 0.8rem; color: #9ca3af;">Thank you for using TrimSpace Marketplace.</p>
      </div>
    `;

    if (resend) {
      await resend.emails.send({
        from: 'TrimSpace <onboarding@resend.dev>', // Update with verified domain in production
        to: appointment.customer.email!,
        subject: subject,
        html: emailHtml,
      });
    } else {
      console.log(`[SIMULATED EMAIL] To: ${appointment.customer.email}\nSubject: ${subject}\nLink: ${invoiceUrl}`);
    }

    // 4. Update Database
    const appIds = appointments.map(a => a.id);
    await prisma.appointment.updateMany({
      where: { id: { in: appIds } },
      data: {
        invoiceUrl,
        emailSent: true
      }
    });

    return { success: true, invoiceUrl };
  } catch (err) {
    console.error("Notification Failure:", err);
    return { success: false, error: "Failed to process notification flow." };
  }
}
