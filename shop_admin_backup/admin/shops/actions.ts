"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleShopAction(tenantId: string, isActive: boolean) {
  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive }
    });
    revalidatePath("/admin/shops");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateShopFeaturesAction(tenantId: string, features: string[]) {
  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { enabledFeatures: features }
    });
    revalidatePath("/admin/shops");
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateBarberLimitAction(tenantId: string, maxBarbers: number) {
  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { maxBarbers }
    });
    revalidatePath("/admin/shops");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
