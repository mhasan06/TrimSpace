"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getStaffStats(tenantId: string) {
  try {
      // Attempt High-Fidelity Query (Assuming Schema Is Synced)
      const stats: any[] = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          u."avatarUrl",
          u.bio,
          COUNT(a.id)::int as total_appointments,
          COALESCE(SUM(s.price), 0)::float as total_revenue
        FROM "User" u
        LEFT JOIN "Appointment" a ON a."barberId" = u.id AND a."paymentStatus" = 'PAID'
        LEFT JOIN "Service" s ON a."serviceId" = s.id
        WHERE u."tenantId" = ${tenantId} AND u.role IN ('BARBER', 'ADMIN')
        GROUP BY u.id, u.name, u.email, u."avatarUrl", u.bio
        ORDER BY total_revenue DESC
      `;
      return stats;
  } catch (err) {
      console.warn("Schema out of sync - falling back to basic staff query");
      // Fallback query without newer columns
      const basicStats: any[] = await prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(a.id)::int as total_appointments,
          COALESCE(SUM(s.price), 0)::float as total_revenue
        FROM "User" u
        LEFT JOIN "Appointment" a ON a."barberId" = u.id AND a."paymentStatus" = 'PAID'
        LEFT JOIN "Service" s ON a."serviceId" = s.id
        WHERE u."tenantId" = ${tenantId} AND u.role IN ('BARBER', 'ADMIN')
        GROUP BY u.id, u.name, u.email
        ORDER BY total_revenue DESC
      `;
      return basicStats.map(s => ({ ...s, avatarUrl: null, bio: null }));
  }
}

// Link an existing user to the shop, or return a shareable join link
export async function inviteStaffMember(email: string, tenantId: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isPlatformAdmin = user?.role === 'ADMIN';
  const isShopOwner = user?.tenantId === tenantId;

  if (!isPlatformAdmin && !isShopOwner) return { error: "Unauthorized" };

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return { error: "Shop not found" };

  // ENFORCE STAFF LIMIT
  const currentStaffCount = await prisma.user.count({
    where: { tenantId, role: { in: ['BARBER', 'ADMIN'] } }
  });

  const limit = (tenant as any).maxBarbers || 3;
  if (currentStaffCount >= limit) {
    return { error: `Staff limit reached. Your shop is currently limited to ${limit} team members. Please contact platform support to increase your capacity.` };
  }

  const existing = await prisma.user.findFirst({ where: { email, tenantId } });
  if (existing) return { error: "A team member with this email is already in your shop." };

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    const joinLink = `${process.env.NEXTAUTH_URL || ''}/partner-login?shopId=${tenantId}&shop=${encodeURIComponent(tenant.name)}`;
    return { success: true, pending: true, joinLink };
  }

  await prisma.user.update({
    where: { email },
    data: { tenantId, role: 'BARBER' }
  });

  revalidatePath("/dashboard/roster");
  return { success: true, pending: false };
}

// Remove a staff member from the tenant
export async function removeStaffMember(staffId: string, tenantId: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isPlatformAdmin = user?.role === 'ADMIN';
  const isShopOwner = user?.tenantId === tenantId;

  if (!isPlatformAdmin && !isShopOwner) return { error: "Unauthorized" };
  if (staffId === user.id) return { error: "You cannot remove yourself as shop owner." };

  await prisma.user.update({
    where: { id: staffId },
    data: { tenantId: null, role: "CUSTOMER" }
  });

  revalidatePath("/dashboard/roster");
  return { success: true };
}

// Update staff member details
export async function updateStaffDetails(staffId: string, tenantId: string, data: { name: string, avatarUrl?: string, bio?: string }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isPlatformAdmin = user?.role === 'ADMIN';
  const isShopOwner = user?.tenantId === tenantId;

  if (!isPlatformAdmin && !isShopOwner) return { error: "Unauthorized" };

  try {
    await prisma.user.update({
      where: { id: staffId, tenantId },
      data: { name: data.name, avatarUrl: data.avatarUrl, bio: data.bio }
    });
    
    revalidatePath("/dashboard/roster");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: "Failed to update staff details" };
  }
}

// Create a completely new staff member
export async function createStaffMember(tenantId: string, data: { name: string, email: string, password?: string, role: string, avatarUrl?: string, bio?: string }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const isPlatformAdmin = user?.role === 'ADMIN';
  const isShopOwner = user?.tenantId === tenantId;

  if (!isPlatformAdmin && !isShopOwner) return { error: "Unauthorized" };

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return { error: "Shop not found" };

    // ENFORCE STAFF LIMIT
    const currentStaffCount = await prisma.user.count({
      where: { tenantId, role: { in: ['BARBER', 'ADMIN'] } }
    });

    const limit = (tenant as any).maxBarbers || 3;
    if (currentStaffCount >= limit) {
      return { error: `Staff limit reached. Your shop is currently limited to ${limit} team members. Please contact platform support to increase your capacity.` };
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
        return { error: "User with this email already exists." };
    }

    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : null;

    try {
      await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          tenant: { connect: { id: tenantId } },
          role: data.role || 'BARBER',
          avatarUrl: data.avatarUrl || null,
          bio: data.bio || null
        }
      });
    } catch(dbErr) {
       console.warn("Schema out of sync during staff creation - falling back to base columns.");
       await (prisma.user as any).create({
         data: {
           name: data.name,
           email: data.email,
           password: hashedPassword,
           tenant: { connect: { id: tenantId } },
           role: data.role || 'BARBER'
         }
       });
    }

    revalidatePath("/dashboard/roster");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to create new staff member" };
  }
}

export async function getStaffSchedules(tenantId: string) {
  try {
    return await prisma.staffSchedule.findMany({
      where: { tenantId }
    });
  } catch (err) {
    return [];
  }
}

export async function updateStaffSchedule(staffId: string, dayOfWeek: number, tenantId: string, data: { isActive?: boolean, startTime?: string, endTime?: string }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.tenantId !== tenantId) throw new Error("Unauthorized");

  try {
    await prisma.staffSchedule.upsert({
      where: { userId_dayOfWeek: { userId: staffId, dayOfWeek } },
      update: data,
      create: {
        userId: staffId,
        dayOfWeek,
        tenantId,
        isActive: data.isActive ?? true,
        startTime: data.startTime ?? '09:00',
        endTime: data.endTime ?? '17:00'
      }
    });

    revalidatePath("/dashboard/roster");
    return { success: true };
  } catch (err) {
    return { error: "Failed to update schedule" };
  }
}
