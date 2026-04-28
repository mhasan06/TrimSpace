import styles from "../../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";

export default async function AdminReporting() {
  // 1. Basic Stats
  const totalShops = await prisma.tenant.count();
  const activeShops = await prisma.tenant.count({ where: { isActive: true } });
  const churn = totalShops > 0 ? ((totalShops - activeShops) / totalShops) * 100 : 0;

  // 2. Financial Metrics
  const appointments = await prisma.appointment.findMany({
    where: { paymentStatus: 'PAID' },
    include: { service: true, tenant: true }
  });

  const settings = await prisma.platformSettings.findFirst();
  const platformCommission = settings?.defaultPlatformFee || 0.02;

  const analytics = appointments.reduce((acc, app) => {
    const isCancelled = app.status === 'CANCELLED';
    const servicePrice = app.service.price;
    const priorityFee = 0.50;
    const grossRevenue = isCancelled ? (app.cancellationFee + priorityFee) : (servicePrice + priorityFee);
    const commissionAmount = Math.abs(isCancelled ? (app.cancellationFee * platformCommission) : (servicePrice * platformCommission));
    const platformTotal = commissionAmount + priorityFee;
    
    // Grouping by Month for forecast
    const month = new Date(app.startTime).toLocaleString('default', { month: 'short', year: 'numeric' });
    acc.monthly[month] = (acc.monthly[month] || 0) + platformTotal;

    // Region extraction (simplified)
    const city = app.tenant.address?.split(',').pop()?.trim() || "National";
    if (!acc.regions[city]) acc.regions[city] = { volume: 0, shops: new Set() };
    acc.regions[city].volume += grossRevenue;
    acc.regions[city].shops.add(app.tenantId);

    return {
      ...acc,
      gmv: acc.gmv + grossRevenue,
      platformTake: acc.platformTake + platformTotal,
    };
  }, { gmv: 0, platformTake: 0, monthly: {} as Record<string, number>, regions: {} as Record<string, { volume: number, shops: Set<string> }> });

  const arpu = activeShops > 0 ? (analytics.platformTake / activeShops) : 0;

  return (
    <>
      <header className={`${styles.header} glass`}>
        <h1>Advanced Platform Reporting</h1>
        <div className={styles.profileStats}>
          <span className={styles.badge}>Live Data Feed: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`}>
          <h3>Blended Platform Churn</h3>
          <p className={styles.statNumber} style={{ color: churn > 5 ? '#ff4444' : '#10b981' }}>{churn.toFixed(1)}%</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{churn < 2 ? 'Healthy Retention' : 'Action Required'}</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Avg. Shop ARPU</h3>
          <p className={styles.statNumber}>${arpu.toFixed(2)}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Monthly Marketplace Revenue per Shop</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Market Cap (GMV)</h3>
          <p className={styles.statNumber}>${(analytics.gmv / 1000).toFixed(1)}K</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Total volume across all verified tenants</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Active Fleet</h3>
          <p className={styles.statNumber} style={{ color: '#6366f1' }}>{activeShops}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Verified live tenants on platform</p>
        </div>
      </div>

      <section className={styles.recentSection} style={{ marginTop: '2.5rem' }}>
        <h2>Strategic Revenue Breakdown (Monthly)</h2>
        <div className={`${styles.tableContainer} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Billing Period</th>
                <th>Monthly Platform Take</th>
                <th>Estimated Subscriptions</th>
                <th>Projected Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.monthly).map(([month, total]) => (
                <tr key={month}>
                  <td style={{ fontWeight: 600 }}>{month}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${total.toFixed(2)}</td>
                  <td>${(activeShops * 29.95).toFixed(2)}</td>
                  <td style={{ color: '#10b981', fontWeight: 900 }}>${(total + (activeShops * 29.95)).toFixed(2)}</td>
                </tr>
              ))}
              {Object.keys(analytics.monthly).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No financial data found for the current period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
        <section className={styles.recentSection}>
          <h2>Customer Engagement (Paid Sessions)</h2>
          <div className={`${styles.tableContainer} glass`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Event Cluster</th>
                  <th>Session Count</th>
                  <th>Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Paid Bookings</td>
                  <td style={{ fontWeight: 900 }}>{appointments.length}</td>
                  <td>100%</td>
                </tr>
                <tr>
                  <td>Average Value</td>
                  <td style={{ fontWeight: 900 }}>${(analytics.gmv / (appointments.length || 1)).toFixed(2)}</td>
                  <td>Active</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.recentSection}>
          <h2>Top Performing Regions (GMV)</h2>
          <div className={`${styles.tableContainer} glass`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>City / Region</th>
                  <th>Total Volume</th>
                  <th>Live Shops</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.regions).sort((a,b) => b[1].volume - a[1].volume).slice(0, 5).map(([city, data]) => (
                  <tr key={city}>
                    <td style={{ fontWeight: 700 }}>{city}</td>
                    <td style={{ color: '#10b981', fontWeight: 900 }}>${data.volume.toFixed(2)}</td>
                    <td>{data.shops.size} Shops</td>
                  </tr>
                ))}
                {Object.keys(analytics.regions).length === 0 && (
                   <tr>
                     <td colSpan={3} style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No regional data available yet.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
