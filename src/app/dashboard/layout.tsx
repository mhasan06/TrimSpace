import Link from "next/link";
import styles from "./page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import { prisma } from "@/lib/prisma";
import { getTerminology } from "@/lib/terminology";
import { getActiveTenantContext } from "@/lib/support";
import SupportSessionBanner from "@/components/SupportSessionBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const context = await getActiveTenantContext();
  if (!context || !context.tenantId) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role === "ADMIN") {
      redirect("/admin");
    }
    redirect("/");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: context.tenantId }
  });
  const terminology = getTerminology(tenant?.category);

  return (
    <div className={styles.dashboardContainer} style={{ display: 'flex', flexDirection: 'column' }}>
      {context.isSupportMode && (
        <SupportSessionBanner 
          tenantName={context.tenantName!} 
          adminName={context.realAdminName!} 
        />
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <aside className={`${styles.sidebar} glass`}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>Business Dashboard</h2>
          <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>{terminology.industryIcon} {tenant?.category || 'BARBER'}</p>
        </div>
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>Overview</Link>
          <Link href="/dashboard/appointments" className={styles.navLink} style={{ color: 'var(--foreground)', fontWeight: 600 }}>Master Ledger</Link>
          <Link href="/dashboard/communications" className={styles.navLink} style={{ color: 'var(--primary)' }}>Communications Hub</Link>
          <Link href="/dashboard/reports" className={styles.navLink}>Advanced Reporting</Link>
          <Link href="/dashboard/services" className={styles.navLink}>{terminology.serviceLabelPlural}</Link>
          <Link href="/dashboard/roster" className={styles.navLink}>{terminology.rosterLabel}</Link>
          <Link href="/dashboard/customers" className={styles.navLink}>Customer Directory</Link>
          <Link href="/dashboard/settings" className={styles.navLink}>Shop Settings</Link>
          <Link href="/dashboard/support" className={styles.navLink} style={{ marginTop: 'auto', color: 'var(--accent)' }}>Contact Support</Link>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>

      </div>
      <MobileBottomNav />
    </div>
  );
}
