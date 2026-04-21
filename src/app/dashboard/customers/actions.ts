"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getShopCustomers(tenantId: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session) throw new Error("Unauthorized: No session detected.");

  const isGlobalPlatformAdmin = user.role === 'ADMIN' && !user.tenantId;
  const isCorrectTenantOwner = user.tenantId === tenantId;

  if (!isGlobalPlatformAdmin && !isCorrectTenantOwner) {
    console.error(`SECURITY: Blocked customer fetch for tenant ${tenantId} by user ${user.id} (Role: ${user.role})`);
    throw new Error("Unauthorized: You do not have permission to access this shop's directory.");
  }

  // Fetch users who have booked at this shop (via appointments) or are linked to the tenant
  // For simplicity, we'll fetch all CUSTOMER rol users linked to this tenant
  return await prisma.user.findMany({
    where: { 
        tenantId,
        role: "CUSTOMER"
    },
    orderBy: { createdAt: 'desc' },
    include: {
        _count: {
            select: { appointments: true }
        },
        appointments: {
            where: { tenantId },
            orderBy: { startTime: 'desc' },
            take: 1
        }
    }
  });
}

export async function toggleCustomerStatus(userId: string, tenantId: string, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  // Authorization Engine
  const isGlobalPlatformAdmin = user?.role === 'ADMIN' && !user?.tenantId;
  const isCorrectTenantOwner = user?.tenantId === tenantId;
  
  if (!isGlobalPlatformAdmin && !isCorrectTenantOwner) {
     throw new Error("Unauthorized: Operation restricted to Platform Admins or Shop Owners.");
  }

  await (prisma.user as any).update({
    where: { id: userId },
    data: { isActive: !currentStatus }
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/admin/customers");
  return { success: true };
}

export async function deleteCustomer(userId: string, tenantId: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session) throw new Error("Unauthorized");

  const isGlobalPlatformAdmin = user?.role === 'ADMIN' && !user?.tenantId;
  const isCorrectTenantOwner = user?.tenantId === tenantId;
  
  if (!isGlobalPlatformAdmin && !isCorrectTenantOwner) {
     throw new Error("Unauthorized: Platform Admin status required for deletion.");
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/admin/customers");
  return { success: true };
}
