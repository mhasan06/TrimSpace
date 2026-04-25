"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function FavoritesPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div style={{ padding: '100px', textAlign: 'center', fontWeight: 800 }}>Loading...</div>;
  if (!session) redirect("/customer-login");

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      padding: '4rem 1.2rem 8rem' 
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: '#000', marginBottom: '0.8rem', letterSpacing: '-0.04em' }}>Your Favorites</h1>
        <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '3rem' }}>The world-class venues you love most.</p>

        <div style={{ 
          background: 'rgba(255,255,255,0.6)', 
          backdropFilter: 'blur(20px)', 
          padding: '4rem 2rem', 
          borderRadius: '32px', 
          border: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>❤️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#000', marginBottom: '1rem' }}>No favorites yet</h2>
          <p style={{ color: '#64748b', fontWeight: 500, marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>Start exploring top-rated shops and tap the heart icon to save them to your personal collection.</p>
          <Link href="/" style={{ background: '#000', color: '#fff', padding: '1.2rem 2.5rem', borderRadius: '16px', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>Discover Shops</Link>
        </div>
      </div>
    </main>
  );
}
