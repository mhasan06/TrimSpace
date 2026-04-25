"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginGateway() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role === "MERCHANT") router.push("/dashboard");
      else if (role === "ADMIN") router.push("/admin");
      else router.push("/my-bookings");
    }
  }, [status, session, router]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (status === "loading") {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: isMobile ? '100vh' : 'calc(100vh - 80px)', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      overflowX: 'hidden',
      color: '#000'
    }}>
      {/* ─── LEFT/TOP: CINEMATIC IMAGE ─── */}
      <div style={{ 
        flex: isMobile ? 'none' : 1.5, 
        height: isMobile ? '30vh' : 'auto',
        background: `linear-gradient(to ${isMobile ? 'bottom' : 'right'}, transparent 70%, rgba(255,255,255,0.8)), url('/luxury_barbershop.png') center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: isMobile ? '2rem' : '5rem',
        position: 'relative',
        borderRight: isMobile ? 'none' : '1px solid rgba(0,0,0,0.05)',
        borderBottom: isMobile ? '1px solid rgba(0,0,0,0.05)' : 'none'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: isMobile ? '2rem' : '3.8rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.8rem', color: '#000' }}>
            {isMobile ? "The Space for Excellence." : "The Space for Excellence."}
          </h2>
          {!isMobile && (
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#334155', maxWidth: '500px', opacity: 0.9 }}>
              Enter a world-class marketplace where premium grooming meets effortless booking.
            </p>
          )}
        </div>
      </div>

      {/* ─── RIGHT/BOTTOM: MINIMALIST LOGIN FORM ─── */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: isMobile ? '2rem' : '5rem', 
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)'
      }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <h1 style={{ fontSize: isMobile ? '2rem' : '2.4rem', fontWeight: 950, marginBottom: '0.8rem', letterSpacing: '-0.02em', color: '#000' }}>
            Welcome back
          </h1>
          <p style={{ color: '#475569', fontSize: isMobile ? '1rem' : '1.1rem', marginBottom: isMobile ? '2rem' : '3.5rem', fontWeight: 600 }}>
            Choose your destination to continue your experience.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* For Customers */}
            <Link href="/customer-login" style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '1.2rem', 
                borderRadius: '20px', 
                background: '#fff', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#000', margin: 0 }}>For Connoisseurs</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Customer Access</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#cbd5e1' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* For Partners */}
            <Link href="/partner-login" style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '1.2rem', 
                borderRadius: '20px', 
                background: '#fff', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#000', margin: 0 }}>For Masters</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>Business Access</p>
                  </div>
                  <div style={{ marginLeft: 'auto', color: '#cbd5e1' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

          </div>

          <div style={{ marginTop: isMobile ? '2.5rem' : '4rem', padding: '1.2rem', borderRadius: '20px', background: 'rgba(255,255,255,0.5)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.6, fontWeight: 600, margin: 0 }}>
              New to TrimSpace? <Link href="/register?type=business" style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Join as a Partner</Link> or <Link href="/register?type=customer" style={{ color: '#000', fontWeight: 900, textDecoration: 'none' }}>Create an Account</Link>
            </p>
    </main>
  );
}
