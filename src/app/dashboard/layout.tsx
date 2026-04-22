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
  const session = await getServerSession(authOptions);
  
  if (!context || !context.tenantId) {
    if (session && (session.user as any).role === "ADMIN") {
      redirect("/admin");
    }
    
    // Instead of redirecting (which causes loops), show a status screen
    return (
      <div style={{ color: 'white', padding: '4rem', textAlign: 'center', background: '#0a0a0a', minHeight: '100vh' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Dashboard Access Restricted</h2>
        <p style={{ opacity: 0.8, maxWidth: '500px', margin: '0 auto' }}>
          You are logged in as <strong>{session?.user?.email || 'Unknown User'}</strong>, but this account is not linked to a shop dashboard.
        </p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="/" style={{ color: 'white', textDecoration: 'underline' }}>Return Home</a>
          <button onClick={() => window.location.href='/login'} style={{ background: 'var(--primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
            Try Different Login
          </button>
        </div>
        
        {/* DEBUG INFO FOR MOHAMMAD */}
        <div style={{ marginTop: '4rem', fontSize: '0.7rem', opacity: 0.3, fontFamily: 'monospace' }}>
          DEBUG_LOG: role={(session?.user as any)?.role} | tenantId={(session?.user as any)?.tenantId}
        </div>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: context.tenantId }
  });
  const terminology = getTerminology(tenant?.category);

  // DEBUG: Log the features being loaded
  console.log(`DEBUG: Loading dashboard for tenant ${context.tenantId}. Features:`, tenant?.enabledFeatures);

  const rawFeatures = tenant?.enabledFeatures as any;
  const enabledFeatures = (Array.isArray(rawFeatures) && rawFeatures.length > 0) 
    ? rawFeatures 
    : ["OVERVIEW", "LEDGER", "COMMS", "REPORTS", "SERVICES", "ROSTER", "CUSTOMERS", "SETTINGS", "SUPPORT"];

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
          <div style={{ fontSize: '0.6rem', background: 'var(--primary)', color: 'black', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900, marginBottom: '0.5rem' }}>V2.1 - ACTIVE</div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>Business Dashboard</h2>
          <p style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>{terminology.industryIcon} {tenant?.category || 'BARBER'}</p>
        </div>
        <nav className={styles.nav}>
          {enabledFeatures.includes("OVERVIEW") && <Link href="/dashboard" className={styles.navLink}>Overview</Link>}
          {(enabledFeatures.includes("LEDGER") || enabledFeatures.includes("SETTLEMENTS")) && (
            <>
              <Link href="/dashboard/appointments" className={styles.navLink}>Master Ledger</Link>
              <Link href="/dashboard/ledger" className={styles.navLink} style={{ color: 'var(--primary)', fontWeight: 700 }}>Financial Settlement</Link>
            </>
          )}
          {enabledFeatures.includes("COMMS") && <Link href="/dashboard/communications" className={styles.navLink} style={{ color: 'var(--primary)' }}>Communications Hub</Link>}
          {enabledFeatures.includes("REPORTS") && <Link href="/dashboard/reports" className={styles.navLink}>Advanced Reporting</Link>}
          {enabledFeatures.includes("SERVICES") && <Link href="/dashboard/services" className={styles.navLink}>{terminology.serviceLabelPlural}</Link>}
          {enabledFeatures.includes("ROSTER") && <Link href="/dashboard/roster" className={styles.navLink}>{terminology.rosterLabel}</Link>}
          {enabledFeatures.includes("CUSTOMERS") && <Link href="/dashboard/customers" className={styles.navLink}>Customer Directory</Link>}
          {enabledFeatures.includes("SETTINGS") && <Link href="/dashboard/settings" className={styles.navLink}>Shop Settings</Link>}
          {enabledFeatures.includes("SUPPORT") && <Link href="/dashboard/support" className={styles.navLink} style={{ marginTop: 'auto', color: 'var(--accent)' }}>Contact Support</Link>}
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
