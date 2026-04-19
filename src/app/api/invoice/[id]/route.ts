import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTaxInvoice } from "@/lib/invoiceGenerator";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: appointmentId } = await params;

    // 1. Fetch the primary appointment to get context
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true, tenant: true, service: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // 2. Fetch all related appointments in the same group (if any)
    let groupAppointments = [appointment];
    if ((appointment as any).bookingGroupId) {
        groupAppointments = await prisma.appointment.findMany({
            where: { bookingGroupId: (appointment as any).bookingGroupId },
            include: { service: true }
        });
    }

    // Authorization check (using primary appointment)
    const isCustomer = (session.user as any).id === appointment.customerId;
    const isMerchant = (session.user as any).tenantId === appointment.tenantId;
    const isAdmin = (session.user as any).role === "ADMIN";

    if (!isCustomer && !isMerchant && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Map Group data to Invoice format
    const invoiceData = {
      bookingId: (appointment as any).bookingGroupId || appointment.id.substring(appointment.id.length - 8).toUpperCase(),
      customerName: appointment.customer.name || "Valued Customer",
      tenantName: appointment.tenant.name,
      tenantAddress: appointment.tenant.address || "Main St, Australia",
      tenantPhone: appointment.tenant.phone || "",
      tenantABN: (appointment.tenant as any).abn || "00 000 000 000",
      date: appointment.startTime.toLocaleDateString("en-AU", { weekday: "short", year: "numeric", month: "short", day: "numeric" }),
      time: appointment.startTime.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true }),
      services: groupAppointments.map(a => ({ name: a.service.name, price: a.service.price })),
      totalPrice: groupAppointments.reduce((acc, a) => acc + a.service.price, 0)
    };

    const pdfBlob = await generateTaxInvoice(invoiceData);
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice-${invoiceData.bookingId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Invoice Generation Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
