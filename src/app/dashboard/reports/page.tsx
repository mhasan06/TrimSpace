import styles from "../page.module.css";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import RevenueChart from "@/components/RevenueChart";
import { getTerminology } from "@/lib/terminology";
import ShopSettlementLedger from "@/components/ShopSettlementLedger";
import ShopSettlementDashboard from "@/components/ShopSettlementDashboard";
import { getActiveTenantContext } from "@/lib/support";

export default async function Reporting({ searchParams }: { searchParams: { from?: string, to?: string } }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const context = await getActiveTenantContext();
  const tenantId = context?.tenantId;
  const role = (session?.user as any)?.role;

  const fromDate = params.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const toDate = params.to || new Date().toISOString().split('T')[0];
  
  const fromObj = new Date(`${fromDate}T00:00:00.000Z`);
  const toObj = new Date(`${toDate}T23:59:59.999Z`);

  // 1. All paid appointments
  const allPaidAppointments: any[] = role === "ADMIN"
    ? await prisma.$queryRaw`
        SELECT a.*, s.name as "serviceName", s.price as "servicePrice", s."durationMinutes" as "serviceDuration", u.name as "customerName", u.email as "customerEmail"
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE a."paymentStatus" = 'PAID'
      `
    : await prisma.$queryRaw`
        SELECT a.*, s.name as "serviceName", s.price as "servicePrice", s."durationMinutes" as "serviceDuration", u.name as "customerName", u.email as "customerEmail"
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE a."tenantId" = ${tenantId} AND a."paymentStatus" = 'PAID'
      `;

  // 2. 30-Day Daily Revenue Split
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPaid: any[] = role === "ADMIN"
    ? await prisma.$queryRaw`
        SELECT DATE("startTime") as day, SUM("amountPaidStripe") as stripe, SUM("amountPaidGift") as gift
        FROM "Appointment"
        WHERE "paymentStatus" = 'PAID' AND "startTime" >= ${thirtyDaysAgo}
        GROUP BY DATE("startTime")
        ORDER BY day ASC
      `
    : await prisma.$queryRaw`
        SELECT DATE("startTime") as day, SUM("amountPaidStripe") as stripe, SUM("amountPaidGift") as gift
        FROM "Appointment"
        WHERE "tenantId" = ${tenantId} AND "paymentStatus" = 'PAID' AND "startTime" >= ${thirtyDaysAgo}
        GROUP BY DATE("startTime")
        ORDER BY day ASC
      `;

  const revenueChartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const iso = d.toISOString().split('T')[0];
    const found = recentPaid.find((r: any) => String(r.day).startsWith(iso));
    return { date: iso, stripe: found ? Number(found.stripe) : 0, gift: found ? Number(found.gift) : 0 };
  });

  // 4. Fetch Official Settlement Batches
  const officialSettlements: any[] = await prisma.settlement.findMany({
    where: { tenantId: tenantId! },
    include: { tenant: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const tenant = tenantId ? await prisma.tenant.findUnique({ where: { id: tenantId! } }) : null;
  const terminology = getTerminology(tenant?.category);

  // 3. Settlement table raw data - Filtered by Range
  const settledAppointments: any[] = role === "ADMIN"
    ? await prisma.$queryRaw`
        SELECT a.*, s.name as sn, s.price as sp, u.name as cn
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE (a."paymentStatus" IN ('PAID', 'PARTIAL_REFUNDED') OR a."status" = 'CANCELLED')
          AND a."startTime" >= ${fromObj} AND a."startTime" <= ${toObj}
        ORDER BY a."startTime" DESC LIMIT 1000
      `
    : await prisma.$queryRaw`
        SELECT a.*, s.name as sn, s.price as sp, u.name as cn
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE a."tenantId" = ${tenantId} 
          AND (a."paymentStatus" IN ('PAID', 'PARTIAL_REFUNDED') OR a."status" = 'CANCELLED')
          AND a."startTime" >= ${fromObj} AND a."startTime" <= ${toObj}
        ORDER BY a."startTime" DESC LIMIT 1000
      `;

  const totalRevenue = allPaidAppointments.reduce((sum, app) => sum + Number(app.servicePrice || 0), 0);
  const totalAppointments = allPaidAppointments.length;
  const uniqueCustomerIds = new Set(allPaidAppointments.map(a => a.customerId));
  const newCustomers = uniqueCustomerIds.size;

  // Top Services
  const serviceStats = allPaidAppointments.reduce((acc: any, app) => {
    const sId = app.serviceId;
    if (!acc[sId]) acc[sId] = { name: app.serviceName || "System Service", count: 0, revenue: 0, duration: app.serviceDuration || 45 };
    acc[sId].count += 1;
    acc[sId].revenue += Number(app.servicePrice || 0);
    return acc;
  }, {});
  const topServices = Object.values(serviceStats).sort((a: any, b: any) => b.revenue - a.revenue);

  // Top Customers (LTV)
  const customerLTV = allPaidAppointments.reduce((acc: any, app) => {
    const cId = app.customerId;
    if (!acc[cId]) acc[cId] = { name: app.customerName || app.customerEmail || "Guest Client", visits: 0, totalSpend: 0 };
    acc[cId].visits += 1;
    acc[cId].totalSpend += Number(app.servicePrice || 0);
    return acc;
  }, {});
  const topCustomers = Object.values(customerLTV).sort((a: any, b: any) => b.totalSpend - a.totalSpend).slice(0, 5);

  const stripeTotal30 = revenueChartData.reduce((s, d) => s + d.stripe, 0);
  const giftTotal30   = revenueChartData.reduce((s, d) => s + d.gift, 0);

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
          <h1>Business Reporting</h1>
          <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Real-time earnings and performance tracking.</p>
        </div>
        <div className={styles.profileStats}>
          <span className={styles.badge}>Live Global Sync: Active</span>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`}>
          <h3>Total Revenue</h3>
          <p className={styles.statNumber}>${totalRevenue.toFixed(2)}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>All digital payments</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Total {terminology.serviceLabelPlural}</h3>
          <p className={styles.statNumber}>{totalAppointments}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Successful bookings</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Active Clients</h3>
          <p className={styles.statNumber}>{newCustomers}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Individual clients served</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Platform Fee Est.</h3>
          <p className={styles.statNumber} style={{ color: 'var(--accent)' }}>${(totalRevenue * 0.025).toFixed(2)}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>2.5% Marketplace commission</p>
        </div>
      </div>

      {/* ─── Financial Settlement Ledger (Requested Replacement) ─── */}
      <section className={styles.recentSection} style={{ marginTop: '3rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.25rem' }}>Financial Settlement Ledger</h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Official weekly payout records and audit audits.</p>
        </div>
        
        <ShopSettlementLedger initialSettlements={officialSettlements} />
      </section>

      {/* ─── Top Services ─── */}
      <section className={styles.recentSection} style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Top Performing {terminology.serviceLabelPlural}</h2>
        <div className={`${styles.tableContainer} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{terminology.serviceLabel} Name</th>
                <th>Times Booked</th>
                <th>Avg. Duration</th>
                <th>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {topServices.map((s: any, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.count}</td>
                  <td>{s.duration} mins</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${s.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {topServices.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No processed payments yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Top Customers ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
        <section className={styles.recentSection}>
          <h2>Top Clients (Loyalty List)</h2>
          <div className={`${styles.tableContainer} glass`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Lifetime Value</th>
                  <th>Total Visits</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c: any, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ fontWeight: 700 }}>${c.totalSpend.toFixed(2)}</td>
                    <td>{c.visits}</td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No lifetime data available yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.recentSection}>
          <h2>Growth Potential</h2>
          <div className={`${styles.statCard} glass`} style={{ border: '1px dashed var(--primary)', height: 'calc(100% - 3rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <p style={{ opacity: 0.7, fontSize: '0.95rem', lineHeight: 1.6 }}>
              Based on your current <strong>${totalRevenue.toFixed(2)}</strong> processing volume, you are on track for a high-performance month.
              The <strong>Stripe integration</strong> is successfully capturing all data points.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', opacity: 0.7 }}>
                  <span>Stripe Revenue</span>
                  <span style={{ fontWeight: 700, color: '#D4AF37' }}>{totalRevenue > 0 ? ((stripeTotal30 / (stripeTotal30 + giftTotal30)) * 100).toFixed(0) : 0}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalRevenue > 0 ? (stripeTotal30 / (stripeTotal30 + giftTotal30)) * 100 : 0}%`, height: '100%', background: '#D4AF37', borderRadius: '4px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', opacity: 0.7 }}>
                  <span>Gift Credit</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{totalRevenue > 0 ? ((giftTotal30 / (stripeTotal30 + giftTotal30)) * 100).toFixed(0) : 0}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalRevenue > 0 ? (giftTotal30 / (stripeTotal30 + giftTotal30)) * 100 : 0}%`, height: '100%', background: '#10b981', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── Settlement Ledger Section (Advanced Interactive) ─── */}
      <section className={styles.recentSection} style={{ marginTop: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '0.25rem' }}>Settlement Ledger</h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>Historical transaction audit and weekly settlements.</p>
        </div>
        
        <ShopSettlementDashboard appointments={settledAppointments} />
      </section>
    </>
  );
}
