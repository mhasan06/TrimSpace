"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCustomerFavorites } from "./actions";

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = session?.user as any;
    if (user?.id) {
      loadFavorites();
    }
  }, [session]);

  const loadFavorites = async () => {
    setLoading(true);
    const res = await getCustomerFavorites();
    if (res.favorites) {
      setFavorites(res.favorites);
    }
    setLoading(false);
  };

  if (status === "loading" || loading) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: 800 }}>Loading...</div>;
  if (!session) redirect("/customer-login");

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
      padding: '4rem 1.2rem 8rem' 
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: '#000', marginBottom: '0.8rem', letterSpacing: '-0.04em' }}>Your Favorites</h1>
        <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '3rem' }}>The world-class venues you love most.</p>

        {favorites.length === 0 ? (
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
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {favorites.map((shop) => (
              <Link 
                key={shop.id} 
                href={`/${shop.slug}`}
                style={{ 
                  background: 'white', 
                  borderRadius: '24px', 
                  overflow: 'hidden', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.03)',
                  border: '1px solid #f1f5f9',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: '180px', background: `url(${shop.shopImage || '/luxury_barbershop.png'}) center/cover` }} />
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '1.2rem', margin: 0 }}>{shop.name}</h3>
                    <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.6rem', fontWeight: 900, padding: '0.3rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase' }}>{shop.category}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginBottom: '1rem' }}>{shop.address || 'Premium Location'}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6366f1', fontWeight: 800, fontSize: '0.85rem' }}>
                    <span>Book Now</span>
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
