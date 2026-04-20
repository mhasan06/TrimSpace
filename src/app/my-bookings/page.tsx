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
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* ─── HEADER ─── */}
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div>
           <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Member Portal</span>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px', margin: 0 }}>
              {getGreeting()}, <span style={{ color: 'var(--primary)' }}>{session.user?.name?.split(' ')[0]}</span>
           </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', marginRight: '1rem' }}>
               <p style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 700, margin: 0 }}>{new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <Link href="/" style={{ 
                background: 'var(--primary)', 
                color: 'black', 
                padding: '0.8rem 1.5rem', 
                borderRadius: '12px', 
                textDecoration: 'none', 
                fontWeight: 800, 
                fontSize: '0.9rem',
                boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Book New Appointment
            </Link>
        </div>
      </header>

      {/* ─── NEXT APPOINTMENT TICKET ─── */}
      {nextApp && timeToNext !== null && (
        <div style={{ 
          padding: '2.5rem', 
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '24px',
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden',
          width: '100%'
        }}>
          {/* Accent decoration */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: 'var(--primary)' }}></div>
          
          <div style={{ zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem' }}>
                <span style={{ background: 'var(--primary)', color: 'black', padding: '0.35rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900 }}>CONFIRMED VISIT</span>
                <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 800 }}>
                   Arriving in {timeToNext < 24 ? `${timeToNext} hours` : `${Math.floor(timeToNext/24)} days`}
                </span>
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem', color: 'white' }}>{nextApp.service.name}</h2>
            <p style={{ opacity: 0.8, fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)' }}>
              at <strong style={{ color: 'white' }}>{nextApp.tenant.name}</strong> • with <strong style={{ color: 'var(--primary)' }}>{nextApp.barber.name}</strong>
            </p>
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {nextApp.tenant.address || "Studio Address"}
            </p>
          </div>
          
          <div style={{ textAlign: 'right', zIndex: 1, paddingLeft: '3rem', borderLeft: '2px dashed rgba(255,255,255,0.1)' }}>
             <p style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, margin: 0 }}>
                {nextApp.startTime.getUTCDate()}
             </p>
             <p style={{ fontWeight: 800, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'white', marginTop: '0.2rem' }}>
                {nextApp.startTime.toLocaleDateString('en-AU', { month: 'short' })}
             </p>
             <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '12px' }}>
                <p style={{ fontWeight: 900, fontSize: '1.25rem', color: 'white', margin: 0 }}>
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

      {/* ─── MAIN GRID ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2.5rem', width: '100%' }}>
        <section>
          {/* Policy Banner */}
          <div style={{ padding: '1.5rem', marginBottom: '2.5rem', border: '1px solid rgba(245, 158, 11, 0.2)', background: 'rgba(245, 158, 11, 0.03)', borderRadius: '16px' }}>
            <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 800 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              CANCELLATION POLICY
            </h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.5 }}>
              Appointments cancelled within 24 hours are subject to a **50% fee**. Refunds are processed automatically.
            </p>
          </div>

          {/* Upcoming List */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
             <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', letterSpacing: '-0.5px' }}>Upcoming Bookings</h2>
             {upcoming.length === 0 ? (
               <p style={{ opacity: 0.4, fontStyle: 'italic' }}>No active bookings. Start fresh today!</p>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {upcoming.map(group => (
                    <div key={group.bookingGroupId || group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                         <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{group.startTime.toLocaleDateString('en-AU', { month: 'short' })}</span>
                            <span style={{ fontSize: '1.2rem' }}>{group.startTime.getUTCDate()}</span>
                         </div>
                         <div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                               {group.bookingGroupId ? `Group Visit` : `Private Session`}
                            </span>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.1rem 0' }}>
                              {group.services.map((s: any) => s.name).join(" + ")}
                            </h3>
                            <p style={{ fontSize: '0.85rem', opacity: 0.5 }}>{group.tenant.name} • {group.barber.name}</p>
                         </div>
                      </div>
                       <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.8rem' }}>
                          <div>
                            <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                               {(() => {
                                   const h = group.startTime.getUTCHours();
                                   const m = group.startTime.getUTCMinutes();
                                   const ampm = h >= 12 ? 'PM' : 'AM';
                                   const h12 = h % 12 || 12;
                                   return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                               })()}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.2rem' }}>${group.totalPrice.toFixed(2)}</p>
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

          {/* History */}
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Previous Sessions</h2>
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

          <div className="glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4, marginBottom: '1.5rem', fontWeight: 800 }}>Account Maturity</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                   <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Lifetime Visits</span>
                   <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{appointments.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                   <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Total Spent</span>
                   <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      ${mappedAppointments.reduce((acc, app) => {
                         if (app.status === 'CANCELLED' && app.paymentStatus === 'PARTIAL_REFUNDED') return acc + (app.service.price * 0.5);
                         if (app.status === 'CANCELLED') return acc;
                         return acc + app.service.price;
                      }, 0).toFixed(2)}
                   </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>Member Since</span>
                   <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{new Date().getFullYear()}</span>
                </div>
          </div>

          {myGiftCards.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.5, marginBottom: '1.2rem', fontWeight: 800 }}>
                ✨ Active Credits
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myGiftCards.map((card) => (
                  <div key={card.id} className="glass" style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <p style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 800, marginBottom: '0.5rem' }}>{card.code}</p>
                    <p style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)', margin: 0 }}>
                      ${card.balance.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
