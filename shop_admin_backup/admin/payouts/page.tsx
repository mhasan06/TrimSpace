import styles from "../../dashboard/page.module.css";
import { prisma } from "@/lib/prisma";
import SettlementManager from "@/components/SettlementManager";
import { getPlatformSettingsAction } from "./actions";

export default async function PayoutsPage() {
  const settings = await getPlatformSettingsAction();
  const currentFee = (settings as any).defaultPlatformFee || 0.02;

  // Use Raw SQL to bypass type locks on new models
  const settlements = await prisma.$queryRawUnsafe<any[]>(
    `SELECT s.*, t.name as "tenantName"
     FROM "Settlement" s
     JOIN "Tenant" t ON s."tenantId" = t.id
     ORDER BY s."createdAt" DESC`
  );

  // Map raw results to expected structure for Component
  const formattedSettlements = settlements.map(s => ({
    ...s,
    tenant: { name: s.tenantName }
  }));

  // Calculate high-level KPIs
  const totalOutstanding = formattedSettlements
    .filter(s => s.status === 'OUTSTANDING')
    .reduce((acc, s) => acc + s.amount, 0);
  
  const investigationCount = formattedSettlements.filter(s => s.status === 'INVESTIGATION' || s.status === 'DISPUTE').length;

  return (
    <>
      <header className={`${styles.header} glass`} style={{ borderBottom: '2px solid var(--primary)' }}>
        <div>
           <h1 style={{ color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '2px' }}>Platform Financial Ops</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem', fontWeight: 600 }}>Master Ledger & Merchant Settlement Control</p>
        </div>
      </header>

      <div className={styles.statsGrid} style={{ marginTop: '2rem', marginBottom: '3rem' }}>
         <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid var(--secondary)' }}>
            <h3 style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>Owed to Shops</h3>
            <p className={styles.statNumber} style={{ color: 'var(--secondary)', fontSize: '2.5rem' }}>
                ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Net outstanding for all processed weeks</p>
         </div>
         <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid #ef4444' }}>
            <h3 style={{ fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase' }}>Active Inquiries</h3>
            <p className={styles.statNumber} style={{ color: '#ef4444', fontSize: '2.5rem' }}>
                {investigationCount}
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Batches flagged for review/dispute</p>
         </div>
      </div>

      <SettlementManager 
        initialSettlements={formattedSettlements} 
        initialSettings={settings} 
      />
    </>
  );
}
