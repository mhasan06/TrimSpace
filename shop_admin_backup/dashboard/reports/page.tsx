import styles from "../page.module.css";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import RevenueChart from "@/components/RevenueChart";
import { getTerminology } from "@/lib/terminology";
import ShopSettlementLedger from "@/components/ShopSettlementLedger";
import ShopSettlementDashboard from "@/components/ShopSettlementDashboard";
import { getActiveTenantContext } from "@/lib/support";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export default async function Reporting({ searchParams }: { searchParams: { from?: string, to?: string } }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const context = await getActiveTenantContext();
  const tenantId = context?.tenantId;
  const role = (session?.user as any)?.role;

  const fromDate = params.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const toDate = params.to || new Date().toISOString().split('T')[0];
  
  const fromObj = new Date(`${fromDate}T00:00:00.000Z`);
  const toObj = new Date(`${toDate}T23:59:59.999Z`);

  // 1. All revenue-generating appointments (including cancellations)
  const allPaidAppointments: any[] = role === "ADMIN"
    ? await prisma.$queryRaw`
        SELECT a.*, s.name as "serviceName", s.price as "servicePrice", s."durationMinutes" as "serviceDuration", u.name as "customerName", u.email as "customerEmail"
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE a."status" != 'CANCELLED'
      `
    : await prisma.$queryRaw`
        SELECT a.*, s.name as "serviceName", s.price as "servicePrice", s."durationMinutes" as "serviceDuration", u.name as "customerName", u.email as "customerEmail"
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE a."tenantId" = ${tenantId} AND a."status" != 'CANCELLED'
      `;

  // 2. 30-Day Daily Revenue Split (Including Cancellations)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPaid: any[] = role === "ADMIN"
    ? await prisma.$queryRaw`
        SELECT DATE(a."startTime") as day, SUM(s.price) as stripe, SUM(0) as gift
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        WHERE a."status" != 'CANCELLED' AND a."startTime" >= ${thirtyDaysAgo}
        GROUP BY DATE(a."startTime")
        ORDER BY day ASC
      `
    : await prisma.$queryRaw`
        SELECT DATE(a."startTime") as day, SUM(s.price) as stripe, SUM(0) as gift
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        WHERE a."tenantId" = ${tenantId} AND a."status" != 'CANCELLED' AND a."startTime" >= ${thirtyDaysAgo}
        GROUP BY DATE(a."startTime")
        ORDER BY day ASC
      `;

  const revenueChartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const iso = d.toISOString().split('T')[0];
    const found = recentPaid.find((r: any) => String(r.day).startsWith(iso));
    return { date: iso, stripe: found ? Number(found.stripe) : 0, gift: found ? Number(found.gift) : 0 };
  });

  // 4. Fetch Official Settlement Batches
  const officialSettlements: any[] = await prisma.settlement.findMany({
    where: { tenantId: tenantId! },
    include: { tenant: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const tenant = tenantId ? await prisma.tenant.findUnique({ where: { id: tenantId! } }) : null;
  const terminology = getTerminology(tenant?.category);

  // 3. Settlement table raw data - Filtered by Range
  const settledAppointments: any[] = role === "ADMIN"
    ? await prisma.$queryRaw`
        SELECT a.*, s.name as sn, s.price as sp, u.name as cn
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE (a."paymentStatus" IN ('PAID', 'PARTIAL_REFUNDED'))
          AND a."startTime" >= ${fromObj} AND a."startTime" <= ${toObj}
        ORDER BY a."startTime" DESC LIMIT 1000
      `
    : await prisma.$queryRaw`
        SELECT a.*, s.name as sn, s.price as sp, u.name as cn
        FROM "Appointment" a
        JOIN "Service" s ON a."serviceId" = s.id
        JOIN "User" u ON a."customerId" = u.id
        WHERE a."tenantId" = ${tenantId} 
          AND (a."paymentStatus" IN ('PAID', 'PARTIAL_REFUNDED'))
          AND a."startTime" >= ${fromObj} AND a."startTime" <= ${toObj}
        ORDER BY a."startTime" DESC LIMIT 1000
      `;

  const totalRevenue = allPaidAppointments.reduce((sum, app) => sum + Number(app.servicePrice || 0), 0);
  const totalAppointments = allPaidAppointments.length;
  const uniqueCustomerIds = new Set(allPaidAppointments.map(a => a.customerId));
  const newCustomers = uniqueCustomerIds.size;

  // Top Services (Actual Revenue)
  const serviceStats = allPaidAppointments.reduce((acc: any, app) => {
    const sId = app.serviceId;
    if (!acc[sId]) acc[sId] = { name: app.serviceName || "System Service", count: 0, revenue: 0, duration: app.serviceDuration || 45 };
    acc[sId].count += 1;
    acc[sId].revenue += Number(app.servicePrice || 0);
    return acc;
  }, {});
  const topServices = Object.values(serviceStats).sort((a: any, b: any) => b.revenue - a.revenue);

  // Top Customers (Actual LTV)
  const customerLTV = allPaidAppointments.reduce((acc: any, app) => {
    const cId = app.customerId;
    if (!acc[cId]) acc[cId] = { name: app.customerName || app.customerEmail || "Guest Client", visits: 0, totalSpend: 0 };
    acc[cId].visits += 1;
    acc[cId].totalSpend += Number(app.servicePrice || 0);
    return acc;
  }, {});
  const topCustomers = Object.values(customerLTV).sort((a: any, b: any) => b.totalSpend - a.totalSpend).slice(0, 5);

  const stripeTotal30 = revenueChartData.reduce((s, d) => s + d.stripe, 0);
  const giftTotal30   = revenueChartData.reduce((s, d) => s + d.gift, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
       {/* New High-End Analytics Dashboard */}
       <AnalyticsDashboard 
          totalRevenue={totalRevenue}
          totalAppointments={totalAppointments}
          newCustomers={newCustomers}
          revenueChartData={revenueChartData}
          topServices={topServices}
          topCustomers={topCustomers}
       />

       {/* Keep Settlement Ledger */}
       <div className={styles.recentSection} style={{ marginTop: '2rem' }}>
          <div className={styles.cardHeader}>
             <h2>Financial Settlement Ledger</h2>
             <div className={styles.cardHeaderAction}>...</div>
          </div>
          <ShopSettlementDashboard appointments={settledAppointments} />
       </div>
    </div>
  );
}
