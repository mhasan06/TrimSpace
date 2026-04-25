"use client";
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function NavHeader() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = (session?.user as any)?.role;
  const displayName = (session?.user as any)?.tenantId 
    ? (session?.user as any)?.tenantName || 'Business'
    : session?.user?.name || 'Account';

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
      padding: '1.2rem 2.5rem', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.05)'
    }}>
      {/* ─── LOGO ─── */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <div style={{ background: '#000', color: 'white', borderRadius: '10px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#000', margin: 0, letterSpacing: '-0.8px' }}>TrimSpace</h1>
      </Link>
      
      {/* ─── NAV LINKS ─── */}
      <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link href="/gift" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#000', textDecoration: 'none', opacity: 0.8 }}>
          Share a Gift Experience
        </Link>
        
        {!session ? (
          <Link href="/login" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#000', textDecoration: 'none', opacity: 0.8 }}>
            Log in
          </Link>
        ) : (
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#000', opacity: 0.5 }}>
            {displayName}
          </span>
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
          List your business
        </Link>
        
        {/* ─── MENU DROPDOWN ─── */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.8rem', 
              padding: '0.6rem 1.2rem', 
              borderRadius: '40px', 
              border: '1px solid #e2e8f0', 
              background: '#fff', 
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '1rem'
            }}
          >
            Menu
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {showMenu && (
            <div style={{ 
              position: 'absolute', 
              top: 'calc(100% + 12px)', 
              right: 0, 
              width: '280px', 
              background: '#fff', 
              borderRadius: '16px', 
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)', 
              border: '1px solid #f1f5f9', 
              padding: '1.5rem',
              textAlign: 'left'
            }}>
              {/* For Customers */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1rem', color: '#000' }}>For customers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {!session ? (
                    <Link href="/login" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.95rem' }}>Log in or sign up</Link>
                  ) : (
                    <button onClick={() => signOut()} style={{ border: 'none', background: 'none', color: '#ff4444', fontWeight: 800, fontSize: '0.95rem', textAlign: 'left', cursor: 'pointer', padding: 0 }}>Log out</button>
                  )}
                  <Link href="/gift" style={{ textDecoration: 'none', color: '#000', fontWeight: 700, fontSize: '0.95rem', opacity: 0.8 }}>Share a Gift Experience</Link>
                  <Link href="/download" style={{ textDecoration: 'none', color: '#000', fontWeight: 700, fontSize: '0.95rem', opacity: 0.8 }}>Download the app</Link>
                  <Link href="/support" style={{ textDecoration: 'none', color: '#000', fontWeight: 700, fontSize: '0.95rem', opacity: 0.8 }}>Help and support</Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000', fontWeight: 700, fontSize: '0.95rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    🌐 English (AU)
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '0 -1.5rem 1.5rem' }}></div>

              {/* For Businesses */}
              <div>
                <Link href="/register?type=business" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: '#000' }}>
                  <span style={{ fontWeight: 900, fontSize: '1rem' }}>For businesses</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
