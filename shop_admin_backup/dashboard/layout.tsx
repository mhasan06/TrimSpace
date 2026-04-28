import Link from "next/link";
import { LayoutDashboard, Scissors, CalendarDays, Users, FileText, Wallet, MessageSquare, Sparkles, LineChart, Settings, LifeBuoy } from "lucide-react";
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
        <div style={{ paddingBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1.2 }}>{tenant?.name || 'Dashboard'}</h2>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginTop: '8px', letterSpacing: '2px' }}>{tenant?.category || 'BUSINESS'}</p>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}><LayoutDashboard size={20} strokeWidth={2.5} /> Overview</Link>
          
          <div style={{ marginTop: '2rem', marginBottom: '0.8rem', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '1rem' }}>Operations</div>
          {enabledFeatures.includes("SERVICES") && <Link href="/dashboard/services" className={styles.navLink}><Scissors size={20} strokeWidth={2.5} /> {terminology.serviceLabelPlural}</Link>}
          {enabledFeatures.includes("ROSTER") && <Link href="/dashboard/roster" className={styles.navLink}><CalendarDays size={20} strokeWidth={2.5} /> {terminology.rosterLabel}</Link>}
          {enabledFeatures.includes("CUSTOMERS") && <Link href="/dashboard/customers" className={styles.navLink}><Users size={20} strokeWidth={2.5} /> Clients</Link>}
          
          <div style={{ marginTop: '2rem', marginBottom: '0.8rem', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '1rem' }}>Financials</div>
          {(enabledFeatures.includes("LEDGER") || enabledFeatures.includes("SETTLEMENTS")) && (
            <>
              <Link href="/dashboard/appointments" className={styles.navLink}><FileText size={20} strokeWidth={2.5} /> Master Ledger</Link>
              <Link href="/dashboard/ledger" className={styles.navLink}><Wallet size={20} strokeWidth={2.5} /> Payouts</Link>
            </>
          )}

          <div style={{ marginTop: '2rem', marginBottom: '0.8rem', fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', paddingLeft: '1rem' }}>Growth</div>
          {enabledFeatures.includes("COMMS") && <Link href="/dashboard/communications" className={styles.navLink}><MessageSquare size={20} strokeWidth={2.5} /> Comms Hub</Link>}
          {enabledFeatures.includes("MARKETING") && <Link href="/dashboard/marketing" className={styles.navLink}><Sparkles size={20} strokeWidth={2.5} /> Marketing</Link>}
          {enabledFeatures.includes("REPORTS") && <Link href="/dashboard/reports" className={styles.navLink}><LineChart size={20} strokeWidth={2.5} /> Analytics</Link>}

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            {enabledFeatures.includes("SETTINGS") && <Link href="/dashboard/settings" className={styles.navLink}><Settings size={20} strokeWidth={2.5} /> Settings</Link>}
            {enabledFeatures.includes("SUPPORT") && (
                <Link href="/dashboard/support" className={styles.navLink} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><LifeBuoy size={20} strokeWidth={2.5} /> Support</div>
                    {openTicketsCount > 0 && (
                        <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.7rem', fontWeight: 900, padding: '0.1rem 0.5rem', borderRadius: '12px' }}>{openTicketsCount}</span>
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
