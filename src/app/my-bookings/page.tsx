import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CustomerDashboardClient from "./CustomerDashboardClient";

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
    SELECT a.*, a."isDisputed", a."disputeStatus", a."disputeReason", t.name as "tenantName", t.slug as "tenantSlug", t.address as "tenantAddress", 
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

  const { getSydneyDate } = require("@/lib/dateUtils");
  const now = getSydneyDate();
  
  const groupList = (list: any[]) => {
    const groups: any[] = [];
    const map = new Map();
    list.forEach(app => {
      const timeStr = new Date(app.startTime).toISOString();
      const gid = app.bookingGroupId || `fallback_${app.tenantId}_${timeStr}`;
      
      if (!map.has(gid)) {
        map.set(gid, { 
            ...app, 
            status: "GROUP", 
            services: [], 
            totalPrice: 0.50,
            ids: [], 
            totalStripe: 0, 
            totalGift: 0,
            startTime: app.startTime,
            endTime: app.endTime
        });
        groups.push(map.get(gid));
      }
      const g = map.get(gid);
      g.services.push({
        id: app.id,
        name: app.service.name,
        price: app.service.price,
        startTime: app.startTime,
        endTime: app.endTime,
        status: app.status,
        isDisputed: app.isDisputed,
        disputeStatus: app.disputeStatus,
        disputeReason: app.disputeReason,
        cancellationFee: app.cancellationFee,
        amountPaidStripe: Number(app.amountPaidStripe || 0),
        amountPaidGift: Number(app.amountPaidGift || 0)
      });
      g.totalPrice += app.service.price;
      g.ids.push(app.id);
      g.totalStripe += Number(app.amountPaidStripe || 0);
      g.totalGift += Number(app.amountPaidGift || 0);
    });
    return groups;
  };

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: { tenant: true }
  });

  const allGroups = groupList(mappedAppointments.reverse());
  
  // Fetch Dispute Notes for transparency
  const appointmentIds = mappedAppointments.map(a => a.id);
  const disputeNotes = await prisma.disputeNote.findMany({
    where: { appointmentId: { in: appointmentIds } },
    orderBy: { createdAt: 'asc' }
  });

  const upcoming = allGroups.filter((g: any) => 
    new Date(g.startTime) > now && 
    g.services.some((s: any) => s.status !== 'CANCELLED')
  );

  const completedGroups = allGroups.filter((g: any) => 
    new Date(g.startTime) <= now && 
    g.services.some((s: any) => s.status !== 'CANCELLED')
  );

  const cancelledGroups = allGroups.filter((g: any) => 
    g.services.every((s: any) => s.status === 'CANCELLED')
  );

  const completedCount = mappedAppointments.filter(a => a.status === 'COMPLETED' || (new Date(a.startTime) < now && a.status !== 'CANCELLED')).length;
  const cancelledCount = mappedAppointments.filter(a => a.status === 'CANCELLED').length;

  let userReviewIds: string[] = [];
  try {
    const rawReviews = await prisma.$queryRaw<any[]>`SELECT "appointmentId" FROM "Review" WHERE "customerId" = ${userId}`;
    userReviewIds = rawReviews.map(r => r.appointmentId);
  } catch(e) {}

  return (
    <CustomerDashboardClient 
        user={{
            id: dbUser?.id,
            name: dbUser?.name,
            email: dbUser?.email,
            phone: dbUser?.phone,
            suburb: (dbUser as any)?.suburb,
            state: (dbUser as any)?.state,
            gender: (dbUser as any)?.gender,
            avatarUrl: dbUser?.avatarUrl
        }}
        upcoming={upcoming}
        completed={completedGroups}
        cancelled={cancelledGroups}
        favorites={favorites.map(f => f.tenant)}
        userReviewIds={userReviewIds}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
        disputeNotes={disputeNotes}
    />
  );
}
