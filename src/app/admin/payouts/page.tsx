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
      <header style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <div>
           <h1 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Financial Ops</h1>
           <p style={{ color: '#64748b', marginTop: '0.3rem', fontSize: '1rem', fontWeight: 600 }}>Master Ledger & Merchant Settlement Control</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
         <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', borderLeft: '6px solid #4f46e5', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>Owed to Shops</h3>
            <p style={{ color: '#0f172a', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
                ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>Net outstanding for all processed weeks</p>
         </div>
         <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', borderLeft: '6px solid #ef4444', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>Active Inquiries</h3>
            <p style={{ color: '#ef4444', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
                {investigationCount}
            </p>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>Batches flagged for review/dispute</p>
         </div>
      </div>

      <SettlementManager 
        initialSettlements={formattedSettlements} 
        initialSettings={settings} 
      />
    </>
  );
}
