"use client";
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function NavHeader() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = (session?.user as any)?.role;
  const userImage = session?.user?.image;

  // Handle window resize for mobile check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header style={{ 
      padding: isMobile ? '0.8rem 1.2rem' : '1.2rem 2.5rem', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    }}>
      {/* ─── LOGO ─── */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <div style={{ background: '#000', color: 'white', borderRadius: '10px', padding: isMobile ? '0.4rem' : '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={isMobile ? "18" : "22"} height={isMobile ? "18" : "22"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
          </svg>
        </div>
        {!isMobile && <h1 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#000', margin: 0, letterSpacing: '-0.8px' }}>TrimSpace</h1>}
      </Link>
      
      {/* ─── NAV LINKS ─── */}
      <nav style={{ display: 'flex', gap: isMobile ? '1rem' : '2.2rem', alignItems: 'center' }}>
        
        {!isMobile && (
          <>
            <Link href="/gift" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#000', textDecoration: 'none', opacity: 0.8 }}>
              Share a Gift Experience
            </Link>
            {!session && (
              <Link href="/login" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#000', textDecoration: 'none', opacity: 0.8 }}>
                Log in
              </Link>
            )}
            <Link href="/register?type=business" style={{ 
              fontWeight: 800, 
              fontSize: '0.95rem', 
              color: '#000', 
              textDecoration: 'none', 
              padding: '0.8rem 1.4rem', 
              borderRadius: '40px', 
              border: '1px solid #e2e8f0',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Become a Partner
            </Link>
          </>
        )}

        {/* ─── USER AVATAR / MENU ─── */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.8rem', 
              padding: isMobile ? '0.4rem 0.6rem' : '0.4rem 0.8rem', 
              borderRadius: '40px', 
              border: '1px solid #e2e8f0', 
              background: '#fff', 
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              
              {session ? (
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  background: '#000', 
                  overflow: 'hidden', 
                  border: '2px solid #fff',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 900
                }}>
                  {userImage ? (
                    <img src={userImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{(session?.user?.name?.[0] || 'T').toUpperCase()}</span>
                  )}
                </div>
              ) : (
                <div style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: '50%', 
                  background: '#f1f5f9', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#64748b',
                  border: '1px solid #e2e8f0'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
            </div>
          </button>

          {showMenu && (
            <div style={{ 
              position: 'absolute', 
              top: 'calc(100% + 12px)', 
              right: 0, 
              width: isMobile ? 'calc(100vw - 2.4rem)' : '300px', 
              background: '#fff', 
              borderRadius: '24px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)', 
              border: '1px solid #f1f5f9', 
              padding: '1.5rem',
              textAlign: 'left'
            }}>
              {/* Profile Section */}
              {session && (
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>
                      {userImage ? <img src={userImage} style={{ width: '100%', borderRadius: '50%' }} /> : (session?.user?.name?.[0] || 'T')}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{session?.user?.name || 'Partner'}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{session?.user?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* For Customers */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>For connoisseurs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {!session ? (
                    <Link href="/login" style={{ textDecoration: 'none', color: '#000', fontWeight: 900, fontSize: '1rem' }}>Log in or sign up</Link>
                  ) : (
                    <Link href="/my-bookings" style={{ textDecoration: 'none', color: '#000', fontWeight: 700, fontSize: '1rem' }}>My Bookings</Link>
                  )}
                  <Link href="/gift" style={{ textDecoration: 'none', color: '#000', fontWeight: 700, fontSize: '1rem' }}>Share a Gift Experience</Link>
                  <Link href="/support" style={{ textDecoration: 'none', color: '#000', fontWeight: 700, fontSize: '1rem' }}>Help and support</Link>
                  {isMobile && (
                    <>
                      <div style={{ height: '1px', background: '#f1f5f9', margin: '0.5rem 0' }}></div>
                      <Link href="/register?type=business" style={{ textDecoration: 'none', color: '#000', fontWeight: 900, fontSize: '1rem' }}>Become a Partner</Link>
                    </>
                  )}
                </div>
              </div>

              {session && (
                <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '1rem', paddingTop: '1rem' }}>
                  <button onClick={() => signOut()} style={{ border: 'none', background: 'none', color: '#ff4444', fontWeight: 800, fontSize: '0.95rem', textAlign: 'left', cursor: 'pointer', padding: 0 }}>Log out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
