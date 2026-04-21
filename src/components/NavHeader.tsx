"use client";
import { signOut, useSession } from "next-auth/react";

export default function NavHeader() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const displayName = (session?.user as any)?.tenantId 
    ? `Shop: ${(session?.user as any)?.tenantName || 'Business'}` 
    : `User: ${session?.user?.name || 'Account'}`;

  return (
    <header className="glass" style={{ padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
        <div style={{ background: 'var(--primary)', color: 'white', borderRadius: '8px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.5px' }}>Trim<span style={{ color: 'var(--primary)' }}>Space</span></h1>
      </a>
      
      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <a href="/" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)', textDecoration: 'none' }}>Home</a>
        
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', padding: '0 1rem' }}>
           <button 
             onClick={() => window.location.href = '/#search-anchor'}
             style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
             📅 Online Booking
           </button>
           <button 
             onClick={() => window.location.href = '/gift'}
             style={{ background: 'none', border: 'none', color: 'var(--foreground)', opacity: 0.7, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
             🎁 Send Gift
           </button>
        </div>

        <a href="/pricing" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)', textDecoration: 'none' }}>Pricing</a>
        <a href="/download" style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)', textDecoration: 'none' }}>⬇️ Apps Download</a>
        
        {session ? (
          <>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)', opacity: 0.8 }}>
              {displayName}
            </span>
            
            {(role === "BARBER" || (role === "ADMIN" && (session?.user as any)?.tenantId)) && (
              <a href="/dashboard" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', textDecoration: 'none' }}>Dashboard</a>
            )}
            
            {role === "CUSTOMER" && (
              <a href="/my-bookings" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--primary)', textDecoration: 'none' }}>My Bookings</a>
            )}
            
            {role === "ADMIN" && !(session?.user as any)?.tenantId && (
               <a href="/admin" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent)', textDecoration: 'none' }}>Platform Admin</a>
            )}
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.2s', color: '#ff4444' }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <a href="/login" style={{ fontWeight: 600, transition: 'color 0.2s', textDecoration: 'none', color: 'var(--foreground)' }}>Log In</a>
            <a href="/register?type=business" style={{ fontWeight: 600, transition: 'color 0.2s', border: '1px solid var(--primary)', background: 'var(--primary)', padding: '0.4rem 1.2rem', borderRadius: '8px', color: 'white', textDecoration: 'none' }}>Open A Shop</a>
          </>
        )}
      </nav>
    </header>
  );
}
