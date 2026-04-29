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
    
    // Use the unified pricing utility
    const fees = calculateServiceFees(Number(app.service.price));
    
    // If cancelled, use the cancellation fee if exists, otherwise 50% of base
    const basePayout = isCancelled 
      ? Number(app.cancellationFee || (fees.basePrice * 0.5))
      : fees.basePrice;
    
    // ForCancelled items, we don't show the extra fees in the gross (customer didn't pay them)
    // but the merchant payout is just the retention amount.
    const grossRevenue = isCancelled ? basePayout : fees.totalCustomerPrice;
    
    // Consolidate all platform/stripe fees into one for the display
    // Platform = Platform Fee + Stripe Fee
    const totalPlatformTake = fees.totalCustomerPrice - fees.basePrice;
    
    // The Shop's actual share
    const netPayout = basePayout;

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
      cancellationAmount: isCancelled ? basePayout : 0,
      grossAmount: grossRevenue,
      commissionFee: isCancelled ? 0 : 0.50, // Labeled commission but we'll map it to platform fee
      processingFee: isCancelled ? 0 : (totalPlatformTake - 0.50), // Remaining is processing
      priorityFee: 0, // We consolidated it
      tax: 0, 
      netPayable: netPayout,
      netPlatform: isCancelled ? 0 : totalPlatformTake,
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
