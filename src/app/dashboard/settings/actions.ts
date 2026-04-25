"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function updateTenantBranding(
  tenantId: string, 
  name: string, 
  slug: string, 
  address?: string, 
  category?: string, 
  templateId?: string, 
  abn?: string, 
  shopImage?: string, 
  galleryImages?: string[], 
  customerPhotos?: string[], 
  description?: string, 
  phone?: string,
  street?: string,
  suburb?: string,
  state?: string,
  phoneCode?: string,
  businessName?: string,
  website?: string
) {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!session) return { error: "Unauthorized" };
    
    const isPlatformAdmin = user.role === 'ADMIN';
    const isShopOwner = user.tenantId === tenantId;
    if (!isPlatformAdmin && !isShopOwner) return { error: "Unauthorized" };

    const fullAddress = street && suburb && state ? `${street}, ${suburb}, ${state}, Australia` : address;

    try {
        await (prisma.tenant as any).update({ 
          where: { id: tenantId }, 
          data: { 
            name, slug, address: fullAddress, category, templateId, abn, shopImage, galleryImages, customerPhotos, description, phone,
            street, suburb, state, phoneCode, businessName, website
          } 
        });
        
        revalidatePath("/dashboard/settings");
        revalidatePath(`/${slug}`);
        revalidatePath("/");
        return { success: true };
   } catch(err: any) {
       console.warn("Full branding update failed, trying fallback...", err.message);
       try {
           // 2. Fallback to Basic Sync (excludes newer columns if db push is still running/failed)
           await (prisma.tenant as any).update({
             where: { id: tenantId },
             data: { name, slug, address, category, templateId, abn, shopImage, galleryImages }
           });
           revalidatePath("/dashboard/settings");
           revalidatePath(`/${slug}`);
           return { success: true, warning: "New features (About/Photos) not synced yet. System in transition." };
       } catch (innerErr) {
           return { error: "Failed to update branding. Slug may be taken or database is unresponsive." };
       }
   }
}

export async function updateBusinessHours(tenantId: string, hoursData: { dayOfWeek: number; openTime: string; closeTime: string; lunchStart: string; lunchEnd: string; activeStaff: number }[]) {
  console.log("SQL OVERRIDE - Save Request Started:", { tenantId });
  
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session) return { error: "Unauthorized" };

  const isPlatformAdmin = user.role === 'ADMIN';
  const isShopOwner = user.tenantId === tenantId;
  if (!isPlatformAdmin && !isShopOwner) throw new Error("Unauthorized");

  try {
     // We use a transaction to ensure either all 7 days save, or none do.
     await prisma.$transaction(async (tx) => {
      // 1. Physically wipe the old operational hours for this tenant via SQL
      await tx.$executeRawUnsafe(
        `DELETE FROM "BusinessHours" WHERE "tenantId" = $1`, 
        tenantId
      );

      // 2. Batch-inject the new configurations directly into the DB engine
      for (const day of hoursData) {
        const id = `cbh_${Math.random().toString(36).substr(2, 9)}`; // Internal ID generator
        const activeStaff = isNaN(Number(day.activeStaff)) ? 1 : Math.max(1, Number(day.activeStaff));
        const lunchStart = day.lunchStart || null;
        const lunchEnd = day.lunchEnd || null;

        await tx.$executeRawUnsafe(
           `INSERT INTO "BusinessHours" ("id", "dayOfWeek", "openTime", "closeTime", "lunchStart", "lunchEnd", "activeStaff", "tenantId", "updatedAt") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
           id, day.dayOfWeek, day.openTime, day.closeTime, lunchStart, lunchEnd, activeStaff, tenantId
        );
      }
    });

    console.log("SQL OVERRIDE - Database Synchronized Successfully");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    console.error("SQL OVERRIDE - CRITICAL FAILURE:", err);
    return { error: `Database Hardware Error: ${err.message}` };
  }
}

export async function addScheduleOverride(tenantId: string, dateStr: string, reason: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session) return { error: "Unauthorized" };

  const isPlatformAdmin = user.role === 'ADMIN';
  const isShopOwner = user.tenantId === tenantId;
  if (!isPlatformAdmin && !isShopOwner) throw new Error("Unauthorized");

  try {
    await prisma.scheduleOverride.create({
      data: { tenantId, date: dateStr, reason, isClosed: true }
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to block date" };
  }
}

export async function removeScheduleOverride(overrideId: string) {
  try {
    await prisma.scheduleOverride.delete({ where: { id: overrideId } });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to remove block" };
  }
}
