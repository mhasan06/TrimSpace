import { prisma } from "@/lib/prisma";
import { getActiveTenantContext } from "@/lib/support";
import { redirect } from "next/navigation";
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
      settlement: true
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
    
    // Financial Calculation Logic
    const servicePrice = app.service.price;
    const priorityFee = 0.50;
    const gross = isCancelled ? (app.cancellationFee + priorityFee) : (servicePrice + priorityFee);
    
    // Platforms Revenue = Priority Fee + (Service Price * Commission)
    // Note: If cancelled, we still take commission on the retention? Usually yes.
    const platformGain = priorityFee + (isCancelled ? (app.cancellationFee * platformCommission) : (servicePrice * platformCommission));
    
    // Stripe Fee (Approximate: 2.9% + 30c)
    const stripeFee = isPaid ? ((gross * 0.029) + 0.30) : 0;
    
    // Net Payable to Salon = Gross - PlatformGain - StripeFee
    // We want to pass absolute fee values to the UI for clear subtraction display
    const net = gross - platformGain - stripeFee;

    return {
      id: app.id,
      bookingId: app.bookingGroupId || app.id,
      date: app.createdAt.toISOString(),
      serviceDate: app.startTime.toISOString(),
      type: isCancelled ? 'CANCELLATION_FEE' : 'BOOKING_PAYMENT',
      status: app.settlementId ? 'SETTLED' : (isPaid ? 'PENDING' : (isFuture ? 'PENDING' : 'FAILED')),
      customer: app.customer.name || 'Unknown Client',
      grossAmount: Math.abs(gross),
      commissionFee: Math.abs(platformGain - priorityFee), // Just the commission part
      processingFee: Math.abs(stripeFee),
      priorityFee: Math.abs(priorityFee),
      tax: 0, 
      netPayable: net,
      netPlatform: platformGain,
      isFuture: isFuture
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
