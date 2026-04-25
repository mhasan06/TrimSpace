"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div style={{ padding: '100px', textAlign: 'center', fontWeight: 800 }}>Loading...</div>;
  if (!session) redirect("/customer-login");

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      padding: '4rem 1.2rem 8rem' 
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: '#fff', padding: '3rem', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '50%', 
              background: '#000', 
              margin: '0 auto 1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              fontSize: '2.5rem',
              fontWeight: 900,
              border: '4px solid #fff',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}>
              {session.user?.image ? (
                <img src={session.user.image} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span>{(session.user?.name?.[0] || 'T').toUpperCase()}</span>
              )}
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 950, color: '#000', marginBottom: '0.5rem' }}>{session.user?.name}</h1>
            <p style={{ color: '#64748b', fontWeight: 600 }}>{session.user?.email}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Link href="/my-bookings" style={{ textDecoration: 'none', background: '#f8fafc', padding: '1.2rem', borderRadius: '16px', color: '#000', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              My Appointments <span>→</span>
            </Link>
            <Link href="/favorites" style={{ textDecoration: 'none', background: '#f8fafc', padding: '1.2rem', borderRadius: '16px', color: '#000', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Saved Favorites <span>→</span>
            </Link>
            <Link href="/settings" style={{ textDecoration: 'none', background: '#f8fafc', padding: '1.2rem', borderRadius: '16px', color: '#000', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Account Settings <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
