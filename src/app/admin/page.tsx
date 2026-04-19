import styles from "../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";

export default async function AdminOverview() {
  // Global System Mathematical Scrapers: Bypassing Prisma Drift using Raw SQL
  const totalShopsCount: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Tenant"`;
  const totalShops = Number(totalShopsCount[0]?.count || 0);

  const activeShopsCount: any = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Tenant" WHERE "isActive" = true`;
  const activeShops = Number(activeShopsCount[0]?.count || 0);

  const pendingReview = totalShops - activeShops;
  
  // Calculate Global Gross Merchandise Value (GMV) across ALL shops globally
  const globalAppointments: any[] = await prisma.$queryRaw`
    SELECT a.*, s.price as "servicePrice"
    FROM "Appointment" a
    JOIN "Service" s ON a."serviceId" = s.id
    WHERE a."paymentStatus" = 'PAID'
  `;
  const gmv = globalAppointments.reduce((acc, app) => acc + Number(app.servicePrice || 0), 0);
  const platformFees = gmv * 0.025; // Simulated 2.5% commission
  
  // Scrape recent Shops
  const recentShops = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { users: true }
  });

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <h1>Global Platform Summary</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Real-time production metrics aggregating all deployed Tenants across AWS.</p>
        </div>
        <div className={styles.profileStats}>
          <span className={styles.badge} style={{ color: '#ff4444', border: '1px solid #ff4444' }}>System Status: Operational All Clusters</span>
        </div>
      </header>
      
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`}>
          <h3>Verified Live Shops</h3>
          <p className={styles.statNumber} style={{ fontSize: '2.5rem' }}>{activeShops}</p>
          <p style={{ color: 'var(--primary)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 700 }}>{pendingReview} Pending Applications</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Platform MRR (Projected)</h3>
          <p className={styles.statNumber} style={{ fontSize: '2.5rem' }}>${activeShops * 29.95}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Calculated from {activeShops} active tenants</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Settled Gross Volume</h3>
          <p className={styles.statNumber} style={{ fontSize: '2.5rem' }}>${gmv.toFixed(2)}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Paid appointments across all shops</p>
        </div>
        <div className={`${styles.statCard} glass`}>
          <h3>Platform Commissions</h3>
          <p className={styles.statNumber} style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>${platformFees.toFixed(2)}</p>
          <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Estimated 2.5% cut from GMV</p>
        </div>
      </div>

      <section className={styles.recentSection}>
        <h2>Recent Database Registrations</h2>
        <div className={`${styles.tableContainer} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Physical Shop Block</th>
                <th>Routing Slug</th>
                <th>Global ID Tag</th>
                <th>Signup Time Record</th>
                <th>Network Status</th>
              </tr>
            </thead>
            <tbody>
              {recentShops.map(shop => (
                 <tr key={shop.id}>
                    <td style={{ fontWeight: 600 }}>{shop.name}</td>
                    <td style={{ color: 'var(--primary)', fontStyle: 'italic' }}>trimspace.co/{shop.slug}</td>
                    <td><span style={{ opacity: 0.6, fontSize: '0.8rem' }}>{shop.id}</span></td>
                    <td>{new Date(shop.createdAt).toLocaleDateString()}</td>
                                         <td>
                        <span style={{ 
                            color: shop.isActive ? 'var(--primary)' : '#f59e0b', 
                            fontWeight: 700, 
                            fontSize: '0.75rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            border: `1px solid ${shop.isActive ? 'var(--primary)' : '#f59e0b'}`,
                            background: shop.isActive ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(245, 158, 11, 0.1)'
                        }}>
                          {shop.isActive ? "LIVE" : "PENDING"}
                        </span>
                     </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.recentSection} style={{ marginTop: '2.5rem' }}>
        <h2>Global Group Activity Detection</h2>
        <div className={`${styles.tableContainer} glass`} style={{ border: '1px solid var(--accent)' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Detected Cluster</th>
                <th>Shop Affected</th>
                <th>Units</th>
                <th>Status</th>
                <th>Action Hook</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                 // Group appointments by customer + startTime + tenantId
                 const groups: Record<string, any[]> = {};
                 globalAppointments.forEach(app => {
                    const key = `${app.customerId}-${app.startTime}-${app.tenantId}`;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(app);
                 });
                 
                 const clusters = Object.values(groups).filter(g => g.length > 1);
                 
                 return clusters.map((cluster, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>CLUSTER: {cluster[0].customerId.substring(0,8)}</td>
                      <td>Tenant: {cluster[0].tenantId}</td>
                      <td>{cluster.length} Sessions</td>
                      <td><span className={styles.statusConfirmed}>Live Cluster</span></td>
                      <td><button type="button" style={{ padding: '0.4rem 1rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Inspect</button></td>
                    </tr>
                 ));
              })()}
              {globalAppointments.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '1.5rem' }}>No synchronized group events detected in the current cluster.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
