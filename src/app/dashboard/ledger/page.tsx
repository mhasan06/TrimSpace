import { prisma } from "@/lib/prisma";
import { getActiveTenantContext } from "@/lib/support";
import { redirect } from "next/navigation";
import { calculateServiceFees } from "@/lib/pricing";
import ComprehensiveLedger from "@/components/ComprehensiveLedger";
import styles from "../page.module.css";

export default async function FinancialLedgerPage() {
  const context = await getActiveTenantContext();
  const tenantId = context?.tenantId;
  if (!tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  // Fetch all appointments for ledger logic
  const appointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: {
      customer: true,
      service: true,
      settlement: true,
      disputeNotes: true
    },
    orderBy: { startTime: 'desc' }
  });

  // Fetch global platform settings for fee calculation
  const settings = await prisma.platformSettings.findUnique({ where: { id: 'platform_global' } });
  const platformCommission = settings?.defaultPlatformFee || 0.02; // 2%

  // Map appointments to LedgerEvents
  const events = appointments.map(app => {
    const isCancelled = app.status === 'CANCELLED';
    const isPaid = app.paymentStatus === 'PAID' || app.paymentStatus === 'PARTIAL_REFUNDED';
    const isFuture = new Date(app.startTime) > new Date();
    
    // If cancelled, we base the entire calculation on the cancellation fee
    const penaltyAmount = isCancelled 
      ? Number(app.cancellationFee || (app.service.price * 0.5))
      : Number(app.service.price);

    // Use the unified pricing utility based on the effective price (service or penalty)
    const fees = calculateServiceFees(penaltyAmount);
    
    const grossRevenue = fees.totalCustomerPrice;
    const totalPlatformTake = fees.totalCustomerPrice - fees.basePrice;
    const netPayout = fees.basePrice;

    return {
      id: app.id,
      bookingId: app.bookingGroupId || app.id,
      date: app.createdAt.toISOString(),
      serviceDate: app.startTime.toISOString(),
      type: isCancelled ? 'CANCELLATION_FEE' : 'BOOKING_PAYMENT',
      status: app.settlementId ? 'SETTLED' : (isPaid ? 'PENDING' : (isFuture ? 'PENDING' : 'FAILED')),
      customer: app.customer.name || 'Unknown Client',
      serviceName: app.service.name,
      servicePrice: app.service.price,
      cancellationAmount: isCancelled ? penaltyAmount : 0,
      grossAmount: grossRevenue,
      commissionFee: 0.50, // Consistently map 50c to this field for display grouping
      processingFee: (totalPlatformTake - 0.50), 
      priorityFee: 0,
      tax: 0, 
      netPayable: netPayout,
      netPlatform: totalPlatformTake,
      isFuture: isFuture,
      isSettled: !!app.settlementId,
      isDisputed: app.isDisputed,
      disputeReason: app.disputeReason,
      disputeStatus: app.disputeStatus,
      disputeResolvedAt: app.disputeResolvedAt?.toISOString(),
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className={`${styles.header} glass`}>
        <div>
           <h1 style={{ color: 'var(--foreground)', margin: 0 }}>Financial Settlement Ledger</h1>
           <p style={{ color: 'var(--primary)', marginTop: '0.3rem', fontSize: '0.9rem', fontWeight: 700 }}>
             {tenant?.name} • Accurate Reconciliation & Payout Tracking
           </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div className={styles.badge} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              Marketplace Fee: {(platformCommission * 100).toFixed(0)}%
            </div>
        </div>
      </header>

      <ComprehensiveLedger data={events as any} />
    </div>
  );
}
