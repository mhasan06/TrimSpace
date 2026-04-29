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

  const [globalStats, outlookRaw, staffStats, monthlyRaw, weeklyRaw, uniqueCustomerCount, barbers, barberReviews, alerts, shopBusinessHours]: any[] = await Promise.all([
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
      select: { 
        id: true, 
        name: true, 
        role: true,
        staffSchedules: {
          where: { isActive: true }
        }
      }
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
    }),

    // 10. Business Hours
    prisma.businessHours.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: 'asc' }
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

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const upcomingAppointments = dayAppointments
    .filter((app: any) => {
        const d = new Date(app.startTime);
        return d >= new Date() && d <= endOfToday;
    })
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

    return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
       {/* Top Row: Calendar & Staff Schedule */}
       <div className={styles.mockupGridTop}>
          <div className={styles.recentSection} style={{ marginBottom: 0 }}>
             <div className={styles.cardHeader}>
                <h2>Weekly Appointments Calendar</h2>
                <div className={styles.cardHeaderAction}>...</div>
             </div>
             <div style={{ marginTop: '1rem', height: '500px', overflow: 'auto' }}>
                 <CalendarUI 
                    barbers={barbers} 
                    appointments={dayAppointments} 
                    currentDateStr={targetDateStr} 
                    highlightAppointmentId={highlightAppointmentId} 
                 />
             </div>
          </div>

          <div className={styles.recentSection} style={{ marginBottom: 0 }}>
             <div className={styles.cardHeader}>
                <h2>Staff Schedule</h2>
                <div className={styles.cardHeaderAction}>...</div>
             </div>
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginBottom: '0.5rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>
                {['M','T','W','T','F','S','S'].map((day, i) => (
                    <div key={i} style={{ width: 28, textAlign: 'center' }}>{day}</div>
                ))}
             </div>
             <div>
                 {(barbers as any[]).map(barber => {
                    // Monday to Sunday map
                    const displayDays = [1, 2, 3, 4, 5, 6, 0];
                    const blocks = displayDays.map(day => {
                        const sched = barber.staffSchedules?.find((s: any) => s.dayOfWeek === day);
                        return sched ? 1 : 2; // 1 = Scheduled, 2 = Off/Break
                    });
                    
                    return (
                    <div key={barber.id} className={styles.staffItem}>
                       <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#64748b', fontSize: '1.2rem', flexShrink: 0 }}>
                          {barber.name.charAt(0)}
                       </div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{barber.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{barber.role}</div>
                       </div>
                       <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {blocks.map((b, i) => (
                              <div key={i} style={{ 
                                  width: 28, height: 32, borderRadius: 6, 
                                  background: b === 1 ? '#3b429f' : '#e2e8f0',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                  {b === 1 && <span style={{ fontSize: '0.5rem', color: 'white', fontWeight: 800 }}>In</span>}
                              </div>
                          ))}
                       </div>
                    </div>
                 )})}
             </div>
             <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#3b429f' }}></div> Scheduled</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#f1f5f9', border: '1px solid #e2e8f0' }}></div> Availability</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#e2e8f0' }}></div> Break</div>
             </div>
          </div>
       </div>

       {/* Bottom Row: Revenue, Upcoming, Performance */}
       <div className={styles.mockupGridBottom}>
          <div className={styles.recentSection} style={{ marginBottom: 0 }}>
             <div className={styles.cardHeader}>
                <h2>Revenue Overview</h2>
                <div className={styles.cardHeaderAction}>...</div>
             </div>
             <div className={styles.miniStatLabel}>Monthly revenue</div>
             <div className={styles.miniStatValue}>${(thisMonthRev + thisMonthCancelledRev).toFixed(0)}</div>
             <div style={{ marginTop: '2rem' }}>
                <TrendBarChart data={monthlyTrends} />
             </div>
          </div>

          <div className={styles.recentSection} style={{ marginBottom: 0 }}>
             <div className={styles.cardHeader}>
                <h2>Upcoming Bookings</h2>
                <div className={styles.cardHeaderAction}>...</div>
             </div>
             <div>
                {upcomingAppointments.map((app: any) => (
                   <div key={app.id} className={styles.upcomingBookingItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                         <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#64748b', fontSize: '0.9rem' }}>
                            {app.customer.name.charAt(0)}
                         </div>
                         <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{app.customer.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{app.service.name}</div>
                         </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                         {new Date(app.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </div>
                   </div>
                ))}
                {upcomingAppointments.length === 0 && (
                   <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>No upcoming bookings today.</div>
                )}
             </div>
          </div>

          <div className={styles.recentSection} style={{ marginBottom: 0 }}>
             <div className={styles.cardHeader}>
                <h2>Shop Performance</h2>
                <div className={styles.cardHeaderAction}>...</div>
             </div>
             
             <div style={{ marginBottom: '2rem' }}>
                <div className={styles.miniStatLabel}>Bookings (This Month)</div>
                <div className={styles.miniStatValue}>{outlookRaw.length ? outlookRaw.reduce((acc: any, curr: any) => acc + Number(curr.count), 0) : dayAppointments.length}</div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60px' }}>
                   {[40, 60, 50, 80, 70, 90, 85].map((val, i) => (
                       <div key={i} style={{ flex: 1, background: '#3b429f', borderRadius: '4px 4px 0 0', height: `${val}%` }}></div>
                   ))}
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                   <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59, 66, 159, 0.1)', border: '1px solid rgba(59, 66, 159, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💵</div>
                   <div>
                      <div className={styles.miniStatLabel} style={{ marginBottom: 0 }}>YTD Revenue</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>${ytdRev.toFixed(0)}</div>
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                   <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59, 66, 159, 0.1)', border: '1px solid rgba(59, 66, 159, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>👥</div>
                   <div>
                      <div className={styles.miniStatLabel} style={{ marginBottom: 0 }}>Active Clients</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>{uniqueCustomerCount}</div>
                   </div>
                </div>
             </div>
          </div>

          <div className={styles.recentSection} style={{ marginBottom: 0 }}>
             <div className={styles.cardHeader}>
                <h2>Business Hours</h2>
                <div className={styles.cardHeaderAction}>...</div>
             </div>
             <div style={{ marginTop: '1rem' }}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((dayName, idx) => {
                    const dayNum = (idx + 1) % 7;
                    const hours = (shopBusinessHours as any[]).find(h => h.dayOfWeek === dayNum);
                    return (
                        <div key={dayName} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: idx === 6 ? 'none' : '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>{dayName}</span>
                            <span style={{ fontWeight: 800, color: hours ? '#0f172a' : '#ef4444', fontSize: '0.9rem' }}>
                                {hours ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}
                            </span>
                        </div>
                    );
                })}
             </div>
          </div>
       </div>
    </div>
  );
}
