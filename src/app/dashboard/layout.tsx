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
import LogoutButton from "@/components/LogoutButton";

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
    : ["OVERVIEW", "LEDGER", "COMMS", "REPORTS", "SERVICES", "ROSTER", "CUSTOMERS", "SETTINGS", "SUPPORT", "MARKETING"];

  const openTicketsCount = await prisma.supportTicket.count({
    where: { 
        tenantId: context.tenantId,
        status: { in: ["OPEN", "IN_PROGRESS"] }
    }
  });

  return (
    <div className={styles.dashboardContainer}>
      {context.isSupportMode && (
        <SupportSessionBanner 
          tenantName={context.tenantName!} 
          adminName={context.realAdminName!} 
        />
      )}
      
      <aside className={styles.sidebar}>
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.6rem', background: '#6366f1', color: '#fff', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900, marginBottom: '1rem' }}>v2.2 PRIME</div>
          <h2>{tenant?.name || 'Dashboard'}</h2>
          <p>{terminology.industryIcon} {tenant?.category || 'BUSINESS'}</p>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>📊 Overview</Link>
          
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Operations</div>
          {enabledFeatures.includes("SERVICES") && <Link href="/dashboard/services" className={styles.navLink}>✂️ {terminology.serviceLabelPlural}</Link>}
          {enabledFeatures.includes("ROSTER") && <Link href="/dashboard/roster" className={styles.navLink}>📅 {terminology.rosterLabel}</Link>}
          {enabledFeatures.includes("CUSTOMERS") && <Link href="/dashboard/customers" className={styles.navLink}>👥 Customers</Link>}
          
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Financials</div>
          {(enabledFeatures.includes("LEDGER") || enabledFeatures.includes("SETTLEMENTS")) && (
            <>
              <Link href="/dashboard/appointments" className={styles.navLink}>📜 Master Ledger</Link>
              <Link href="/dashboard/ledger" className={styles.navLink}>💰 Payouts</Link>
            </>
          )}

          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Growth</div>
          {enabledFeatures.includes("COMMS") && <Link href="/dashboard/communications" className={styles.navLink}>💬 Comms Hub</Link>}
          {enabledFeatures.includes("MARKETING") && <Link href="/dashboard/marketing" className={styles.navLink}>✨ Marketing</Link>}
          {enabledFeatures.includes("REPORTS") && <Link href="/dashboard/reports" className={styles.navLink}>📈 Analytics</Link>}

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            {enabledFeatures.includes("SETTINGS") && <Link href="/dashboard/settings" className={styles.navLink}>⚙️ Settings</Link>}
            {enabledFeatures.includes("SUPPORT") && (
                <Link href="/dashboard/support" className={styles.navLink} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>🛠️ Support Center</span>
                    {openTicketsCount > 0 && (
                        <span style={{ background: '#6366f1', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>{openTicketsCount}</span>
                    )}
                </Link>
            )}
          </div>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
             <h1>Welcome back, {session?.user?.name?.split(' ')[0] || 'Partner'}</h1>
             <p>Managing {tenant?.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{session?.user?.name}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b' }}>{(session?.user as any).role}</span>
            </div>
            <LogoutButton />
          </div>
        </header>
        
        <div style={{ minHeight: 'calc(100vh - 200px)' }}>
            {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
