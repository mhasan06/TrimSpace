import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTaxInvoice } from '@/lib/invoiceGenerator';
import { calculateServiceFees } from '@/lib/pricing';
import { PRICING_CONSTANTS } from '@/lib/pricing';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch main appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        tenant: true,
        service: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 2. Fetch entire group if applicable (High-Fidelity)
    let groupAppointments: any[] = [appointment];
    if ((appointment as any).bookingGroupId) {
        groupAppointments = await prisma.appointment.findMany({
            where: { bookingGroupId: (appointment as any).bookingGroupId },
            include: { service: true, customer: true, tenant: true }
        });
    }

    // 3. Prepare data for PDF generator
    const servicesWithFees = groupAppointments.map(a => {
        const fees = calculateServiceFees(Number(a.service.price));
        return {
            name: a.service.name,
            price: Number(a.service.price),
            status: a.status,
            fees
        };
    });

    const totalProcessing = servicesWithFees.reduce((acc, s) => acc + (s.status === "CANCELLED" ? 0 : (s.fees.stripePercentFee + s.fees.stripeFlatFee)), 0);
    const totalPlatform = servicesWithFees.reduce((acc, s) => acc + (s.status === "CANCELLED" ? 0 : s.fees.platformFee), 0);
    const totalBasePrice = servicesWithFees.reduce((acc, s) => acc + (s.status === "CANCELLED" ? s.price * 0.5 : s.price), 0);
    const finalRoundedTotal = servicesWithFees.reduce((acc, s) => acc + (s.status === "CANCELLED" ? s.price * 0.5 : s.fees.totalCustomerPrice), 0);
    
    const invoiceData = {
      bookingId: (appointment as any).bookingGroupId || appointment.id.substring(appointment.id.length - 8).toUpperCase(),
      customerName: appointment.customer.name || 'Valued Customer',
      tenantName: appointment.tenant.name,
      tenantAddress: appointment.tenant.address || 'Main St, Australia',
      tenantPhone: appointment.tenant.phone || '',
      tenantABN: (appointment.tenant as any).abn || '00 000 000 000',
      date: appointment.startTime.toLocaleDateString('en-AU', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      time: appointment.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }),
      services: servicesWithFees.map(s => ({ name: s.name, price: s.price, status: s.status })),
      totalPrice: finalRoundedTotal,
      processingFee: totalProcessing,
      platformFee: totalPlatform,
      roundingAdjustment: finalRoundedTotal - (totalBasePrice + totalProcessing + totalPlatform),
      status: appointment.status
    };

    // 4. Generate PDF
    console.log(`Generating invoice for ${id}, status: ${invoiceData.status}`);
    const pdfBuffer = await generateTaxInvoice(invoiceData);

    // 5. Return PDF Response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoiceData.bookingId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('CRITICAL: Invoice Generation Error:', error.message, error.stack);
    return NextResponse.json({ error: `Invoice Error: ${error.message}` }, { status: 500 });
  }
}
