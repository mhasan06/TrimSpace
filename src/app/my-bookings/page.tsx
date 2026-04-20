import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import InvoiceButton from "@/components/InvoiceButton";
import CancelButton from "@/components/CancelButton";
import SessionHistoryTable from "./SessionHistoryTable";
import CustomerProfileManager from "@/components/CustomerProfileManager";
import CustomerLogoutButton from "@/components/CustomerLogoutButton";

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

  let userReviewIds: string[] = [];
  try {
    const rawReviews = await prisma.$queryRaw<any[]>`SELECT "appointmentId" FROM "Review" WHERE "customerId" = ${userId}`;
    userReviewIds = rawReviews.map(r => r.appointmentId);
  } catch(e) {}

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fe', color: '#1B2559' }}>
      
      {/* ─── LEFT SIDEBAR ─── */}
      <aside style={{ 
          width: '280px', 
          background: '#ffffff', 
          borderRight: '1px solid #E9EDF7',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1.5rem',
          position: 'sticky',
          top: 0,
          height: '100vh'
      }}>
          <div style={{ marginBottom: '3rem', padding: '0 0.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-1px' }}>Trim<span style={{ color: '#4318FF' }}>Space</span></h1>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#A3AED0', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.4rem' }}>Software Portal</p>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '12px', textDecoration: 'none', color: '#A3AED0', fontWeight: 700, transition: 'all 0.2s' }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                 Marketplace
              </Link>
              <Link href="/my-bookings" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '12px', textDecoration: 'none', color: '#4318FF', background: '#F4F7FE', fontWeight: 800 }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                 My Bookings
              </Link>
              <Link href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', borderRadius: '12px', textDecoration: 'none', color: '#A3AED0', fontWeight: 700 }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                 Favorites
              </Link>
              <CustomerLogoutButton />
          </nav>

          <div style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #4318FF 0%, #707EAE 100%)', padding: '1.5rem', borderRadius: '20px', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Need a haircut?</p>
                  <p style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '1rem' }}>Book your next session with ease.</p>
                  <Link href="/" style={{ background: 'white', color: '#4318FF', padding: '0.5rem 1rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block' }}>Book Now</Link>
              </div>
          </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ flex: 1, padding: '2rem 3rem' }}>
          
          {/* Top Profile Banner */}
          <div style={{ 
              height: '320px', 
              background: 'linear-gradient(135deg, #4318FF 0%, #B4B9FF 100%)', 
              borderRadius: '30px', 
              position: 'relative',
              marginBottom: '4rem',
              boxShadow: '0 20px 40px rgba(67, 24, 255, 0.15)'
          }}>
              <div style={{ position: 'absolute', bottom: '-40px', left: '40px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
                  <div style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '30px', 
                      background: '#ffffff', 
                      padding: '8px', 
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)' 
                  }}>
                      <div style={{ 
                          width: '100%', height: '100%', 
                          borderRadius: '24px', 
                          background: '#F4F7FE', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '2.5rem', fontWeight: 900, color: '#4318FF' 
                      }}>
                          {session.user?.name?.[0] || 'U'}
                      </div>
                  </div>
                  <div style={{ paddingBottom: '10px' }}>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1B2559', marginBottom: '0.2rem' }}>{session.user?.name}</h2>
                      <p style={{ color: '#A3AED0', fontWeight: 700, fontSize: '0.9rem' }}>TrimSpace Premium Member</p>
                  </div>
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2.5rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  {/* Upcoming Visits Section */}
                  <div style={{ background: 'white', borderRadius: '30px', padding: '2rem', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Upcoming Visits</h3>
                          <span style={{ fontSize: '0.8rem', color: '#4318FF', fontWeight: 800 }}>{upcoming.length} active</span>
                      </div>

                      {upcoming.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {upcoming.map(group => (
                                  <div key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: '#F4F7FE', borderRadius: '20px' }}>
                                      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
                                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                              <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#4318FF' }}>{group.startTime.toLocaleDateString('en-AU', { month: 'short' })}</span>
                                              <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>{group.startTime.getUTCDate()}</span>
                                          </div>
                                          <div>
                                              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{group.services.map((s:any)=>s.name).join(' + ')}</h4>
                                              <p style={{ fontSize: '0.8rem', color: '#A3AED0', fontWeight: 700 }}>{group.tenant.name} • {group.barber.name}</p>
                                          </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                          <InvoiceButton appointmentId={group.id} bookingId={group.bookingGroupId || group.id.substring(group.id.length - 8)} />
                                          <CancelButton appointmentId={group.id} amountPaidStripe={group.totalStripe} amountPaidGift={group.totalGift} />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <p style={{ color: '#A3AED0', textAlign: 'center', padding: '2rem' }}>No upcoming bookings scheduled.</p>
                      )}
                  </div>

                  {/* History Section */}
                  <div style={{ background: 'white', borderRadius: '30px', padding: '2rem', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2rem' }}>Booking History</h3>
                      <SessionHistoryTable rows={past.map(g => ({
                        id: g.id,
                        startTime: g.startTime.toISOString(),
                        endTime: g.endTime.toISOString(),
                        tenantName: g.tenant.name,
                        tenantSlug: g.tenant.slug,
                        tenantAddress: g.tenant.address,
                        serviceName: g.services.map((s: any) => s.name).join(", "),
                        servicePrice: g.totalPrice,
                        status: g.status,
                        paymentStatus: g.paymentStatus,
                        paymentMethod: g.paymentMethod,
                        amountPaidStripe: g.totalStripe,
                        amountPaidGift: g.totalGift,
                        barberName: g.barber?.name,
                        invoiceUrl: g.invoiceUrl,
                        hasReview: userReviewIds.includes(g.id)
                      }))} />
                  </div>

              </div>

              {/* Sidebar Info Panels */}
              <aside style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  <div style={{ background: 'white', borderRadius: '30px', padding: '2rem', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>General Info</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                          <div>
                              <p style={{ fontSize: '0.75rem', color: '#A3AED0', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Email Address</p>
                              <p style={{ fontSize: '0.95rem', fontWeight: 800 }}>{session.user?.email}</p>
                          </div>
                          <div>
                              <p style={{ fontSize: '0.75rem', color: '#A3AED0', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Account ID</p>
                              <p style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>#{userId?.slice(-12)}</p>
                          </div>
                      </div>
                  </div>

                  <div style={{ background: '#ffffff', borderRadius: '30px', padding: '2rem', boxShadow: '0 10px 20px rgba(0,0,0,0.02)' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Wallet Balance</h3>
                      <div style={{ background: '#F4F7FE', padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                          <p style={{ fontSize: '0.8rem', color: '#A3AED0', fontWeight: 800, marginBottom: '0.5rem' }}>AVAILABLE CREDIT</p>
                          <p style={{ fontSize: '2rem', fontWeight: 900, color: '#4318FF' }}>$0.00</p>
                      </div>
                  </div>

              </aside>

          </div>

      </main>

    </div>
  );
}
