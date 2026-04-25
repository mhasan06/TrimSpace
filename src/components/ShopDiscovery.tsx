"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "../app/page.module.css";

type Tenant = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  address: string | null;
  suburb?: string | null;
  description?: string | null;
  phone?: string | null;
  isActive: boolean;
  shopImage?: string | null;
  rating?: string;
  isLive?: boolean;
};

export default function ShopDiscovery({ initialTenants }: { initialTenants: Tenant[] }) {
  const [query, setQuery] = useState("");
  const [where, setWhere] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuburbs, setShowSuburbs] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Extract unique suburbs from existing shops + add common ones for "live" feel
  const allSuburbs = useMemo(() => {
    const s = new Set<string>();
    // Pre-seed with major regions for better discovery feel
    ["Sydney", "Bondi Beach", "Surry Hills", "Paddington", "Darlinghurst", "Parramatta", "Chatswood", "Manly", "Cronulla"].forEach(reg => s.add(reg));
    
    initialTenants.forEach(t => {
      // Prioritize explicit suburb field
      if (t.suburb) {
        s.add(t.suburb);
      } else if (t.address) {
        // Fallback for legacy address strings
        const parts = t.address.split(',');
        if (parts.length > 0) s.add(parts[0].trim());
      }
    });
    return Array.from(s).filter(Boolean).sort() as string[];
  }, [initialTenants]);

  const matchingSuburbs = useMemo(() => {
    if (!where || where.length < 1) return []; // Trigger on 1 character
    return allSuburbs.filter(s => s.toLowerCase().includes(where.toLowerCase())).slice(0, 10);
  }, [allSuburbs, where]);

  const filteredTenants = useMemo(() => {
    return initialTenants.filter(t => {
      const matchesQuery = !query || 
        t.name.toLowerCase().includes(query.toLowerCase()) || 
        (t.description?.toLowerCase().includes(query.toLowerCase()));
      
      const shopSuburb = t.suburb?.toLowerCase() || "";
      const shopAddress = t.address?.toLowerCase() || "";
      const matchesWhere = !where || shopSuburb.includes(where.toLowerCase()) || shopAddress.includes(where.toLowerCase());
      
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      return matchesQuery && matchesWhere && matchesCategory;
    });
  }, [initialTenants, query, where, selectedCategory]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setWhere("Current Location");
        setIsLocating(false);
      },
      (error) => {
        console.error("Geo Error:", error);
        setIsLocating(false);
        if (error.code === 1) {
          alert("Location access denied. Please enable location permissions in your browser settings or type your suburb.");
        } else if (error.code === 3) {
          alert("Location request timed out. Please try again or type your suburb.");
        } else {
          alert("Unable to retrieve your location. Please type your suburb.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>
      
      {/* ─── PROFESSIONAL LIGHT HERO ─── */}
      <section className={styles.heroSection} style={{ 
        height: '70vh', 
      <div style={{ 
        padding: '120px 20px', 
        textAlign: 'center', 
        background: 'linear-gradient(180deg, #f8fafc 0%, var(--background) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: '1000px', width: '100%' }}>
          <h1 style={{ fontSize: '4.5rem', fontWeight: 950, marginBottom: '0.5rem', letterSpacing: '-0.04em', lineHeight: 1, color: '#020617' }}>
            Book local self-care services.
          </h1>
          <p style={{ fontSize: '1.4rem', color: '#475569', marginBottom: '4rem', fontWeight: 500, letterSpacing: '-0.01em' }}>
            Top-rated salons, barbers, and beauty experts trusted worldwide.
          </p>
          
          <div className="glass" style={{ 
            display: 'flex', 
            background: '#fff', 
            borderRadius: '24px', 
            padding: '12px', 
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.1)',
            flexWrap: 'wrap',
            gap: '0',
            border: '1px solid #f1f5f9',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ flex: 2, minWidth: '250px', padding: '12px 16px', textAlign: 'left', borderRight: '1px solid #f1f5f9' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Service or Venue</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Haircut, Spa, Barber..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ border: 'none', flex: 1, outline: 'none', color: '#334155', fontSize: '1rem', fontWeight: 600, background: 'transparent', minWidth: '0' }}
                />
                <select 
                  value={selectedCategory || ""} 
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  style={{ 
                    border: 'none', 
                    background: '#f1f5f9', 
                    padding: '4px 8px', 
                    borderRadius: '8px', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    outline: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <option value="">All Types</option>
                  <option value="BARBER">Barbershop</option>
                  <option value="SALON">Hair Salon</option>
                  <option value="SPA">Spa & Wellness</option>
                  <option value="SKIN">Skin Care</option>
                  <option value="NAILS">Nails</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1.2, minWidth: '180px', padding: '12px 16px', textAlign: 'left', borderRight: 'none', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Where?</label>
                <button 
                  onClick={handleUseCurrentLocation}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', padding: 0, opacity: isLocating ? 0.5 : 1 }}
                  title="Use my location"
                >
                  {isLocating ? '⌛' : '📍'}
                </button>
              </div>
              <input 
                type="text" 
                placeholder="Suburb or City" 
                value={where}
                onChange={(e) => {
                  setWhere(e.target.value);
                  setShowSuburbs(true);
                }}
                onFocus={() => setShowSuburbs(true)}
                onBlur={() => setTimeout(() => setShowSuburbs(false), 200)}
                style={{ border: 'none', width: '100%', outline: 'none', color: '#334155', fontSize: '1rem', fontWeight: 600, background: 'transparent' }}
              />

              {/* Suburb Dropdown */}
              {showSuburbs && matchingSuburbs.length > 0 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  background: 'white', 
                  zIndex: 2147483647, // Max Z-index to ensure it is above everything
                  marginTop: '10px', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  border: '1px solid #eef2f6',
                  padding: '0.5rem'
                }}>
                  {matchingSuburbs.map(s => (
                    <div 
                      key={s} 
                      onClick={() => { setWhere(s); setShowSuburbs(false); }}
                      style={{ 
                        padding: '0.8rem 1rem', 
                        cursor: 'pointer', 
                        fontSize: '0.95rem', 
                        fontWeight: 700, 
                        color: '#334155', 
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#334155';
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📍</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button style={{ 
              background: 'var(--primary)', 
              color: '#fff', 
              border: 'none', 
              padding: '0 3rem', 
              borderRadius: '14px', 
              fontWeight: 900, 
              cursor: 'pointer',
              fontSize: '1.1rem',
              transition: 'background 0.2s',
              margin: '4px'
            }}>
              Search
            </button>
          </div>
        </div>
      </section>


      {/* ─── POPULAR SHOPS GRID ─── */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem 6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
            <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e293b' }}>Popular Destinations</h2>
                <p style={{ color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>Top-rated professionals across your network</p>
            </div>
            {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>Reset Filters</button>
            )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2.5rem' }}>
            {filteredTenants.map((tenant) => {
                const targetHref = (tenant.isLive && tenant.slug) 
                    ? `/${tenant.slug}` 
                    : `/coming-soon?name=${encodeURIComponent(tenant.name)}`;
                
                return (
                    <Link key={tenant.id} href={targetHref} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ 
                            background: '#fff', 
                            borderRadius: '24px', 
                            overflow: 'hidden', 
                            border: '1px solid #f1f5f9',
                            position: 'relative',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-12px)';
                            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.08)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)';
                        }}>
                        <div style={{ 
                            height: '250px', 
                            backgroundImage: `url("${tenant.shopImage}")`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center',
                            position: 'relative'
                        }}>
                             <div style={{ position: 'absolute', top: '1.2rem', left: '1.2rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', color: '#1e293b', padding: '0.4rem 1rem', borderRadius: '40px', fontSize: '0.75rem', fontWeight: 800, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                {tenant.category || "PREMIUM"}
                             </div>
                             <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', background: 'var(--primary)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
                                ⭐ {tenant.rating}
                             </div>
                        </div>
                            <div style={{ padding: '1.8rem' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.6rem' }}>{tenant.name}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>{tenant.address}</p>
                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: tenant.isLive ? 'var(--secondary)' : '#94a3b8', letterSpacing: '0.5px' }}>
                                        {tenant.isLive ? 'Next Available' : 'Onboarding'}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                                        {tenant.isLive ? 'Today, 2:00 PM' : 'Verify Opening'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
      </section>

      {/* ─── PROFESSIONAL B2B SECTION ─── */}
      <section style={{ background: '#f8fafc', padding: '8rem 2rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '5rem', alignItems: 'center' }}>
              <div>
                  <h4 style={{ color: 'var(--primary)', fontWeight: 900, letterSpacing: '2px', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1.2rem' }}>TrimSpace for Partners</h4>
                  <h2 style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.05, color: '#0f172a', marginBottom: '1.8rem' }}>Scale your business, not your workload.</h2>
                  <p style={{ fontSize: '1.15rem', color: '#475569', marginBottom: '2.8rem', lineHeight: 1.7 }}>The unified commerce platform for barbers, spas, and luxury studios. Automated scheduling, real-time financial settlements, and data-driven growth tools.</p>
                  <div style={{ display: 'flex', gap: '1.2rem' }}>
                      <Link href="/partner-login" style={{ background: '#0f172a', color: '#fff', padding: '1.1rem 2.22rem', borderRadius: '14px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>List your business</Link>
                      <Link href="/pricing" style={{ border: '2px solid #e2e8f0', color: '#475569', padding: '1rem 2.2rem', borderRadius: '14px', fontWeight: 700, textDecoration: 'none' }}>View pricing</Link>
                  </div>
              </div>
              <div style={{ position: 'relative' }}>
                  <div style={{ background: '#fff', padding: '3rem', borderRadius: '40px', border: '1px solid #e2e8f0', boxShadow: '0 40px 60px -20px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                          <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary)' }}>2.5%</div>
                              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginTop: '0.5rem' }}>Flat Rate</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--secondary)' }}>0s</div>
                              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginTop: '0.5rem' }}>Payout Lead</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent)' }}>24/7</div>
                              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginTop: '0.5rem' }}>Auto Sync</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#3b82f6' }}>PWA</div>
                              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, marginTop: '0.5rem' }}>App Native</p>
                          </div>
                      </div>
                  </div>
                  {/* Decorative badge */}
                  <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', background: 'var(--secondary)', color: '#fff', padding: '1rem 1.5rem', borderRadius: '20px', fontWeight: 900, fontSize: '0.8rem', boxShadow: '0 10px 15px rgba(16,185,129,0.3)' }}>
                      TRUSTED BY 1k+ SHOPS
                  </div>
              </div>
          </div>
      </section>

      {/* ─── FINAL CLEAN CTA ─── */}
      <section style={{ padding: '9rem 2rem', textAlign: 'center', background: '#fff' }}>
          <h2 style={{ fontSize: '3.6rem', fontWeight: 900, color: '#0f172a', marginBottom: '1.5rem', letterSpacing: '-1px' }}>Elevate your routine.</h2>
          <p style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: '650px', margin: '0 auto 3.5rem', lineHeight: 1.6 }}>Thousands of quality-focused clients book their next transformation on TrimSpace every day. Join the future of beauty commerce.</p>
          <Link href="/download" style={{ 
            background: 'var(--primary)', 
            color: '#fff', 
            padding: '1.3rem 3.5rem', 
            borderRadius: '16px', 
            fontWeight: 800, 
            fontSize: '1.15rem', 
            textDecoration: 'none', 
            boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            Get the App for iOS & Android
          </Link>
      </section>
    </div>
  );
}
