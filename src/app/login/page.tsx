

import Link from "next/link";
import styles from "./page.module.css";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginGateway() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    if (role === "ADMIN" && !tenantId) {
      redirect("/admin");
    } else if (tenantId) {
      redirect("/dashboard");
    } else if (role === "CUSTOMER") {
      redirect("/my-bookings");
    }
  }
  return (
    <main className={styles.main}>
      <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--foreground)' }}>
          Welcome to <span style={{ color: 'var(--primary)' }}>TrimSpace</span>
        </h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.7, marginBottom: '3rem' }}>
          Please select your account type to continue
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Customer Option */}
          <Link href="/customer-login" style={{ textDecoration: 'none' }}>
            <div className="glass" style={{ 
              padding: '3rem 2rem', 
              borderRadius: '24px', 
              border: '1px solid var(--border)', 
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>For Customers</h2>
                <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>View your bookings, history, and book your next appointment.</p>
              </div>
              <div style={{ marginTop: 'auto', background: 'var(--primary)', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700 }}>
                Customer Login
              </div>
            </div>
          </Link>

          {/* Partner Option */}
          <Link href="/partner-login" style={{ textDecoration: 'none' }}>
            <div className="glass" style={{ 
              padding: '3rem 2rem', 
              borderRadius: '24px', 
              border: '1px solid var(--border)', 
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem'
            }}>
              <div style={{ width: '80px', height: '80px', background: 'rgba(var(--secondary-rgb), 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>For Partners</h2>
                <p style={{ opacity: 0.6, fontSize: '0.95rem' }}>Manage your shop, roster, services, and view performance stats.</p>
              </div>
              <div style={{ marginTop: 'auto', background: 'var(--secondary)', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 700 }}>
                Business Login
              </div>
            </div>
          </Link>

        </div>

      </div>
    </main>
  );
}
