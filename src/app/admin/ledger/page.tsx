import { PrismaClient } from '@prisma/client';
import AdminLedgerView from '@/components/AdminLedgerView';

const prisma = new PrismaClient();

export default async function AdminLedgerPage() {
  // Fetch ALL appointments for ALL shops
  const appointments = await prisma.appointment.findMany({
    include: {
      customer: true,
      service: true,
      tenant: true, // Need shop name for admin view
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
    
    const servicePrice = app.service.price;
    const priorityFee = 0.50;
    
    // The amount collected from the customer
    const grossRevenue = isCancelled ? (app.cancellationFee + priorityFee) : (servicePrice + priorityFee);
    
    // The marketplace commission
    const commissionAmount = Math.abs(isCancelled ? (app.cancellationFee * platformCommission) : (servicePrice * platformCommission));
    const stripeFee = Math.abs(isPaid ? ((grossRevenue * 0.029) + 0.30) : 0);
    
    const platformTotal = commissionAmount + priorityFee;
    const netPayout = grossRevenue - platformTotal - stripeFee;

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
      servicePrice: servicePrice,
      cancellationAmount: isCancelled ? app.cancellationFee : 0,
      grossAmount: grossRevenue,
      commissionFee: commissionAmount,
      processingFee: stripeFee,
      priorityFee: priorityFee,
      tax: 0, 
      netPayable: netPayout,
      netPlatform: platformTotal,
      isFuture: isFuture,
      isDisputed: app.isDisputed,
      disputeReason: app.disputeReason,
      disputeStatus: app.disputeStatus,
    };
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <AdminLedgerView data={ledgerData} />
    </div>
  );
}
