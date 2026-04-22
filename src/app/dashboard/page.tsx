import styles from "./page.module.css";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CalendarUI from "@/components/CalendarUI";
import WeeklyCalendar from "@/components/WeeklyCalendar";
import DashboardAlerts from "@/components/DashboardAlerts";
import { markAlertAsRead } from "./actions";

import { getTerminology } from "@/lib/terminology";
import TrendBarChart from "@/components/TrendBarChart";
import { getActiveTenantContext } from "@/lib/support";
import { redirect } from "next/navigation";

export default async function DashboardOverview({ searchParams }: { searchParams: { date?: string, appointmentId?: string } }) {
  const params = await searchParams;
  const highlightAppointmentId = params.appointmentId;
  const context = await getActiveTenantContext();
  const tenantId = context?.tenantId;
  if (!tenantId) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role === "ADMIN") {
      redirect("/admin");
    }
    return (
      <div style={{ color: 'white', padding: '4rem', textAlign: 'center', background: '#111' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Profile Link Required</h2>
        <p style={{ opacity: 0.8, maxWidth: '500px', margin: '0 auto' }}>
          Your account ({session?.user?.email}) is successfully logged in, but it is not currently linked to a physical shop location.
        </p>
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', opacity: 0.5 }}>
          If you are a shop owner, please contact the platform administrator to link your account to your shop.
        </p>
      </div>
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const terminology = getTerminology(tenant?.category);

  const { getSydneyStartOfMonth, getSydneyEndOfMonth, getSydneyDate } = require("@/lib/dateUtils");
  const nowSydney = getSydneyDate();

  // 1. Resolve Month bounds (Sydney context)
  const targetDateStr = params.date || nowSydney.toISOString().split('T')[0];
  const target = new Date(targetDateStr);
  const startOfMonth = getSydneyStartOfMonth(target);
  const endOfMonth = getSydneyEndOfMonth(target);

  // Use Raw SQL to bypass stale Prisma Client and fetch all appointments for the month
  const rawAppointments = await prisma.$queryRawUnsafe<any[]>(`
    SELECT a.*, u.name as "customerName", s.name as "serviceName", s.price as "servicePrice", s."durationMinutes" as "serviceDuration"
    FROM "Appointment" a
    JOIN "User" u ON a."customerId" = u.id
    JOIN "Service" s ON a."serviceId" = s.id
    WHERE a."tenantId" = $1 
    AND a."startTime" >= $2 
    AND a."startTime" <= $3
    ORDER BY a."startTime" ASC
  `, tenantId, startOfMonth, endOfMonth);

  const dayAppointments = rawAppointments.map(app => ({
    ...app,
    customer: { name: app.customerName },
    service: { name: app.serviceName, price: app.servicePrice, durationMinutes: app.serviceDuration },
    startTime: app.startTime.toISOString(),
    endTime: app.endTime.toISOString()
  }));

  // 2. Today's Stats (Sydney context)
  const startOfToday = new Date(nowSydney);
  startOfToday.setHours(0,0,0,0);
  const endOfToday = new Date(nowSydney);
  endOfToday.setHours(23,59,59,999);

  const [todayStats]: any[] = await Promise.all([
    prisma.$queryRaw`SELECT SUM("amountPaidStripe" + "amountPaidGift") as revenue FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfToday} AND "startTime" <= ${endOfToday}`
  ]);
  const todayRev = Number(todayStats[0]?.revenue || 0);

  // 3. Trend Analysis (Weekly Progress)
  const startOfThisWeek = new Date(nowSydney);
  startOfThisWeek.setDate(nowSydney.getDate() - nowSydney.getDay());
  startOfThisWeek.setHours(0,0,0,0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const [thisWeekStats, lastWeekStats]: any[] = await Promise.all([
    prisma.$queryRaw`SELECT SUM("amountPaidStripe" + "amountPaidGift") as revenue, COUNT(id) as total FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfThisWeek}`,
    prisma.$queryRaw`SELECT SUM("amountPaidStripe" + "amountPaidGift") as revenue, COUNT(id) as total FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfLastWeek} AND "startTime" < ${startOfThisWeek}`
  ]);

  const thisWeekRev = Number(thisWeekStats[0]?.revenue || 0);
  const lastWeekRev = Number(lastWeekStats[0]?.revenue || 0);
  const weekProgress = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0;

  // 4. Monthly & YTD Progress
  const startOfThisMonth = new Date(nowSydney.getFullYear(), nowSydney.getMonth(), 1);
  const startOfLastMonth = new Date(nowSydney.getFullYear(), nowSydney.getMonth() - 1, 1);
  const startOfThisYear = new Date(nowSydney.getFullYear(), 0, 1);
  
  const [thisMonthStats, lastMonthStats, ytdStats]: any[] = await Promise.all([
    prisma.$queryRaw`SELECT SUM("amountPaidStripe" + "amountPaidGift") as revenue FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfThisMonth}`,
    prisma.$queryRaw`SELECT SUM("amountPaidStripe" + "amountPaidGift") as revenue FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfLastMonth} AND "startTime" < ${startOfThisMonth}`,
    prisma.$queryRaw`SELECT SUM("amountPaidStripe" + "amountPaidGift") as revenue FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfThisYear}`
  ]);

  const thisMonthRev = Number(thisMonthStats[0]?.revenue || 0);
  const lastMonthRev = Number(lastMonthStats[0]?.revenue || 0);
  const ytdRev = Number(ytdStats[0]?.revenue || 0);
  const monthProgress = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

  // 4. Staff Leadership Data (Past 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const barbers = await prisma.user.findMany({ 
    where: { tenantId, role: { in: ['BARBER', 'ADMIN'] } }
  });

  let barberReviews: any[] = [];
  try {
    barberReviews = await prisma.$queryRaw`SELECT "barberId", "rating" FROM "Review" WHERE "tenantId" = ${tenantId}`;
  } catch(e) {
    console.log("Review table sync in progress...");
  }
  const staffStats: any[] = await prisma.$queryRaw`
    SELECT 
      "barberId", 
      COUNT(id) as jobs, 
      SUM("amountPaidStripe" + "amountPaidGift") as revenue
    FROM "Appointment"
    WHERE "tenantId" = ${tenantId} AND "startTime" >= ${thirtyDaysAgo}
    GROUP BY "barberId"
  `;

  // 5. Weekly Outlook Data (Next 7 Days - UTC Aligned)
  const outlook: any[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    
    const s = new Date(`${dateStr}T00:00:00.000Z`);
    const e = new Date(`${dateStr}T23:59:59.999Z`);
    
    const dayStats: any[] = await prisma.$queryRaw`
      SELECT COUNT(id) as count, SUM("amountPaidStripe" + "amountPaidGift") as revenue
      FROM "Appointment"
      WHERE "tenantId" = ${tenantId} AND "startTime" >= ${s} AND "startTime" <= ${e}
    `;
    outlook.push({
      date: dateStr,
      jobCount: Number(dayStats[0]?.count || 0),
      revenue: Number(dayStats[0]?.revenue || 0)
    });
  }

  const alerts = await prisma.merchantAlert.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // 6. Yearly Trends (Monthly & Weekly buckets)
  const startOfYear = new Date(nowSydney.getFullYear(), 0, 1);
  const [monthlyRaw, weeklyRaw]: any[] = await Promise.all([
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "startTime") as bucket, SUM("amountPaidStripe") as stripe, SUM("amountPaidGift") as gift
      FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfYear}
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw`
      SELECT DATE_TRUNC('week', "startTime") as bucket, SUM("amountPaidStripe") as stripe, SUM("amountPaidGift") as gift
      FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfYear}
      GROUP BY 1 ORDER BY 1`
  ]);

  const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(nowSydney.getFullYear(), i, 1);
    const monthKey = d.toISOString().slice(0, 7);
    const found = monthlyRaw.find((r: any) => r.bucket.toISOString().startsWith(monthKey));
    return {
      date: d.toLocaleString('default', { month: 'short' }),
      stripe: Number(found?.stripe || 0),
      gift: Number(found?.gift || 0)
    };
  });

  const weeklyTrends = weeklyRaw.map((r: any) => ({
    date: new Date(r.bucket).toLocaleDateString([], { month: 'numeric', day: 'numeric' }),
    stripe: Number(r.stripe),
    gift: Number(r.gift)
  }));

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <h1 style={{ color: 'var(--foreground)', margin: 0 }}>Dashboard Overview</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem', fontWeight: 700 }}>Business Intelligence & Planning</p>
        </div>
        <div className={styles.profileStats} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <DashboardAlerts initialAlerts={alerts as any} />
          <span className={styles.badge} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>{new Date(targetDateStr).toDateString()}</span>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid var(--primary)' }}>
           <h3 style={{ color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 900 }}>Today's Earnings</h3>
           <p className={styles.statNumber} style={{ color: 'var(--foreground)', fontSize: '2.5rem', fontWeight: 900 }}>${todayRev.toFixed(2)}</p>
           <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.6rem', fontWeight: 800, color: 'var(--foreground)' }}>Live Sydney Time</p>
        </div>
        <div className={`${styles.statCard} glass`}>
           <h3 style={{ color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 900 }}>Weekly Progress</h3>
           <p className={styles.statNumber} style={{ color: 'var(--foreground)', fontSize: '2.5rem', fontWeight: 900 }}>${thisWeekRev.toFixed(0)}</p>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: weekProgress >= 0 ? '#10b981' : '#ef4444', background: weekProgress >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                 {weekProgress >= 0 ? '↑' : '↓'} {Math.abs(weekProgress).toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, color: 'var(--foreground)' }}>vs last week</span>
           </div>
        </div>
        <div className={`${styles.statCard} glass`}>
           <h3 style={{ color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 900 }}>MTD Progress</h3>
           <p className={styles.statNumber} style={{ color: 'var(--foreground)', fontSize: '2.5rem', fontWeight: 900 }}>${thisMonthRev.toFixed(0)}</p>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: monthProgress >= 0 ? '#10b981' : '#ef4444', background: monthProgress >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                 {monthProgress >= 0 ? '↑' : '↓'} {Math.abs(monthProgress).toFixed(1)}%
              </span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 800, color: 'var(--foreground)' }}>vs last month</span>
           </div>
        </div>
        <div className={`${styles.statCard} glass`} style={{ borderLeft: '4px solid var(--accent)' }}>
           <h3 style={{ color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 900 }}>Yearly Total (YTD)</h3>
           <p className={styles.statNumber} style={{ color: 'var(--foreground)', fontSize: '2.5rem', fontWeight: 900 }}>${ytdRev.toFixed(0)}</p>
           <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.6rem', fontWeight: 800, color: 'var(--foreground)' }}>Current Fiscal Year</p>
        </div>
        <div className={`${styles.statCard} glass`}>
           <h3 style={{ color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 900 }}>Active {terminology.staffLabelPlural}</h3>
           <p className={styles.statNumber} style={{ color: 'var(--foreground)', fontSize: '2.5rem', fontWeight: 900 }}>{barbers?.length || 0}</p>
           <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.6rem', fontWeight: 800, color: 'var(--foreground)' }}>Team Capacity</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <WeeklyCalendar weekData={outlook} currentDay={targetDateStr} />
      </div>

      {/* Yearly Trends Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
         <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Trend</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Revenue Progress (2026)</p>
               </div>
            </div>
            <TrendBarChart data={monthlyTrends} />
         </div>

         <div className="glass" style={{ padding: '2rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
               <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Weekly Performance</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Market Flux Analysis</p>
               </div>
            </div>
            <TrendBarChart data={weeklyTrends} />
         </div>
      </div>

      {/* Staff Ledger Section */}
      <section className="glass" style={{ marginTop: '2.5rem', padding: '2rem' }}>
         <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
            {terminology.staffLabel} Performance (Last 30 Days)
         </h3>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {barbers.map(barber => {
              const stats = staffStats.find(s => s.barberId === barber.id);
              const myReviews = barberReviews.filter(r => r.barberId === barber.id);
              const avgRating = myReviews.length > 0 
                 ? (myReviews.reduce((sum, r) => sum + r.rating, 0) / myReviews.length).toFixed(1)
                 : null;

              return (
                <div key={barber.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{barber.name}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {avgRating && (
                          <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 800 }}>
                            ⭐ {avgRating}
                          </span>
                        )}
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 800 }}>ACTIVE</span>
                      </div>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.6, fontSize: '0.8rem' }}>
                      <span>Jobs Completed</span>
                      <span style={{ color: 'white', fontWeight: 700 }}>{stats?.jobs || 0}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ opacity: 0.6 }}>Revenue Produced</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 900 }}>${Number(stats?.revenue || 0).toFixed(2)}</span>
                   </div>
                   <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(Number(stats?.jobs || 0) / 100 * 100, 100)}%`, height: '100%', background: 'var(--primary)' }}></div>
                   </div>
                </div>
              );
            })}
         </div>
      </section>

      <section style={{ marginTop: '2.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Physical Grid View</h2>
            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Shift Deep-Dive</div>
         </div>
         <CalendarUI 
            barbers={barbers} 
            appointments={dayAppointments} 
            currentDateStr={targetDateStr} 
            highlightAppointmentId={highlightAppointmentId}
         />
      </section>
    </>
  );
}
