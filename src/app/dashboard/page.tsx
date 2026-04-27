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

  // Use native Prisma to avoid any Raw SQL timezone parameter issues
  const startIso = new Date(target.getFullYear(), target.getMonth(), 1).toISOString();
  const endIso = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const dbAppointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenantId,
      startTime: {
        gte: new Date(startIso),
        lte: new Date(endIso)
      }
    },
    include: {
      customer: { select: { name: true } },
      service: { select: { name: true, price: true, durationMinutes: true } }
    },
    orderBy: { startTime: 'asc' }
  });

  const dayAppointments = dbAppointments.map(app => ({
    ...app,
    customer: { name: app.customer?.name || 'Anonymous' },
    service: { name: app.service?.name || 'Unknown', price: app.service?.price || 0, durationMinutes: app.service?.durationMinutes || 0 },
    startTime: app.startTime.toISOString(),
    endTime: app.endTime.toISOString()
  }));

  // 2. High-Performance Stats Aggregation (Single Batch)
  const startOfToday = new Date(nowSydney);
  startOfToday.setHours(0,0,0,0);

  const startOfThisWeek = new Date(nowSydney);
  startOfThisWeek.setDate(nowSydney.getDate() - nowSydney.getDay());
  startOfThisWeek.setHours(0,0,0,0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const startOfThisMonth = new Date(nowSydney.getFullYear(), nowSydney.getMonth(), 1);
  const startOfLastMonth = new Date(nowSydney.getFullYear(), nowSydney.getMonth() - 1, 1);

  const startOfThisYear = new Date(nowSydney.getFullYear(), 0, 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [globalStats, outlookRaw, staffStats, monthlyRaw, weeklyRaw, uniqueCustomerCount, barbers, barberReviews, alerts]: any[] = await Promise.all([
    // 1. Grouped Financial Stats
    prisma.$queryRaw`
      SELECT 
        SUM(CASE WHEN "startTime" >= ${startOfToday} AND status != 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as today_rev,
        SUM(CASE WHEN "startTime" >= ${startOfToday} AND status = 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as today_can,
        SUM(CASE WHEN "startTime" >= ${startOfThisWeek} AND status != 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as week_rev,
        SUM(CASE WHEN "startTime" >= ${startOfThisWeek} AND status = 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as week_can,
        SUM(CASE WHEN "startTime" >= ${startOfLastWeek} AND "startTime" < ${startOfThisWeek} AND status != 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as last_week_rev,
        SUM(CASE WHEN "startTime" >= ${startOfThisMonth} AND status != 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as month_rev,
        SUM(CASE WHEN "startTime" >= ${startOfThisMonth} AND status = 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as month_can,
        SUM(CASE WHEN "startTime" >= ${startOfLastMonth} AND "startTime" < ${startOfThisMonth} AND status != 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as last_month_rev,
        SUM(CASE WHEN "startTime" >= ${startOfThisYear} AND status != 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as ytd_rev,
        SUM(CASE WHEN "startTime" >= ${startOfThisYear} AND status = 'CANCELLED' THEN "amountPaidStripe" + "amountPaidGift" ELSE 0 END) as ytd_can
      FROM "Appointment" WHERE "tenantId" = ${tenantId}`,
    
    // 2. Optimized 7-Day Outlook
    prisma.$queryRaw`
      SELECT DATE_TRUNC('day', "startTime") as day, COUNT(id) as count, SUM("amountPaidStripe" + "amountPaidGift") as rev
      FROM "Appointment" 
      WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfToday} AND "startTime" < ${new Date(Date.now() + 8 * 86400000)}
      GROUP BY 1 ORDER BY 1`,

    // 3. Staff Performance (30 Days)
    prisma.$queryRaw`
      SELECT "barberId", COUNT(id) as jobs, SUM("amountPaidStripe" + "amountPaidGift") as revenue
      FROM "Appointment"
      WHERE "tenantId" = ${tenantId} AND "startTime" >= ${thirtyDaysAgo}
      GROUP BY 1`,

    // 4. Yearly Trends (Monthly)
    prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "startTime") as bucket, SUM("amountPaidStripe") as stripe, SUM("amountPaidGift") as gift
      FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfThisYear}
      GROUP BY 1 ORDER BY 1`,
      
    // 5. Yearly Trends (Weekly)
    prisma.$queryRaw`
      SELECT DATE_TRUNC('week', "startTime") as bucket, SUM("amountPaidStripe") as stripe, SUM("amountPaidGift") as gift
      FROM "Appointment" WHERE "tenantId" = ${tenantId} AND "startTime" >= ${startOfThisYear}
      GROUP BY 1 ORDER BY 1`,

    // 6. Optimized Client Count (Fast relational check)
    prisma.user.count({ where: { role: "CUSTOMER", OR: [{ tenantId }, { appointments: { some: { tenantId } } }] } }),

    // 7. Team Details
    prisma.user.findMany({ 
      where: { tenantId, role: { in: ['BARBER', 'ADMIN'] } },
      select: { id: true, name: true, role: true }
    }),

    // 8. Staff Reviews
    prisma.review.findMany({ 
      where: { tenantId },
      select: { id: true, barberId: true, rating: true }
    }),

    // 9. Merchant Alerts
    prisma.merchantAlert.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ]);

  const stats = globalStats[0];
  const todayRev = Number(stats?.today_rev || 0);
  const todayCancelledRev = Number(stats?.today_can || 0);
  const thisWeekRev = Number(stats?.week_rev || 0);
  const lastWeekRev = Number(stats?.last_week_rev || 0);
  const thisWeekCancelledRev = Number(stats?.week_can || 0);
  const thisMonthRev = Number(stats?.month_rev || 0);
  const lastMonthRev = Number(stats?.last_month_rev || 0);
  const thisMonthCancelledRev = Number(stats?.month_can || 0);
  const ytdRev = Number(stats?.ytd_rev || 0);
  const ytdCancelledRev = Number(stats?.ytd_can || 0);
  
  const weekProgress = lastWeekRev > 0 ? ((thisWeekRev - lastWeekRev) / lastWeekRev) * 100 : 0;
  const monthProgress = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

  // Process Outlook
  const outlook = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const found = outlookRaw.find((r: any) => r.day.toISOString().startsWith(dateStr));
    return {
      date: dateStr,
      jobCount: Number(found?.count || 0),
      revenue: Number(found?.rev || 0)
    };
  });

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Main Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderTop: '4px solid #6366f1' }}>
           <h3>📅 Today's Revenue</h3>
           <p className={styles.statNumber}>${(todayRev + todayCancelledRev).toFixed(2)}</p>
           <div style={{ marginTop: '1rem', display: 'flex', gap: '0.8rem', fontSize: '0.75rem', fontWeight: 700 }}>
              <span style={{ color: '#10b981' }}>Services: ${todayRev.toFixed(0)}</span>
              <span style={{ color: '#ef4444' }}>Cancels: ${todayCancelledRev.toFixed(0)}</span>
           </div>
        </div>
        <div className={styles.statCard}>
           <h3>📈 Weekly Growth</h3>
           <p className={styles.statNumber}>${(thisWeekRev + thisWeekCancelledRev).toFixed(0)}</p>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: weekProgress >= 0 ? '#10b981' : '#ef4444', background: weekProgress >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
                 {weekProgress >= 0 ? '↑' : '↓'} {Math.abs(weekProgress).toFixed(1)}% vs last week
              </span>
           </div>
        </div>
        <div className={styles.statCard}>
           <h3>🗓️ Month to Date</h3>
           <p className={styles.statNumber}>${(thisMonthRev + thisMonthCancelledRev).toFixed(0)}</p>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: monthProgress >= 0 ? '#10b981' : '#ef4444', background: monthProgress >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
                 {monthProgress >= 0 ? '↑' : '↓'} {Math.abs(monthProgress).toFixed(1)}% vs last month
              </span>
           </div>
        </div>
        <div className={styles.statCard} style={{ borderTop: '4px solid #10b981' }}>
           <h3>👥 Client Base</h3>
           <p className={styles.statNumber}>{uniqueCustomerCount}</p>
           <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem', fontWeight: 700 }}>Total Unique Customers</p>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem', color: '#0f172a' }}>Next 7 Days Outlook</h2>
        <WeeklyCalendar weekData={outlook} currentDay={targetDateStr} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
         <div className={styles.recentSection}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginBottom: '2rem' }}>Monthly Revenue Trend</h3>
            <TrendBarChart data={monthlyTrends} />
         </div>

         <div className={styles.recentSection}>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748b', letterSpacing: '1px', marginBottom: '2rem' }}>Weekly Market Flux</h3>
            <TrendBarChart data={weeklyTrends} />
         </div>
      </div>

      <section className={styles.recentSection}>
         <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '2rem', color: '#0f172a' }}>
            {terminology.staffLabel} Leaderboard (30 Days)
         </h3>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {barbers.map(barber => {
              const stats = (staffStats as any[]).find((s: any) => s.barberId === barber.id);
              const myReviews = (barberReviews as any[]).filter((r: any) => r.barberId === barber.id);
              const avgRating = myReviews.length > 0 
                 ? (myReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / myReviews.length).toFixed(1)
                 : null;

              return (
                <div key={barber.id} style={{ border: '1px solid #f1f5f9', borderRadius: '20px', padding: '1.8rem', background: '#f8fafc' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{barber.name}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {avgRating && (
                          <span style={{ background: '#fff', color: '#f59e0b', fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '10px', fontWeight: 800, border: '1px solid #fef3c7' }}>
                            ⭐ {avgRating}
                          </span>
                        )}
                      </div>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.85rem', marginBottom: '0.8rem' }}>
                      <span>Jobs Completed</span>
                      <span style={{ color: '#0f172a', fontWeight: 800 }}>{stats?.jobs || 0}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>Revenue Contribution</span>
                      <span style={{ color: '#6366f1', fontWeight: 900 }}>${Number(stats?.revenue || 0).toFixed(2)}</span>
                   </div>
                   <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', marginTop: '1.5rem', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(Number(stats?.jobs || 0) / 100 * 100, 100)}%`, height: '100%', background: '#6366f1' }}></div>
                   </div>
                </div>
              );
            })}
         </div>
      </section>

      <section style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Real-time Booking Grid</h2>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Live Status</div>
         </div>
         <CalendarUI 
            barbers={barbers} 
            appointments={dayAppointments} 
            currentDateStr={targetDateStr} 
            highlightAppointmentId={highlightAppointmentId}
         />
      </section>
    </div>
  );
}
