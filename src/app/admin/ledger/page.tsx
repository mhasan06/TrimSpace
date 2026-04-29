import { PrismaClient } from '@prisma/client';
import { calculateServiceFees } from '@/lib/pricing';
import AdminLedgerView from '@/components/AdminLedgerView';

const prisma = new PrismaClient();

export default async function AdminLedgerPage() {
  // Fetch ALL appointments for ALL shops
  const appointments = await prisma.appointment.findMany({
    include: {
      customer: true,
      service: true,
      tenant: true, // Need shop name for admin view
      disputeNotes: true,
    },
    orderBy: {
      startTime: 'desc',
    },
  });

  // Settings for platform commission (default to 2% if not found)
  const settings = await prisma.platformSettings.findFirst();
  const platformCommission = settings?.defaultPlatformFee || 0.02;

  const ledgerData = appointments.map((app) => {
    const isCancelled = app.status === 'CANCELLED';
    const isPaid = app.paymentStatus === 'PAID' || app.paymentStatus === 'PARTIAL_REFUNDED';
    const isFuture = new Date(app.startTime) > new Date();
    
    // Use the unified pricing utility
    const penaltyAmount = isCancelled 
      ? Number(app.cancellationFee || (app.service.price * 0.5))
      : Number(app.service.price);

    const fees = calculateServiceFees(penaltyAmount);
    
    const grossRevenue = fees.totalCustomerPrice;
    const totalPlatformTake = fees.totalCustomerPrice - fees.basePrice;
    const netPayout = fees.basePrice;

    // Calculate potential refund if cancelled
    let refundAmount = 0;
    if (isCancelled && isPaid) {
      const originalFullPriceFees = calculateServiceFees(app.service.price);
      refundAmount = originalFullPriceFees.totalCustomerPrice - fees.totalCustomerPrice;
    }

    return {
      id: app.id,
      bookingId: app.bookingGroupId || app.id,
      date: app.createdAt.toISOString(),
      serviceDate: app.startTime.toISOString(),
      type: (isCancelled ? 'CANCELLATION_FEE' : 'BOOKING_PAYMENT') as any,
      status: (app.settlementId ? 'SETTLED' : (isPaid ? 'PENDING' : (isFuture ? 'PENDING' : 'FAILED'))) as any,
      customer: app.customer.name || 'Unknown Client',
      shopName: app.tenant.name,
      shopId: app.tenantId,
      serviceName: app.service.name,
      servicePrice: app.service.price,
      cancellationAmount: isCancelled ? penaltyAmount : 0,
      grossAmount: grossRevenue,
      commissionFee: 0.50, // Mapping 50c to this field for display grouping
      processingFee: (totalPlatformTake - 0.50), 
      priorityFee: 0,
      tax: 0, 
      netPayable: netPayout,
      netPlatform: totalPlatformTake,
      refundAmount: refundAmount,
      paymentStatus: app.paymentStatus,
      isFuture: isFuture,
      isSettled: !!app.settlementId,
      isDisputed: app.isDisputed,
      disputeReason: app.disputeReason,
      disputeStatus: app.disputeStatus,
      disputeResolvedBy: app.disputeResolvedBy,
      disputeResolutionMemo: app.disputeResolutionMemo,
      disputeNotes: app.disputeNotes.map(n => ({
        id: n.id,
        content: n.content,
        authorName: n.authorName,
        authorRole: n.authorRole,
        createdAt: n.createdAt.toISOString()
      })),
    };
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <AdminLedgerView data={ledgerData} />
    </div>
  );
}
