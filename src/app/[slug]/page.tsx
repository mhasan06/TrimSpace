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
  const terminology = getTerminology(tenant.category);
  const gallery = tenant.galleryImages || [];
  
  const averageRating = tenantReviews.length > 0 
    ? (tenantReviews.reduce((a:any, b:any) => a + b.rating, 0) / tenantReviews.length).toFixed(1) 
    : "5.0";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        


        <BookingFlow 
          initialServices={tenant.services} 
          tenantSlug={tenant.slug} 
          category={tenant.category} 
          cancellationPolicy={platformSettings?.cancellationPolicy}
          bookingPolicy={platformSettings?.bookingPolicy}
          businessHours={tenant.businessHours}
          address={tenant.address}
          tenantName={tenant.name}
          shopImage={tenant.shopImage}
          rating={averageRating}
          reviewCount={tenantReviews.length.toString()}
        >
          {/* ─── SEQUENCE: TEAM ─── */}
          <section id="team" className={styles.section}>
              <h2 className={styles.sectionTitle}>Meet the Team</h2>
              <div className={styles.teamGrid}>
                  {tenant.users.map((member: any) => (
                      <div key={member.id} className={styles.teamCard}>
                          <div className={styles.avatar} style={{ backgroundImage: `url("${member.avatarUrl || 'https://ui-avatars.com/api/?name=' + member.name}")` }}></div>
                          <div className={styles.teamInfo}>
                              <h3>{member.name}</h3>
                              <p>{member.bio || "Senior Professional"}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </section>

          {/* ─── SEQUENCE: REVIEWS ─── */}
          <section id="reviews" className={styles.section}>
              <h2 className={styles.sectionTitle}>Customer Reviews</h2>
              <div className={styles.reviewList}>
                  {tenantReviews.length > 0 ? tenantReviews.map((r: any) => (
                      <div key={r.id} className={styles.reviewCard}>
                          <div style={{ color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{"⭐".repeat(r.rating)}</span>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{r.customerName || "Verified Customer"}</p>
                          <p style={{ color: '#475569', fontSize: '0.95rem' }}>{r.comment}</p>
                      </div>
                  )) : (
                      <p style={{ color: '#64748b' }}>No reviews yet. Be the first to leave one!</p>
                  )}
              </div>
          </section>

          {/* ─── SEQUENCE: ABOUT ─── */}
          <section id="about" className={styles.section}>
              <h2 className={styles.sectionTitle}>About {tenant.name}</h2>
              <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                  {tenant.description || `Welcome to ${tenant.name}. We specialize in premium ${terminology.serviceLabelPlural.toLowerCase()} tailored for the modern individual.`}
              </p>
          </section>

        </BookingFlow>
      </div>
    </div>
  );
}
