import styles from "../../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminFinancePortal() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") redirect("/");

  // 1. Fetch Global Live Revenue (Paid appointments not yet batched)
  const liveData = await prisma.$queryRaw<any[]>`
    SELECT 
        SUM(ROUND((s.price * 1.017 + 0.80) * 10) / 10.0) as total,
        COUNT(a.id) as count
    FROM "Appointment" a
    JOIN "Service" s ON a."serviceId" = s.id
    WHERE a."paymentStatus" = 'PAID' AND a."status" = 'CONFIRMED' AND a."settlementId" IS NULL
  `;

  // 2. Fetch Settlement Totals by Status
  // (Assuming these were already calculated correctly when settlement was created)
  const settlementStats = await prisma.$queryRaw<any[]>`
    SELECT 
        status,
        SUM(amount) as total,
        SUM("grossAmount") as gross,
        SUM("feeAmount") as fees,
        COUNT(id) as count
    FROM "Settlement"
    GROUP BY status
  `;

  // 3. Shop-by-Shop Breakdown
  const shopBreakdown = await prisma.$queryRaw<any[]>`
    SELECT 
        t.id, 
        t.name,
        COALESCE((
            SELECT SUM(ROUND((s2.price * 1.017 + 0.80) * 10) / 10.0)
            FROM "Appointment" a2 
            JOIN "Service" s2 ON a2."serviceId" = s2.id 
            WHERE a2."tenantId" = t.id AND a2."paymentStatus" = 'PAID' AND a2."status" = 'CONFIRMED' AND a2."settlementId" IS NULL
        ), 0) as "liveRevenue",
        COALESCE((
            SELECT SUM(amount) FROM "Settlement" WHERE "tenantId" = t.id AND status = 'OUTSTANDING'
        ), 0) as "outstanding",
        COALESCE((
            SELECT SUM(amount) FROM "Settlement" WHERE "tenantId" = t.id AND status = 'SETTLED'
        ), 0) as "settled"
    FROM "Tenant" t
    ORDER BY "liveRevenue" DESC
  `;

  const globalLive = Number(liveData[0]?.total || 0);
  const globalLiveCount = Number(liveData[0]?.count || 0);
  
  const outstanding = settlementStats.find(s => s.status === 'OUTSTANDING');
  const settled = settlementStats.find(s => s.status === 'SETTLED');

  return (
    <div style={{ padding: '2rem' }}>
      <header className={`${styles.header} glass`} style={{ marginBottom: '2.5rem' }}>
        <div>
           <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Financial Reporting Portal</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.4rem' }}>Real-time Marketplace Liquidity & Settlement Audit</p>
        </div>
        <div style={{ textAlign: 'right' }}>
            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
                SYSTEM STATUS: LIQUID
            </span>
        </div>
      </header>

      {/* Global KPIs */}
      <div className={styles.statsGrid} style={{ marginBottom: '3rem' }}>
        <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6 }}>Live Marketplace Revenue</h3>
            <p className={styles.statNumber} style={{ color: '#3b82f6' }}>${globalLive.toFixed(2)}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>{globalLiveCount} unbatched transactions</p>
        </div>
        <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6 }}>Total Outstanding (Net)</h3>
            <p className={styles.statNumber} style={{ color: '#f59e0b' }}>${Number(outstanding?.total || 0).toFixed(2)}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>{outstanding?.count || 0} pending daily batches</p>
        </div>
        <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid #10b981' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6 }}>Total Settled (To Date)</h3>
            <p className={styles.statNumber} style={{ color: '#10b981' }}>${Number(settled?.total || 0).toFixed(2)}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>Processing fees: ${Number(settled?.fees || 0).toFixed(2)}</p>
        </div>
        <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6 }}>Platform Yield</h3>
            <p className={styles.statNumber} style={{ color: 'var(--primary)' }}>${(Number(settled?.fees || 0) + Number(outstanding?.fees || 0)).toFixed(2)}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>Accrued Marketplace commission</p>
        </div>
      </div>

      {/* Shop Breakdown */}
      <section className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Merchant Financial Health</h2>
            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Sorted by Live Activity</div>
        </div>

        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>Shop Identity</th>
                        <th style={{ textAlign: 'right' }}>Live Revenue (Pending)</th>
                        <th style={{ textAlign: 'right' }}>Outstanding Payouts</th>
                        <th style={{ textAlign: 'right' }}>Total Settled</th>
                        <th style={{ textAlign: 'center' }}>Health Status</th>
                    </tr>
                </thead>
                <tbody>
                    {shopBreakdown.map(shop => {
                        const totalActive = Number(shop.liveRevenue) + Number(shop.outstanding);
                        const status = totalActive > 1000 ? 'HIGH_VOLUME' : totalActive > 0 ? 'ACTIVE' : 'DORMANT';
                        
                        return (
                            <tr key={shop.id}>
                                <td style={{ fontWeight: 800 }}>{shop.name}</td>
                                <td style={{ textAlign: 'right', color: '#3b82f6', fontWeight: 700 }}>${Number(shop.liveRevenue).toFixed(2)}</td>
                                <td style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>${Number(shop.outstanding).toFixed(2)}</td>
                                <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 700 }}>${Number(shop.settled).toFixed(2)}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span style={{ 
                                        fontSize: '0.65rem', 
                                        fontWeight: 900, 
                                        padding: '0.3rem 0.6rem', 
                                        borderRadius: '4px',
                                        background: status === 'HIGH_VOLUME' ? 'rgba(59,130,246,0.1)' : status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                                        color: status === 'HIGH_VOLUME' ? '#3b82f6' : status === 'ACTIVE' ? '#10b981' : 'rgba(255,255,255,0.4)'
                                    }}>
                                        {status}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </section>

      {/* Recommended Actions */}
      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="glass" style={{ padding: '2rem', border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.02)' }}>
              <h4 style={{ color: '#3b82f6', fontWeight: 900, fontSize: '0.9rem', marginBottom: '1rem' }}>💡 LIQUIDITY ALERT</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
                  Marketplace liquidity is healthy. You have <strong>${globalLive.toFixed(2)}</strong> in live bookings waiting for the next daily batch. 
                  Recommended: Trigger a settlement run if any merchant reports delayed funds.
              </p>
          </div>
          <div className="glass" style={{ padding: '2rem', border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)' }}>
              <h4 style={{ color: '#f59e0b', fontWeight: 900, fontSize: '0.9rem', marginBottom: '1rem' }}>📊 GROWTH INSIGHT</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6 }}>
                  Platform commissions (Yield) have reached <strong>${(Number(settled?.fees || 0) + Number(outstanding?.fees || 0)).toFixed(2)}</strong>. 
                  Your most active merchant is <strong>{shopBreakdown[0]?.name}</strong>.
              </p>
          </div>
      </div>
    </div>
  );
}
