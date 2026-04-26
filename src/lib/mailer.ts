import { generateTaxInvoice } from "./invoiceGenerator";
import { uploadInvoice } from "./storage";
import { prisma } from "./prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * High-fidelity Simulated Mailer.
 * Generates invoice -> Uploads to Cloud -> Logs simulated email delivery -> Updates DB.
 */
export async function sendNotificationEmail(id: string, type: 'CONFIRMED' | 'CANCELLED') {
  try {
    console.log(`[Mailer] Starting notification for ID: ${id}, Key present: ${!!process.env.RESEND_API_KEY}`);
    
    // 1. Fetch appointments (could be a single ID or a bookingGroupId)
    let appointments: any[] = [];
    
    if (id.startsWith('grp_')) {
        appointments = await prisma.appointment.findMany({
            where: { bookingGroupId: id },
            include: { service: true, customer: true, tenant: true }
        });
    } else {
        const single = await prisma.appointment.findUnique({
            where: { id },
            include: { service: true, customer: true, tenant: true }
        });
        if (single) {
            if ((single as any).bookingGroupId) {
                appointments = await prisma.appointment.findMany({
                    where: { bookingGroupId: (single as any).bookingGroupId },
                    include: { service: true, customer: true, tenant: true }
                });
            } else {
                appointments = [single];
            }
        }
    }

    if (appointments.length === 0) throw new Error(`No appointments found for ID: ${id}`);
    const appointment = appointments[0];

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
    const pdfData = await generateTaxInvoice(invoiceData);
    // Convert ArrayBuffer to Buffer for Supabase/Node compatibility
    const pdfBuffer = Buffer.from(pdfData);
    const invoiceUrl = await uploadInvoice(appointment.id, pdfBuffer as any);

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

    // 3. Identify Shop Owner(s) to notify
    const shopAdmins = await prisma.user.findMany({
      where: { tenantId: appointment.tenantId, role: "ADMIN" },
      select: { email: true }
    });
    const adminEmails = shopAdmins.map(a => a.email).filter(Boolean);

    if (resend) {
      console.log(`[Mailer] Attempting to send email to ${appointment.customer.email}`);
      // Send to Customer
      const custEmail = await resend.emails.send({
        from: 'TrimSpace <onboarding@resend.dev>',
        to: appointment.customer.email!,
        subject: subject,
        html: emailHtml,
      });

      if (custEmail.error) {
        console.error("[Mailer] Customer Email Error:", custEmail.error);
      }

      // Send to Shop Owner
      if (adminEmails.length > 0) {
        const adminEmailRes = await resend.emails.send({
          from: 'TrimSpace <onboarding@resend.dev>',
          to: adminEmails,
          subject: `[BUSINESS ALERT] ${subject}`,
          html: `
            <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #10b981;">New Business Notification</h2>
              <p>A booking at your shop has been <strong>${type.toLowerCase()}</strong>.</p>
              ${emailHtml}
              <p style="margin-top: 20px; font-size: 0.8rem; opacity: 0.5;">This is an automated business alert from your TrimSpace Dashboard.</p>
            </div>
          `,
        });
        if (adminEmailRes.error) {
           console.error("[Mailer] Admin Email Error:", adminEmailRes.error);
        }
      }
    } else {
      console.log(`[SIMULATED EMAIL - KEY MISSING] To: ${appointment.customer.email} & Admins: ${adminEmails.join(', ')}\nSubject: ${subject}`);
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

export async function sendVerificationEmail(email: string, name: string, token: string) {
  if (!resend) {
    console.log(`[SIMULATED VERIFICATION EMAIL] To: ${email}, Token: ${token}`);
    return { success: true };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify?token=${token}`;
  console.log(`\x1b[36m[Mailer] Verification link for ${email}: ${verifyUrl}\x1b[0m`);

  try {
    await resend.emails.send({
      from: 'TrimSpace <onboarding@resend.dev>',
      to: email,
      subject: 'Verify Your TrimSpace Account',
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #3b82f6;">Welcome to TrimSpace</h2>
          <p>Hello ${name},</p>
          <p>Thank you for joining our community. Please verify your email address to activate your account and start booking.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 12px 30px; background: #000; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1rem;">Verify Email Address</a>
          </div>

          <p style="font-size: 0.85rem; color: #64748b;">If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 0.8rem; word-break: break-all; color: #3b82f6;">${verifyUrl}</p>
          
          <p style="margin-top: 30px; font-size: 0.8rem; color: #9ca3af;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error("[Mailer] Verification Email Error:", err);
    return { success: false, error: "Failed to send verification email." };
  }
}
