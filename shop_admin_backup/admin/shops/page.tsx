import styles from "../../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";
import ShopStatusToggle from "./ShopStatusToggle";
import SupportRemoteLink from "@/components/SupportRemoteLink";
import FeatureControl from "./FeatureControl";
import BarberLimitControl from "./BarberLimitControl";

export default async function AllShopsPage() {
  // RAW SQL BYPASS: Ensures 'isActive' field is not stripped by the Prisma Client
  const shops: any[] = await prisma.$queryRaw`
    SELECT 
      t.*,
      (SELECT count(*) FROM "Appointment" a WHERE a."tenantId" = t.id) as "appointmentCount",
      (SELECT COALESCE(SUM("amountPaidStripe" + "amountPaidGift"), 0) FROM "Appointment" a WHERE a."tenantId" = t.id AND (a."paymentStatus" = 'PAID' OR a."paymentStatus" = 'PARTIAL_REFUNDED')) as "grossRevenue",
      (SELECT json_agg(u.*) FROM "User" u WHERE u."tenantId" = t.id AND u.role = 'BARBER') as "barberUsers"
    FROM "Tenant" t
    ORDER BY t."createdAt" DESC
  `;

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <div style={{ fontSize: '0.6rem', background: 'var(--primary)', color: 'black', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900, marginBottom: '0.5rem' }}>BUILD V2.1 - GROUPING ACTIVE</div>
           <h1>Marketplace Governance</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Approve new partners and manage established businesses.</p>
        </div>
      </header>

      <section className={styles.recentSection} style={{ marginTop: '2rem' }}>
        <div className={`${styles.tableContainer} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Category</th>
                <th>ABN</th>
                <th>Owner (Primary)</th>
                <th>Gross Revenue</th>
                <th>Bank Details</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <tr key={shop.id}>
                  <td style={{ fontWeight: 600 }}>{shop.name}</td>
                  <td>
                    <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '20px', 
                        fontWeight: 700,
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.05)',
                        opacity: 0.8
                    }}>
                        {shop.category || "BARBER"}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{shop.abn || "N/A"}</td>
                  <td>{shop.barberUsers?.[0]?.name || "N/A"}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    ${Number(shop.grossRevenue).toFixed(2)}
                    <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 400 }}>Digital Settlements Only</div>
                  </td>
                  <td>
                    {shop.bankName ? (
                        <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                            <div style={{ fontWeight: 700 }}>{shop.bankName}</div>
                            <div style={{ opacity: 0.7 }}>BSB: {shop.bsb}</div>
                            <div style={{ opacity: 0.7 }}>ACC: {shop.accountNumber}</div>
                        </div>
                    ) : (
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>No Details</span>
                    )}
                  </td>
                  <td>
                    <span style={{ 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        background: shop.isActive ? 'rgba(var(--primary-rgb), 0.2)' : 'rgba(255, 165, 0, 0.2)', 
                        color: shop.isActive ? 'var(--primary)' : 'orange',
                        border: `1px solid ${shop.isActive ? 'var(--primary)' : 'orange'}`
                    }}>
                      {shop.isActive ? "LIVE" : "PENDING REVIEW"}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <BarberLimitControl tenantId={shop.id} currentLimit={shop.maxBarbers || 3} />
                      <FeatureControl tenantId={shop.id} enabledFeatures={shop.enabledFeatures} />
                      <ShopStatusToggle tenantId={shop.id} currentStatus={shop.isActive} />
                      <SupportRemoteLink tenantId={shop.id} shopName={shop.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {shops.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>No shops registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
