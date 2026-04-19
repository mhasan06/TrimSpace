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

  // Map raw SQL results to the structure expected by the component
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

  // Gift Card Wallet — fetch all cards ever linked to this customer's appointments
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

  return (
    <div className={styles.dashboardContainer} style={{ padding: '2rem' }}>
      <header className={`${styles.header} glass`} style={{ marginBottom: '2rem' }}>
        <div>
           <h1>My Appointments</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Welcome back, {session.user?.name}</p>
        </div>
      </header>

      {nextApp && timeToNext !== null && (
        <div className="glass" style={{ 
          padding: '1.5rem', 
          background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.2), rgba(var(--secondary-rgb), 0.2))', 
          border: '1px solid var(--primary)', 
          borderRadius: '12px',
          marginBottom: '2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 0 20px rgba(var(--primary-rgb), 0.3)'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--primary)', textTransform: 'uppercase' }}>Next Appointment Alert</span>
            <h2 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>Your {nextApp.service.name} is in <span style={{ color: 'var(--primary)' }}>{timeToNext < 24 ? `${timeToNext} hours` : `${Math.floor(timeToNext/24)} days`}</span></h2>
            <p style={{ opacity: 0.8, fontSize: '0.9rem', marginTop: '0.2rem' }}>at {nextApp.tenant.name} with {nextApp.barber.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
             <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>{nextApp.startTime.toISOString().split('T')[0]}</p>
             <p style={{ opacity: 0.7 }}>
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
              To avoid penalties, ensure appointments are rescheduled well in advance.
            </p>
          </div>

          <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', margin: 0 }}>
             <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Upcoming Visits</h2>
             {upcoming.length === 0 ? (
               <p style={{ opacity: 0.5, fontStyle: 'italic', padding: '1rem 0' }}>No upcoming appointments found. Time for a trim?</p>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {upcoming.map(group => (
                    <div key={group.bookingGroupId || group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', opacity: 0.6 }}>
                          {group.bookingGroupId ? `GROUP: ${group.bookingGroupId.toUpperCase()}` : `ID: #${group.id.substring(group.id.length - 8).toUpperCase()}`}
                        </span>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.4rem' }}>
                          {group.services.map((s: any) => s.name).join(" + ")}
                        </h3>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{group.tenant.name} • {group.barber.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.3rem' }}>Total: ${group.totalPrice.toFixed(2)}</p>
                      </div>
                       <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                          <div>
                            <p style={{ fontWeight: 600 }}>{group.startTime.toISOString().split('T')[0]}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                              {(() => {
                                  const h = group.startTime.getUTCHours();
                                  const m = group.startTime.getUTCMinutes();
                                  const ampm = h >= 12 ? 'PM' : 'AM';
                                  const h12 = h % 12 || 12;
                                  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                              })()}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
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

          <div className={`${styles.recentSection} glass`} style={{ padding: '2rem', marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Session History</h2>
            <p style={{ fontSize: '0.78rem', opacity: 0.4, marginBottom: '1rem', marginTop: '-1rem' }}>Click any Booking ID to view full details.</p>
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
              initial: dbUser?.name?.[0] || session.user?.name?.[0] || 'U'
            }} 
          />

          <div className={`${styles.statCard} glass`} style={{ textAlign: 'left' }}>
             <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '1rem' }}>Advanced Session Stats</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                   <span>Lifetime Sessions</span>
                   <span style={{ fontWeight: 600 }}>{appointments.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                   <span>Completed Visits</span>
                   <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{past.filter(a => a.status !== 'CANCELLED').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                   <span>Total Investment</span>
                   <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      ${mappedAppointments.reduce((acc, app) => {
                         if (app.status === 'CANCELLED' && app.paymentStatus === 'PARTIAL_REFUNDED') return acc + (app.service.price * 0.5);
                         if (app.status === 'CANCELLED') return acc;
                         return acc + app.service.price;
                      }, 0).toFixed(2)}
                   </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>Member Since</span>
                   <span style={{ fontWeight: 600 }}>{new Date().getFullYear()}</span>
                </div>
          </div>

          {/* ─── Gift Card Wallet ─── */}
          {myGiftCards.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '1rem' }}>
                ✨ Gift Card Wallet
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myGiftCards.map((card) => {
                  const usedAmount = card.initialValue - card.balance;
                  const usedPct = (usedAmount / card.initialValue) * 100;
                  const isFullyUsed = card.balance <= 0;
                  return (
                    <div key={card.id} className="glass" style={{
                      padding: '1.2rem',
                      borderRadius: '12px',
                      border: `1px solid ${isFullyUsed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.25)'}`,
                      opacity: isFullyUsed ? 0.5 : 1,
                      transition: 'opacity 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                        <div>
                          <p style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.code}</p>
                          <p style={{ fontWeight: 800, fontSize: '1.1rem', color: isFullyUsed ? 'rgba(255,255,255,0.4)' : 'var(--primary)', marginTop: '0.1rem' }}>
                            ${card.balance.toFixed(2)} <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 400 }}>remaining</span>
                          </p>
                        </div>
                        <span style={{ fontSize: '0.65rem', background: isFullyUsed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.1)', borderRadius: '4px', padding: '0.2rem 0.4rem', color: isFullyUsed ? 'rgba(255,255,255,0.3)' : 'var(--primary)', fontWeight: 700 }}>
                          {isFullyUsed ? 'SPENT' : 'ACTIVE'}
                        </span>
                      </div>

                      {/* Balance bar */}
                      <div style={{ marginBottom: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.35rem' }}>
                          <span>Used ${usedAmount.toFixed(2)}</span>
                          <span>of ${card.initialValue.toFixed(2)}</span>
                        </div>
                        <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, usedPct)}%`,
                            height: '100%',
                            background: isFullyUsed ? 'rgba(255,255,255,0.2)' : `linear-gradient(90deg, var(--primary), #10b981)`,
                            borderRadius: '4px',
                            transition: 'width 0.5s ease'
                          }}></div>
                        </div>
                      </div>

                      {/* Usage history */}
                      {card.appointments.length > 0 && (
                        <details style={{ marginTop: '0.5rem' }}>
                          <summary style={{ fontSize: '0.72rem', opacity: 0.5, cursor: 'pointer', userSelect: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>▸</span> {card.appointments.length} redemption{card.appointments.length !== 1 ? 's' : ''}
                          </summary>
                          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {card.appointments.map(app => (
                              <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <span style={{ opacity: 0.6 }}>{app.startTime.toISOString().split('T')[0]} · {app.service.name}</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>-${Number(app.amountPaidGift).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`${styles.statCard} glass`} style={{ marginTop: '2rem', background: 'rgba(var(--secondary-rgb), 0.1)', border: '1px solid var(--secondary)' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Recommended for you</h3>
             <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Based on your history at <strong>{past[0]?.tenant.name || 'your last shop'}</strong>, we recommend booking every 3-4 weeks to keep your fade sharp.</p>
             <Link href={past[0] ? `/${past[0].tenant.slug}` : '/'} style={{ display: 'block', marginTop: '1.5rem', width: '100%', textAlign: 'center', padding: '0.8rem', background: 'var(--secondary)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
                Find a Barbershop
             </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
