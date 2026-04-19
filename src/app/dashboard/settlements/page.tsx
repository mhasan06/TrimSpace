import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import styles from "../page.module.css";
import ShopSettlementDashboard from "@/components/ShopSettlementDashboard";

export default async function SettlementsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) return <div>Unauthorized</div>;

  // Fetch all financial-relevant appointments with breakdown data
  const appointments = await prisma.appointment.findMany({
    where: { 
        tenantId,
        paymentStatus: { in: ['PAID', 'PARTIAL_REFUNDED'] }
    },
    include: { service: true, customer: true },
    orderBy: { startTime: 'desc' }
  });

  return (
    <div className={styles.dashboardContainer} style={{ padding: '2rem' }}>
      <header className={`${styles.header} glass`} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', padding: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Advanced Financial Reporting</h1>
            <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Real-time settlement ledger & revenue breakdown</p>
          </div>
        </div>
      </header>

      <ShopSettlementDashboard appointments={appointments} />
    </div>
  );
}
