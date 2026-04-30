"use client";

import { useState, useMemo, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const allSuburbs = useMemo(() => {
    const s = new Set<string>();
    ["Sydney", "Bondi Beach", "Surry Hills", "Paddington", "Darlinghurst", "Parramatta", "Chatswood", "Manly", "Cronulla"].forEach(reg => s.add(reg));
    initialTenants.forEach(t => {
      if (t.suburb) s.add(t.suburb);
      else if (t.address) {
        const parts = t.address.split(',');
        if (parts.length > 0) s.add(parts[0].trim());
      }
    });
    return Array.from(s).filter(Boolean).sort() as string[];
  }, [initialTenants]);

  const matchingSuburbs = useMemo(() => {
    if (!where || where.length < 1) return [];
    return allSuburbs.filter(s => s.toLowerCase().includes(where.toLowerCase())).slice(0, 10);
  }, [allSuburbs, where]);

  const filteredTenants = useMemo(() => {
    return initialTenants.filter(t => {
      const matchesQuery = !query || t.name.toLowerCase().includes(query.toLowerCase()) || (t.description?.toLowerCase().includes(query.toLowerCase()));
      const shopSuburb = t.suburb?.toLowerCase() || "";
      const shopAddress = t.address?.toLowerCase() || "";
      const matchesWhere = !where || shopSuburb.includes(where.toLowerCase()) || shopAddress.includes(where.toLowerCase());
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      return matchesQuery && matchesWhere && matchesCategory;
    });
  }, [initialTenants, query, where, selectedCategory]);

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', paddingBottom: isMobile ? '80px' : '0' }}>
      
      {/* ─── PROFESSIONAL LIGHT HERO ─── */}
      <section style={{ 
        padding: isMobile ? '40px 1.2rem' : 'clamp(40px, 8vh, 80px) 2.5rem clamp(40px, 6vh, 60px)', 
        textAlign: isMobile ? 'left' : 'center', 
        background: 'radial-gradient(at 0% 0%, #E0F2FF 0%, transparent 50%), radial-gradient(at 100% 0%, #FAE8FF 0%, transparent 50%), radial-gradient(at 50% 100%, #F5F3FF 0%, transparent 50%), #ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        minHeight: isMobile ? 'auto' : 'clamp(350px, 60vh, 450px)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1200px', width: '100%', position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: isMobile ? '2.5rem' : 'clamp(3rem, 5vw, 4rem)', 
            fontWeight: 950, 
            marginBottom: '0.8rem', 
            letterSpacing: '-0.04em', 
            lineHeight: 1.1, 
            color: '#000000',
            maxWidth: '100%',
            whiteSpace: isMobile ? 'normal' : 'nowrap'
          }}>
            Elevate your style. Secure a space.
          </h1>
          <p style={{ 
            fontSize: isMobile ? '1.1rem' : '1.25rem', 
            color: '#475569', 
            marginBottom: isMobile ? '2rem' : '3rem', 
            fontWeight: 500, 
            letterSpacing: '-0.01em', 
            opacity: 0.9
          }}>
            Discover top-rated grooming and wellness experts.
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            background: isMobile ? 'transparent' : 'rgba(255, 255, 255, 0.75)', 
            backdropFilter: isMobile ? 'none' : 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: isMobile ? 'none' : 'blur(16px) saturate(180%)',
            borderRadius: '24px', 
            padding: isMobile ? '0' : '12px', 
            boxShadow: isMobile ? 'none' : '0 20px 40px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.3)',
            gap: isMobile ? '1rem' : '0',
            maxWidth: '1000px',
            margin: isMobile ? '0' : '0 auto',
            border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.4)'
          }}>
            {/* Service Search */}
            <div style={{ 
              flex: 1.5, 
              padding: isMobile ? '1rem' : '12px 24px', 
              textAlign: 'left', 
              borderRight: isMobile ? 'none' : '1px solid rgba(0,0,0,0.05)',
              background: isMobile ? '#fff' : 'transparent',
              borderRadius: isMobile ? '16px' : '0',
              border: isMobile ? '1px solid #e2e8f0' : 'none',
              boxShadow: isMobile ? '0 4px 15px rgba(0,0,0,0.03)' : 'none'
            }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', display: 'block', marginBottom: '4px', opacity: 0.5 }}>What</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Service or Venue" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ border: 'none', flex: 1, outline: 'none', color: '#000', fontSize: '1rem', fontWeight: 600, background: 'transparent', minWidth: '0' }}
                />
              </div>
            </div>
            
            {/* Location Search */}
            <div style={{ 
              flex: 1, 
              padding: isMobile ? '1rem' : '12px 24px', 
              textAlign: 'left', 
              position: 'relative',
              background: isMobile ? '#fff' : 'transparent',
              borderRadius: isMobile ? '16px' : '0',
              border: isMobile ? '1px solid #e2e8f0' : 'none',
              boxShadow: isMobile ? '0 4px 15px rgba(0,0,0,0.03)' : 'none'
            }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#000', textTransform: 'uppercase', display: 'block', marginBottom: '4px', opacity: 0.5 }}>Where</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Suburb" 
                  value={where}
                  onChange={(e) => { setWhere(e.target.value); setShowSuburbs(true); }}
                  onFocus={() => setShowSuburbs(true)}
                  style={{ border: 'none', flex: 1, outline: 'none', color: '#000', fontSize: '1rem', fontWeight: 600, background: 'transparent', minWidth: '0' }}
                />
              </div>
              
              {showSuburbs && matchingSuburbs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', zIndex: 100, borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', marginTop: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {matchingSuburbs.map(s => (
                    <div key={s} onClick={() => { setWhere(s); setShowSuburbs(false); }} style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem', fontWeight: 600, color: '#000' }}>🏙️ {s}</div>
                  ))}
                </div>
              )}
            </div>

            <button style={{ 
              background: '#000', 
              color: '#fff', 
              border: 'none', 
              padding: isMobile ? '1.2rem' : '0 40px', 
              borderRadius: '16px', 
              fontSize: '1rem', 
              fontWeight: 800, 
              margin: isMobile ? '0' : '6px',
              cursor: 'pointer',
              width: isMobile ? '100%' : 'auto'
            }}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ─── POPULAR SHOPS GRID ─── */}
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '0 1.2rem 4rem' : '0 2.5rem 6rem' }}>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', marginBottom: '2rem', gap: isMobile ? '1rem' : '0' }}>
            <div>
                <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 950, color: '#000', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>Popular Destinations</h2>
                <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.9rem' }}>Top-rated professionals across your network</p>
            </div>
            {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>Reset Filters</button>
            )}
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: isMobile ? '0.75rem' : '2.5rem' 
        }}>
            {filteredTenants.map((tenant) => (
                <Link key={tenant.id} href={tenant.slug ? `/${tenant.slug}` : `/coming-soon?name=${encodeURIComponent(tenant.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ 
                        background: '#fff', 
                        borderRadius: isMobile ? '16px' : '24px', 
                        overflow: 'hidden', 
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        transition: 'transform 0.2s',
                        height: '100%'
                    }}>
                        <div style={{ 
                            height: isMobile ? '140px' : '250px', 
                            backgroundImage: `url("${tenant.shopImage}")`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center',
                            position: 'relative'
                        }}>
                             <div style={{ position: 'absolute', top: isMobile ? '0.5rem' : '1rem', left: isMobile ? '0.5rem' : '1rem', background: '#fff', color: '#000', padding: isMobile ? '0.2rem 0.4rem' : '0.3rem 0.8rem', borderRadius: '40px', fontSize: isMobile ? '0.55rem' : '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
                                {tenant.category || "PREMIUM"}
                             </div>
                             <div style={{ position: 'absolute', top: isMobile ? '0.5rem' : '1rem', right: isMobile ? '0.5rem' : '1rem', background: '#000', color: '#fff', padding: isMobile ? '0.2rem 0.4rem' : '0.4rem 0.6rem', borderRadius: isMobile ? '8px' : '12px', fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: 900 }}>
                                ⭐ {tenant.rating}
                             </div>
                        </div>
                        <div style={{ padding: isMobile ? '0.8rem' : '1.5rem' }}>
                            <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.25rem', fontWeight: 800, color: '#000', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant.name}</h3>
                            <p style={{ color: '#64748b', fontSize: isMobile ? '0.75rem' : '0.9rem', marginBottom: isMobile ? '0.8rem' : '1.2rem', lineHeight: 1.3, height: isMobile ? '2.6rem' : 'auto', overflow: 'hidden' }}>{tenant.address}</p>
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: isMobile ? '0.6rem' : '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: isMobile ? '0.55rem' : '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b' }}>{tenant.isLive ? 'Live' : 'Soon'}</span>
                                <span style={{ fontSize: isMobile ? '0.65rem' : '0.85rem', fontWeight: 700 }}>2:00 PM</span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </section>

      {/* ─── B2B SECTION ─── */}
      <section style={{ background: '#f8fafc', padding: isMobile ? '4rem 1.2rem' : '6rem 2.5rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '3rem', alignItems: 'center' }}>
              <div style={{ flex: 1, textAlign: isMobile ? 'left' : 'left' }}>
                  <h4 style={{ color: '#000', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem' }}>For Partners</h4>
                  <h2 style={{ fontSize: isMobile ? '2.2rem' : '3rem', fontWeight: 950, lineHeight: 1.1, color: '#000', marginBottom: '1.5rem' }}>Scale your studio effortlessly.</h2>
                  <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '2rem', lineHeight: 1.6 }}>The unified platform for top-tier grooming and wellness experts.</p>
                  <Link href="/partners" style={{ background: '#000', color: '#fff', padding: '1.2rem 2rem', borderRadius: '14px', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>Become a Partner</Link>
              </div>
              <div style={{ flex: 1, width: '100%' }}>
                  <div style={{ background: '#fff', padding: '2rem', borderRadius: '32px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>2.5%</div>
                          <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Fee</p>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>Instant</div>
                          <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Payouts</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '6rem 1.2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? '2.4rem' : '3.6rem', fontWeight: 950, color: '#000', marginBottom: '1.5rem', letterSpacing: '-1px' }}>Elevate your routine.</h2>
          <Link href="/download" style={{ background: '#000', color: '#fff', padding: '1.3rem 3rem', borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', textDecoration: 'none', display: 'inline-block' }}>Get the App</Link>
      </section>
    </div>
  );
}
