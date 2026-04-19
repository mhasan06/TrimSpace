import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTaxInvoice } from '@/lib/invoiceGenerator';

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
    const invoiceData = {
      bookingId: (appointment as any).bookingGroupId || appointment.id.substring(appointment.id.length - 8).toUpperCase(),
      customerName: appointment.customer.name || 'Valued Customer',
      tenantName: appointment.tenant.name,
      tenantAddress: appointment.tenant.address || 'Main St, Australia',
      tenantPhone: appointment.tenant.phone || '',
      tenantABN: (appointment.tenant as any).abn || '00 000 000 000',
      date: appointment.startTime.toLocaleDateString('en-AU', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }),
      time: appointment.startTime.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true }),
      services: groupAppointments.map(a => ({ name: a.service.name, price: a.service.price })),
      totalPrice: groupAppointments.reduce((acc, a) => acc + a.service.price, 0)
    };

    // 4. Generate PDF
    const pdfBlob = await generateTaxInvoice(invoiceData);

    // 5. Return PDF Stream
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoiceData.bookingId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Invoice Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
