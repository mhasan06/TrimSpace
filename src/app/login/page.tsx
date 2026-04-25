

"use client";
import Link from "next/link";

export default function LoginGateway() {
  return (
    <main style={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', // Adjust for header
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      overflow: 'hidden',
      color: '#000'
    }}>
      {/* ─── LEFT: CINEMATIC IMAGE ─── */}
      <div style={{ 
        flex: 1.5, 
        background: `linear-gradient(to right, transparent 70%, rgba(255,255,255,0.8)), url('/luxury_barbershop.png') center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '5rem',
        position: 'relative',
        borderRight: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '3.8rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.2rem', color: '#000' }}>
            The Space for Excellence.
          </h2>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155', maxWidth: '500px', opacity: 0.9 }}>
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
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)'
      }}>
        <div style={{ maxWidth: '400px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 950, marginBottom: '0.8rem', letterSpacing: '-0.02em', color: '#000' }}>
            Welcome back
          </h1>
          <p style={{ color: '#475569', fontSize: '1.1rem', marginBottom: '3.5rem', fontWeight: 600 }}>
            Choose your destination to continue your experience.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* For Customers */}
            <Link href="/customer-login" style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '1.5rem', 
                borderRadius: '20px', 
                background: 'rgba(255,255,255,0.7)', 
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.06)';
                e.currentTarget.style.background = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{ width: '48px', height: '48px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#000', marginBottom: '0.2rem' }}>For Connoisseurs</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Customer Access</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#cbd5e1' }}>
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
                borderRadius: '20px', 
                background: 'rgba(255,255,255,0.7)', 
                border: '1px solid rgba(255,255,255,0.5)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.06)';
                e.currentTarget.style.background = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <div style={{ width: '48px', height: '48px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#000', marginBottom: '0.2rem' }}>For Masters</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Business Access</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#cbd5e1' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

          </div>

          <div style={{ marginTop: '4rem', padding: '1.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.5)', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 600 }}>
              New to TrimSpace? <Link href="/register?type=business" style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Join as a Partner</Link> or <Link href="/register?type=customer" style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Create an Account</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
