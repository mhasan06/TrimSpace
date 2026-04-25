

"use client";
import Link from "next/link";

export default function LoginGateway() {
  return (
    <main style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', // Adjust for header
      background: '#000',
      overflow: 'hidden',
      color: '#fff'
    }}>
      {/* ─── LEFT: CINEMATIC IMAGE ─── */}
      <div style={{ 
        flex: 1.5, 
        background: `linear-gradient(to right, transparent 80%, #000), url('/luxury_barbershop_background_1777117654130.png') center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '5rem',
        position: 'relative'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>
            The Space for Excellence.
          </h2>
          <p style={{ fontSize: '1.25rem', fontWeight: 500, opacity: 0.7, maxWidth: '500px' }}>
            Enter a world-class marketplace where premium grooming meets effortless booking.
          </p>
        </div>
      </div>

      {/* ─── RIGHT: MINIMALIST LOGIN FORM ─── */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '5rem', 
        background: '#000',
        borderLeft: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '400px' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.8rem', letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '3.5rem', fontWeight: 500 }}>
            Choose your destination to continue your experience.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* For Customers */}
            <Link href="/customer-login" style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '16px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>For Connoisseurs</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Customer Access</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#64748b' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* For Partners */}
            <Link href="/partner-login" style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '16px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>For Masters</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>Business Access</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#64748b' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

          </div>

          <div style={{ marginTop: '4rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
              New to TrimSpace? <Link href="/register?type=business" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>Join as a Partner</Link> or <Link href="/register?type=customer" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>Create an Account</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
