import Link from "next/link";
import styles from "./admin.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { prisma } from "@/lib/prisma";
import AdminSidebarContent from "@/components/AdminSidebarContent";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Strict Super-Admin Checking
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    redirect("/");
  }

  const openTicketsCount = await prisma.supportTicket.count({
    where: { status: "OPEN" }
  });

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
          <div className={styles.systemBadge}>PLATFORM ADMIN</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '-0.03em' }}>Command Center</h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem', fontWeight: 600 }}>Global Marketplace Control</p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AdminSidebarContent openTicketsCount={openTicketsCount} styles={styles} />
          
          <div className={styles.footer}>
            <Link href="/admin/alerts" className={`${styles.navLink} ${styles.specialLink}`}>🚨 Critical Alerts</Link>
          </div>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
             <h1 style={{ color: '#ffffff', margin: 0, fontSize: '2.25rem', fontWeight: 900 }}>Administrative Console</h1>
             <p style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '0.4rem' }}>Global Root Access</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className={styles.statusIndicator}>
                <div className={styles.statusPulse} />
                SYSTEM: OPERATIONAL
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
