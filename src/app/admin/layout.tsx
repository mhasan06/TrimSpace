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
      <aside className={`${styles.sidebar} glass`} style={{ borderRight: '1px solid var(--accent)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--foreground)' }}>Platform Admin</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.2rem' }}>Superuser Environment</p>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navLink}>Global Metrics</Link>
          <Link href="/admin/reports" className={styles.navLink} style={{ color: 'var(--primary)', fontWeight: 600 }}>Marketplace Analytics</Link>
          <Link href="/admin/variables" className={styles.navLink} style={{ color: '#fbbf24', fontWeight: 800 }}>✨ Platform Variables</Link>
          <Link href="/admin/shops" className={styles.navLink} style={{ color: 'var(--primary)', fontWeight: 800 }}>⚙️ Menu Access Control</Link>
          <Link href="/admin/shops" className={styles.navLink}>All Shops</Link>
          <Link href="/admin/users" className={styles.navLink}>All Users</Link>
          <Link href="/admin/payouts" className={styles.navLink}>Stripe Payouts</Link>
          <Link href="/admin/ledger" className={styles.navLink} style={{ color: 'var(--secondary)', fontWeight: 900 }}>🚀 Financial Command Center</Link>
          <Link href="/admin/finance" className={styles.navLink} style={{ color: 'var(--primary)', fontWeight: 600 }}>Financial Reporting</Link>
          <Link href="/admin/alerts" className={styles.navLink} style={{ marginTop: 'auto', color: '#ff4444' }}>System Alerts</Link>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={`${styles.header} glass`} style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 2rem', borderRadius: '16px' }}>
          <div>
             <h1 style={{ color: 'var(--foreground)', margin: 0, fontSize: '1.5rem' }}>Platform Admin</h1>
             <p style={{ color: 'var(--accent)', marginTop: '0.2rem', fontSize: '0.8rem', fontWeight: 700 }}>Global Superuser Environment</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#ff4444', border: '1px solid #ff4444', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>System Status: Operational</span>
            <LogoutButton />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
