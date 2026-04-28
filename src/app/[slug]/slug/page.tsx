import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import BookingFlow from '@/components/BookingFlow';
import { prisma } from '@/lib/prisma';
import { getTerminology } from '@/lib/terminology';
import FavoriteButton from '@/components/FavoriteButton';
import { getIsFavorited } from './favoriteActions';

export default async function TenantPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Fetch platform settings for policies
  const platformSettings = await prisma.platformSettings.findUnique({
    where: { id: 'platform_global' }
  });

  const tenant: any = await prisma.tenant.findUnique({
    where: { slug },
    include: {
        services: { where: { isActive: true } },
        businessHours: true,
        users: { where: { role: { in: ['BARBER', 'ADMIN'] }, isActive: true } }
    }
  });

  let tenantReviews: any[] = [];
  try {
    if (tenant) {
      tenantReviews = await prisma.$queryRaw`
        SELECT r.id, r.rating, r.comment, r."createdAt", c.name as "customerName", b.name as "barberName"
        FROM "Review" r
        LEFT JOIN "User" c ON r."customerId" = c.id
        LEFT JOIN "User" b ON r."barberId" = b.id
        WHERE r."tenantId" = ${tenant.id}
        ORDER BY r."createdAt" DESC
      `;
    }
  } catch(e) {
    console.log("Review schema sync pending...");
  }

  if (!tenant) notFound();

  const isFavorited = await getIsFavorited(tenant.id);

  // Redirect inactive shops to Coming Soon portal
  if (!tenant.isActive) {
      return (
          <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
              <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
                  <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>{tenant.name}</h1>
                  <p style={{ color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Joining the Network Soon</p>
                  <Link href="/" style={{ marginTop: '2rem', display: 'inline-block', padding: '1rem 2rem', background: '#000', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>Back to Discovery</Link>
              </div>
          </main>
      );
  }

  const terminology = getTerminology(tenant.category);
  const gallery = tenant.galleryImages || [];
  const customerGallery = tenant.customerPhotos || [
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80"
  ];

  return (
    <div className={styles.pageWrapper}>
      
      {/* ─── HI-RES GALLERY GRID (Max 3) ─── */}
      <section className={styles.galleryGrid}>
          <div className={styles.mainImage} style={{ backgroundImage: `url("${tenant.shopImage || gallery[0] || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80'}")` }}></div>
          <div className={styles.sideGallery}>
              <div style={{ backgroundImage: `url("${gallery[1] || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80'}")` }}></div>
              <div style={{ backgroundImage: `url("${gallery[2] || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80'}")` }}></div>
          </div>
      </section>

      {/* ─── INFO SECTION ─── */}
      <div className={styles.container}>
          <div className={styles.mainLayout}>
              
              <div className={styles.contentCol}>
                  <header className={styles.header}>
                      <div className={styles.headerMeta}>
                          {tenantReviews && tenantReviews.length > 0 ? (
                            <span>⭐ {(tenantReviews.reduce((a:any, b:any) => a + b.rating, 0) / tenantReviews.length).toFixed(1)} ({tenantReviews.length} reviews)</span>
                          ) : (
                            <span>⭐ New</span>
                          )}
                          <span style={{ margin: '0 8px', opacity: 0.3 }}>•</span>
                          <span>{tenant.category}</span>
                      </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h1 className={styles.title}>{tenant.name}</h1>
                          <FavoriteButton tenantId={tenant.id} initialIsFavorited={isFavorited} />
                      </div>
                      <p className={styles.address}>{tenant.address}</p>
                      <Link href="#booking" className={styles.mobileBookBtn}>Book Now</Link>
                  </header>

                  <nav className={styles.stickyNav}>
                      <Link href="#services">Services</Link>
                      <Link href="#team">Team</Link>
                      <Link href="#reviews">Reviews</Link>
                      <Link href="#about">About</Link>
                  </nav>

                  {/* ─── SERVICES SECTION ─── */}
                  <section id="services" className={styles.section}>
                      <h2 className={styles.sectionTitle}>{terminology.serviceLabelPlural}</h2>
                      <BookingFlow 
                        initialServices={tenant.services} 
                        tenantSlug={tenant.slug} 
                        category={tenant.category} 
                        cancellationPolicy={platformSettings?.cancellationPolicy}
                        bookingPolicy={platformSettings?.bookingPolicy}
                      />
                  </section>

                  {/* ─── TEAM SECTION ─── */}
                  <section id="team" className={styles.section}>
                      <h2 className={styles.sectionTitle}>Meet the Team</h2>
                      <div className={styles.teamGrid}>
                          {tenant.users.length > 0 ? tenant.users.map((member: any) => (
                              <div key={member.id} className={styles.teamCard}>
                                  <div className={styles.avatar} style={{ backgroundImage: `url("${member.avatarUrl || 'https://ui-avatars.com/api/?name=' + member.name}")` }}></div>
                                  <div className={styles.teamInfo}>
                                      <h3>{member.name}</h3>
                                      <p>{member.bio || "Senior Professional"}</p>
                                  </div>
                              </div>
                          )) : (
                              <p style={{ color: '#64748b' }}>Team profiles are being verified.</p>
                          )}
                      </div>
                  </section>

                  {/* ─── REVIEWS SECTION ─── */}
                  <section id="reviews" className={styles.section}>
                      <h2 className={styles.sectionTitle}>Customer Reviews</h2>
                      <div className={styles.reviewList}>
                          {tenantReviews && tenantReviews.length > 0 ? (
                            tenantReviews.map((r: any) => (
                                <div key={r.id} className={styles.reviewCard}>
                                    <div style={{ color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{"⭐".repeat(r.rating)}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ fontWeight: 600, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {r.customerName || "Verified Customer"}
                                        <span style={{ fontSize: '0.75rem', fontWeight: 500, background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                            with {r.barberName || "Professional"}
                                        </span>
                                    </p>
                                    <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                        {r.comment ? `"${r.comment}"` : <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No comment provided.</span>}
                                    </p>
                                </div>
                            ))
                          ) : (
                              <p style={{ color: '#64748b' }}>No reviews yet. Be the first to leave one after your visit!</p>
                          )}
                      </div>
                  </section>

                  {/* ─── CUSTOMER PHOTOS ─── */}
                  <section className={styles.section}>
                      <h2 className={styles.sectionTitle}>Recent Customer Photos</h2>
                      <div className={styles.customerPhotosGrid}>
                          {customerGallery.slice(0, 3).map((url: string, i: number) => (
                              <div key={i} style={{ backgroundImage: `url("${url}")` }}></div>
                          ))}
                      </div>
                  </section>

                  {/* ─── ABOUT SECTION ─── */}
                  <section id="about" className={styles.section}>
                      <h2 className={styles.sectionTitle}>About {tenant.name}</h2>
                      <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                          {tenant.description || `Welcome to ${tenant.name}. We specialize in premium ${terminology.serviceLabelPlural.toLowerCase()} tailored for the modern individual. Our space is designed to provide a high-end experience through masterful craft and contemporary techniques.`}
                      </p>
                  </section>
              </div>

              {/* ─── SIDEBAR / LOCATION ─── */}
              <aside className={styles.sidebar}>
                  <div className={styles.sidebarCard}>
                      <h3 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>Location & Hours</h3>
                      <div style={{ height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                          <iframe 
                            src={`https://www.google.com/maps?q=${encodeURIComponent(tenant.address || "Australia")}&output=embed`} 
                            width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy"></iframe>
                      </div>
                      <p style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '0.95rem' }}>{tenant.address}</p>
                      
                      <div className={styles.hoursList}>
                          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day: string, idx: number) => {
                              const hr = tenant.businessHours.find((h: any) => h.dayOfWeek === idx);
                              return (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.6rem', opacity: hr ? 1 : 0.4 }}>
                                      <span>{day}</span>
                                      <span style={{ fontWeight: 700 }}>{hr ? `${hr.openTime} - ${hr.closeTime}` : "Closed"}</span>
                                  </div>
                              );
                          })}
                      </div>
                      
                      <button className={styles.sidebarBookBtn}>Book Appointment</button>
                  </div>
              </aside>

          </div>
      </div>
    </div>
  );
}
