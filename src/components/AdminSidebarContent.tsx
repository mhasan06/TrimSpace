"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebarContent({ openTicketsCount, styles }: { openTicketsCount: number, styles: any }) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/admin') return pathname === '/admin';
        return pathname?.startsWith(path);
    };

    const linkClass = (path: string) => `${styles.navLink} ${isActive(path) ? styles.activeNavLink : ''}`;

    return (
        <>
            <div className={styles.navSectionLabel}>Marketplace Intelligence</div>
            <Link href="/admin" className={linkClass("/admin")}>🌍 Global Metrics</Link>
            <Link href="/admin/reports" className={linkClass("/admin/reports")}>📊 Marketplace Analytics</Link>
            
            <div className={styles.navSectionLabel}>Entity Management</div>
            <Link href="/admin/shops" className={linkClass("/admin/shops")}>🏪 All Shops</Link>
            <Link href="/admin/users" className={linkClass("/admin/users")}>👥 All Users</Link>
            <Link href="/admin/variables" className={linkClass("/admin/variables")}>✨ Platform Variables</Link>

            <div className={styles.navSectionLabel}>Financial Command</div>
            <Link href="/admin/ledger" className={linkClass("/admin/ledger")}>🚀 Financial Center</Link>
            <Link href="/admin/payouts" className={linkClass("/admin/payouts")}>💳 Stripe Payouts</Link>
            <Link href="/admin/finance" className={linkClass("/admin/finance")}>🏦 Financial Reporting</Link>

            <div className={styles.navSectionLabel}>Network Ops</div>
            <Link href="/admin/support" className={linkClass("/admin/support")} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📧 Support Hub</span>
                {openTicketsCount > 0 && (
                    <span style={{ background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '0.1rem 0.4rem', borderRadius: '10px' }}>{openTicketsCount}</span>
                )}
            </Link>
            <Link href="/admin/developer" className={linkClass("/admin/developer")}>🛠️ System Diagnostics</Link>
        </>
    );
}
