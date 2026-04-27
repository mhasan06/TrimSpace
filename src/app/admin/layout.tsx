import Link from "next/link";
import styles from "../dashboard/page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Strict Super-Admin Checking
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && process.env.NODE_ENV === "production") {
    redirect("/");
  }

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.6rem', background: '#ef4444', color: '#fff', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900, marginBottom: '1rem' }}>SYSTEM ADMIN</div>
          <h2>Platform Control</h2>
          <p>Superuser Environment</p>
        </div>

        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>🌍 Global Metrics</Link>
          <Link href="/admin/reports" className={styles.navLink}>📊 Marketplace Analytics</Link>
          
          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Management</div>
          <Link href="/admin/shops" className={styles.navLink}>🏪 All Shops</Link>
          <Link href="/admin/users" className={styles.navLink}>👥 All Users</Link>
          <Link href="/admin/variables" className={styles.navLink}>✨ Platform Variables</Link>

          <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>Financial command</div>
          <Link href="/admin/ledger" className={styles.navLink}>🚀 Financial Center</Link>
          <Link href="/admin/payouts" className={styles.navLink}>💳 Stripe Payouts</Link>
          <Link href="/admin/finance" className={styles.navLink}>🏦 Financial Reporting</Link>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <Link href="/admin/alerts" className={styles.navLink} style={{ color: '#f87171' }}>🚨 System Alerts</Link>
          </div>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
             <h1>Platform Administration</h1>
             <p style={{ color: '#ef4444' }}>Global Master Control</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, border: '1px solid rgba(16,185,129,0.2)' }}>
                System: Operational
            </div>
            <LogoutButton />
          </div>
        </header>
        <div style={{ minHeight: 'calc(100vh - 200px)' }}>
            {children}
        </div>
      </main>
    </div>
  );
}
