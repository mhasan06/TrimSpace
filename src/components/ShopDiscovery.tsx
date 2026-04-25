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

  // Extract unique suburbs from existing shops for autocomplete
  const allSuburbs = useMemo(() => {
    const s = new Set<string>();
    initialTenants.forEach(t => {
      if (t.address) {
        const parts = t.address.split(',');
        if (parts.length > 0) s.add(parts[0].trim());
      }
    });
    return Array.from(s).sort();
  }, [initialTenants]);

  const matchingSuburbs = useMemo(() => {
    if (!where || where.length < 2) return [];
    return allSuburbs.filter(s => s.toLowerCase().includes(where.toLowerCase())).slice(0, 5);
  }, [allSuburbs, where]);

  const filteredTenants = useMemo(() => {
    return initialTenants.filter(t => {
      const matchesName = t.name.toLowerCase().includes(query.toLowerCase());
      const matchesLoc = !where || (t.address?.toLowerCase().includes(where.toLowerCase()));
      const matchesCat = !selectedCategory || t.category === selectedCategory;
      return matchesName && matchesLoc && matchesCat;
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
        // In a real app, you'd use a Geocoding API (Google/OSM) here
        // For now, we'll simulate finding the nearest suburb or just setting a 'Near Me' state
        setWhere("Current Location");
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        setIsLocating(false);
        alert("Unable to retrieve your location. Please type your suburb.");
      }
    );
  };

  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh' }}>
      
      {/* ─── PROFESSIONAL LIGHT HERO ─── */}
      <section className={styles.heroSection} style={{ 
        height: '70vh', 
        minHeight: '500px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center', 
        padding: '0 1rem',
        background: 'linear-gradient(180deg, #f0f4ff 0%, var(--background) 100%)'
      }}>
        <div style={{ maxWidth: '800px', width: '100%' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '2rem', lineHeight: 1.1, color: '#1e293b' }}>
            Style, delivered.<br/><span style={{ color: 'var(--primary)' }}>Book the best near you.</span>
          </h1>
          
          <div className="glass" style={{ 
            display: 'flex', 
            background: '#fff', 
            borderRadius: '20px', 
            padding: '10px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
            flexWrap: 'wrap',
            gap: '8px',
            border: '1px solid #eef2f6'
          }}>
            <div style={{ flex: 1.5, minWidth: '200px', padding: '12px 16px', textAlign: 'left', borderRight: '1px solid #f1f5f9' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Service or Venue</label>
              <input 
                type="text" 
                placeholder="What are you looking for?" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: 'none', width: '100%', outline: 'none', color: '#334155', fontSize: '1rem', fontWeight: 600, background: 'transparent' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px', padding: '12px 16px', textAlign: 'left', borderRight: '1px solid #f1f5f9', position: 'relative' }}>
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
                <div className="glass" style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  background: 'white', 
                  zIndex: 100, 
                  marginTop: '10px', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  border: '1px solid #f1f5f9'
                }}>
                  {matchingSuburbs.map(s => (
                    <div 
                      key={s} 
                      onClick={() => { setWhere(s); setShowSuburbs(false); }}
                      style={{ padding: '0.8rem 1rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#475569', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      🏙️ {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ flex: 0.8, minWidth: '120px', padding: '12px 16px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>When?</label>
              <div style={{ color: '#334155', fontSize: '1rem', fontWeight: 600 }}>Any Date</div>
            </div>
            <button style={{ 
              background: 'var(--primary)', 
              color: '#fff', 
              border: 'none', 
              padding: '0 2.5rem', 
              borderRadius: '14px', 
              fontWeight: 900, 
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s'
            }}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ─── CATEGORY CHIPS ─── */}
      <section style={{ padding: '0 2rem 4rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: "Barbershop", key: "BARBER" },
            { label: "Hair Salon", key: "SALON" },
            { label: "Spa & Wellness", key: "SPA" },
            { label: "Skin Care", key: "SKIN" },
            { label: "Nails", key: "NAILS" }
          ].map((cat) => (
            <button 
              key={cat.key}
              onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
              style={{
                padding: '0.75rem 1.7rem',
                borderRadius: '50px',
                border: selectedCategory === cat.key ? 'none' : '1px solid var(--border)',
                background: selectedCategory === cat.key ? 'var(--primary)' : '#fff',
                color: selectedCategory === cat.key ? '#fff' : '#475569',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: selectedCategory === cat.key ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'var(--shadow-sm)'
              }}
            >
              {cat.label}
            </button>
          ))}
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
