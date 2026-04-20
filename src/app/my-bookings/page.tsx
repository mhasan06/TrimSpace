import styles from "../dashboard/page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import CancelButton from "@/components/CancelButton";
import InvoiceButton from "@/components/InvoiceButton";
import SessionHistoryTable from "./SessionHistoryTable";
import CustomerProfileManager from "@/components/CustomerProfileManager";

export default async function MyBookings() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!session || (session.user as any).role !== "CUSTOMER") {
    redirect("/customer-login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  const appointments = await prisma.$queryRawUnsafe<any[]>(`
    SELECT a.*, t.name as "tenantName", t.slug as "tenantSlug", t.address as "tenantAddress", 
           s.name as "serviceName", s.price as "servicePrice", b.name as "barberName"
    FROM "Appointment" a
    JOIN "Tenant" t ON a."tenantId" = t.id
    JOIN "Service" s ON a."serviceId" = s.id
    JOIN "User" b ON a."barberId" = b.id
    WHERE a."customerId" = $1
    ORDER BY a."startTime" ASC
  `, userId);

  const mappedAppointments = appointments.map(app => ({
    ...app,
    tenant: { name: app.tenantName, slug: app.tenantSlug, address: app.tenantAddress },
    service: { name: app.serviceName, price: app.servicePrice },
    barber: { name: app.barberName }
  }));

  let userReviewIds: string[] = [];
  try {
    const rawReviews = await prisma.$queryRaw<any[]>`SELECT "appointmentId" FROM "Review" WHERE "customerId" = ${userId}`;
    userReviewIds = rawReviews.map(r => r.appointmentId);
  } catch(e) {}

  const myGiftCards = await prisma.giftCard.findMany({
    where: {
      appointments: { some: { customerId: userId } }
    },
    include: {
      appointments: {
        where: { customerId: userId },
        include: { service: true, tenant: true },
        orderBy: { startTime: 'desc' }
      }
    }
  });

  const now = new Date();
  
  const groupList = (list: any[]) => {
    const groups: any[] = [];
    const map = new Map();
    list.forEach(app => {
      const gid = app.bookingGroupId || app.id;
      if (!map.has(gid)) {
        map.set(gid, { ...app, services: [], totalPrice: 0, ids: [], totalStripe: 0, totalGift: 0 });
        groups.push(map.get(gid));
      }
      const g = map.get(gid);
      g.services.push(app.service);
      g.totalPrice += app.service.price;
      g.ids.push(app.id);
      g.totalStripe += Number(app.amountPaidStripe || 0);
      g.totalGift += Number(app.amountPaidGift || 0);
    });
    return groups;
  };

  const upcoming = groupList(mappedAppointments.filter(app => new Date(app.startTime) > now && app.status !== 'CANCELLED'));
  const past = groupList(mappedAppointments.filter(app => new Date(app.startTime) <= now || app.status === 'CANCELLED').reverse());

  const nextApp = upcoming[0];
  const timeToNext = nextApp ? Math.ceil((new Date(nextApp.startTime).getTime() - now.getTime()) / (1000 * 60 * 60)) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className={styles.dashboardContainer} style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase' }}>Customer Portal</span>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem', letterSpacing: '-1px' }}>
              {getGreeting()}, <span style={{ color: 'var(--primary)' }}>{session.user?.name?.split(' ')[0]}</span>
           </h1>
           <p style={{ opacity: 0.6, fontSize: '0.95rem', marginTop: '0.4rem' }}>
              Manage your bookings, invoices, and profile.
           </p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700 }}>{new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      {nextApp && timeToNext !== null && (
        <div style={{ 
          padding: '2.5rem', 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          border: '1px solid rgba(var(--primary-rgb), 0.3)', 
          borderRadius: '24px',
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3), 0 0 20px rgba(var(--primary-rgb), 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.03, filter: 'blur(80px)' }}></div>
          
          <div style={{ zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ background: 'var(--primary)', color: 'black', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800 }}>UPCOMING VISIT</span>
                <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>
                   In {timeToNext < 24 ? `${timeToNext} hours` : `${Math.floor(timeToNext/24)} days`}
                </span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{nextApp.service.name}</h2>
            <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>
              with <strong style={{ color: 'white' }}>{nextApp.barber.name}</strong> at <strong>{nextApp.tenant.name}</strong>
            </p>
          </div>
          
          <div style={{ textAlign: 'right', zIndex: 1, paddingLeft: '2rem', borderLeft: '2px dashed rgba(255,255,255,0.1)' }}>
             <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                {nextApp.startTime.getUTCDate()}
             </p>
             <p style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7 }}>
                {nextApp.startTime.toLocaleDateString('en-AU', { month: 'short' })}
             </p>
             <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '10px' }}>
                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                   {(() => {
                      const h = nextApp.startTime.getUTCHours();
                      const m = nextApp.startTime.getUTCMinutes();
                      const ampm = h >= 12 ? 'PM' : 'AM';
                      const h12 = h % 12 || 12;
                      return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                   })()}
                </p>
             </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <section>
          <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px' }}>
            <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Cancellation Policy Notice
            </h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Please note that all cancellations or no-shows are subject to a **50% administrative fee**. 
              Refunds for online payments are processed automatically back to your card after path-deduction. 
            </p>
          </div>

          <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', margin: 0, borderRadius: '24px' }}>
             <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem' }}>Upcoming Visits</h2>
             {upcoming.length === 0 ? (
               <p style={{ opacity: 0.5, fontStyle: 'italic', padding: '1rem 0' }}>No upcoming appointments found.</p>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {upcoming.map(group => (
                    <div key={group.bookingGroupId || group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                         <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'var(--primary)', color: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{group.startTime.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase()}</span>
                            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{group.startTime.getUTCDate()}</span>
                         </div>
                         <div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                               {group.bookingGroupId ? `Group Booking` : `Individual`}
                            </span>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>
                              {group.services.map((s: any) => s.name).join(" + ")}
                            </h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>{group.tenant.name} • {group.barber.name}</p>
                         </div>
                      </div>
                       <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                          <div>
                            <p style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                               {(() => {
                                   const h = group.startTime.getUTCHours();
                                   const m = group.startTime.getUTCMinutes();
                                   const ampm = h >= 12 ? 'PM' : 'AM';
                                   const h12 = h % 12 || 12;
                                   return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                               })()}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>${group.totalPrice.toFixed(2)}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <InvoiceButton appointmentId={group.id} bookingId={group.bookingGroupId || group.id.substring(group.id.length - 8)} invoiceUrl={group.invoiceUrl} />
                            <CancelButton
                                appointmentId={group.bookingGroupId || group.id}
                                amountPaidStripe={group.totalStripe}
                                amountPaidGift={group.totalGift}
                            />
                          </div>
                      </div>
                    </div>
                  ))}
               </div>
             )}
          </div>

          <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', marginTop: '2rem', borderRadius: '24px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>Session History</h2>
            {past.length === 0 ? (
              <p style={{ opacity: 0.5, fontStyle: 'italic', padding: '1rem 0' }}>Your history is empty.</p>
            ) : (
              <SessionHistoryTable rows={past.map(g => ({
                id: g.id,
                bookingGroupId: g.bookingGroupId,
                startTime: g.startTime.toISOString(),
                endTime: g.endTime.toISOString(),
                status: g.status,
                paymentStatus: g.paymentStatus,
                paymentMethod: g.paymentMethod,
                amountPaidStripe: g.amountPaidStripe,
                amountPaidGift: g.amountPaidGift,
                tenantName: g.tenant.name,
                tenantSlug: g.tenant.slug,
                tenantAddress: (g.tenant as any).address ?? null,
                serviceName: g.services.map((s: any) => s.name).join(", "),
                servicePrice: g.totalPrice,
                barberName: g.barber?.name ?? null,
                invoiceUrl: g.invoiceUrl ?? null,
                hasReview: userReviewIds.includes(g.id),
              }))} />
            )}
          </div>
        </section>

        <aside>
          <CustomerProfileManager 
            user={{ 
              name: dbUser?.name || session.user?.name || "User", 
              email: dbUser?.email || session.user?.email || "", 
              phone: dbUser?.phone,
              avatarUrl: dbUser?.avatarUrl,
              initial: dbUser?.name?.[0] || session.user?.name?.[0] || 'U'
            }} 
          />

          <div className={`${styles.statCard} glass`} style={{ textAlign: 'left', borderRadius: '20px' }}>
             <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '1.5rem' }}>Membership Stats</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <span style={{ opacity: 0.7 }}>Lifetime Sessions</span>
                   <span style={{ fontWeight: 800 }}>{appointments.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <span style={{ opacity: 0.7 }}>Completed Visits</span>
                   <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>{past.filter(a => a.status !== 'CANCELLED').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <span style={{ opacity: 0.7 }}>Total Investment</span>
                   <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      ${mappedAppointments.reduce((acc, app) => {
                         if (app.status === 'CANCELLED' && app.paymentStatus === 'PARTIAL_REFUNDED') return acc + (app.service.price * 0.5);
                         if (app.status === 'CANCELLED') return acc;
                         return acc + app.service.price;
                      }, 0).toFixed(2)}
                   </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ opacity: 0.7 }}>Member Since</span>
                   <span style={{ fontWeight: 800 }}>{new Date().getFullYear()}</span>
                </div>
          </div>

          {myGiftCards.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '1.2rem' }}>
                ✨ Gift Card Wallet
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myGiftCards.map((card) => {
                  const usedAmount = card.initialValue - card.balance;
                  const usedPct = (usedAmount / card.initialValue) * 100;
                  const isFullyUsed = card.balance <= 0;
                  return (
                    <div key={card.id} className="glass" style={{
                      padding: '1.5rem',
                      borderRadius: '20px',
                      border: `1px solid ${isFullyUsed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.25)'}`,
                      opacity: isFullyUsed ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <p style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase' }}>{card.code}</p>
                          <p style={{ fontWeight: 800, fontSize: '1.25rem', color: isFullyUsed ? 'rgba(255,255,255,0.4)' : 'var(--primary)', marginTop: '0.2rem' }}>
                            ${card.balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, usedPct)}%`, height: '100%', background: isFullyUsed ? 'rgba(255,255,255,0.2)' : 'var(--primary)', borderRadius: '10px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
