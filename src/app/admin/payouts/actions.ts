"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculateServiceFees } from "@/lib/pricing";
import { getEffectivePlatformFee } from "@/lib/platform";
import crypto from "crypto";

// Security Helper
async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized: Platform Admin access required.");
  }
  return session;
}

/**
 * Fetch platform settings & upcoming fee schedules
 */
export async function getPlatformSettingsAction() {
  await ensureAdmin();
  try {
    // Auto-fix for legacy 2% default
    await prisma.$executeRawUnsafe(
      `UPDATE "PlatformSettings" SET "defaultPlatformFee" = 0.017 
       WHERE "id" = 'platform_global' AND "defaultPlatformFee" = 0.02`
    );

    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "PlatformSettings" WHERE "id" = 'platform_global' LIMIT 1`
    );
    
    const schedules = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "PlatformFeeSchedule" ORDER BY "effectiveFrom" ASC`
    );

    if (rows.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "PlatformSettings" ("id", "defaultPlatformFee", "penaltyLongThreshold", "penaltyShortThreshold", "penaltyLongRate", "penaltyMidRate", "penaltyShortRate", "updatedAt") 
         VALUES ('platform_global', 0.017, 48, 24, 0.0, 0.2, 1.0, NOW()) 
         ON CONFLICT ("id") DO NOTHING`
      );
      return { 
        id: "platform_global", 
        defaultPlatformFee: 0.017, 
        penaltyLongThreshold: 48,
        penaltyShortThreshold: 24,
        penaltyLongRate: 0.0,
        penaltyMidRate: 0.2,
        penaltyShortRate: 1.0,
        schedules: [] 
      };
    }
    
    return { ...rows[0], schedules };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Update identity or schedule a fee change
 */
export async function updatePlatformSettingsAction(data: {
  fee?: number;
  effectiveFrom?: string; // ISO Date for schedules
  defaultFeeEffectiveFrom?: string; // ISO Date for the global default
  name?: string;
  abl?: string;
  address?: string;
  phone?: string;
  email?: string;
  penaltyLongThreshold?: number;
  penaltyShortThreshold?: number;
  penaltyLongRate?: number;
  penaltyMidRate?: number;
  penaltyShortRate?: number;
}) {
  await ensureAdmin();
  try {
    // 1. Handling Fee Scheduling (separate table)
    if (data.fee !== undefined && data.effectiveFrom) {
      await prisma.platformFeeSchedule.create({
        data: {
          feePercentage: data.fee / 100,
          effectiveFrom: new Date(data.effectiveFrom)
        }
      });
      revalidatePath("/admin/payouts");
      return { success: true };
    }

    // 2. Handling Direct Settings Updates
    const updatePayload: any = {};
    if (data.fee !== undefined) updatePayload.defaultPlatformFee = data.fee / 100;
    if (data.defaultFeeEffectiveFrom !== undefined) {
      updatePayload.defaultFeeEffectiveFrom = data.defaultFeeEffectiveFrom ? new Date(data.defaultFeeEffectiveFrom) : null;
    }
    if (data.name !== undefined) updatePayload.platformName = data.name;
    if (data.abl !== undefined) updatePayload.platformAbl = data.abl;
    if (data.address !== undefined) updatePayload.platformAddress = data.address;
    if (data.phone !== undefined) updatePayload.platformPhone = data.phone;
    if (data.email !== undefined) updatePayload.platformEmail = data.email;
    
    // Cancellation Penalty Rules
    if (data.penaltyLongThreshold !== undefined) updatePayload.penaltyLongThreshold = Number(data.penaltyLongThreshold);
    if (data.penaltyShortThreshold !== undefined) updatePayload.penaltyShortThreshold = Number(data.penaltyShortThreshold);
    if (data.penaltyLongRate !== undefined) updatePayload.penaltyLongRate = Number(data.penaltyLongRate);
    if (data.penaltyMidRate !== undefined) updatePayload.penaltyMidRate = Number(data.penaltyMidRate);
    if (data.penaltyShortRate !== undefined) updatePayload.penaltyShortRate = Number(data.penaltyShortRate);

    const updated = await prisma.platformSettings.update({
      where: { id: 'platform_global' },
      data: updatePayload
    });

    revalidatePath("/admin/payouts");
    // Also revalidate insights since they depend on these fees
    revalidatePath("/admin/insights");

    return { success: true, settings: updated };
  } catch (err: any) {
    console.error("[SETTINGS_UPDATE_ERROR]", err);
    return { error: err.message };
  }
}

/**
 * Master Batcher: Creates Weekly Settlements with Date-Aware Fees
 */
export async function triggerWeeklyRunAction() {
  await ensureAdmin();
  
  try {
    const settingsRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "PlatformSettings" WHERE "id" = 'platform_global' LIMIT 1`
    );
    const settings = settingsRows?.[0] || { defaultPlatformFee: 0.02 };

    // 1. Reprocess Logic: Clear any non-finalized settlements from the effective date onward
    if (settings.defaultFeeEffectiveFrom) {
      const fromDate = new Date(settings.defaultFeeEffectiveFrom);
      
      // Nullify appointments in non-SETTLED batches
      await prisma.$executeRawUnsafe(
        `UPDATE "Appointment" SET "settlementId" = NULL 
         WHERE "settlementId" IN (
           SELECT id FROM "Settlement" 
           WHERE "startDate" >= $1 AND status IN ('OUTSTANDING', 'INVESTIGATION')
         )`,
        fromDate
      );

      // Delete the settlements themselves
      await prisma.$executeRawUnsafe(
        `DELETE FROM "Settlement" 
         WHERE "startDate" >= $1 AND status IN ('OUTSTANDING', 'INVESTIGATION')`,
        fromDate
      );
    }

    const appointments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.*, s.price as "servicePrice", a."cancellationFee", a."platformFeeRate", a."platformFeeFlat"
       FROM "Appointment" a
       JOIN "Service" s ON a."serviceId" = s.id
       WHERE a."paymentStatus" IN ('PAID', 'PARTIAL_REFUNDED')
         AND a."settlementId" IS NULL`
    );

    if (appointments.length === 0) return { message: "No new activity to batch." };

    const batches: Record<string, { tenantId: string, startDate: Date, endDate: Date, apps: any[] }> = {};
    
    appointments.forEach(app => {
      // Group by Day (Sydney context)
      const target = new Date(app.startTime.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
      const dayKey = target.toISOString().split('T')[0]; // YYYY-MM-DD
      const batchKey = `${dayKey}_${app.tenantId}`;

      if (!batches[batchKey]) {
        // We use the raw target date to derive the range
        const dayStart = new Date(target);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(target);
        dayEnd.setHours(23,59,59,999);
        
        batches[batchKey] = { tenantId: app.tenantId, startDate: dayStart, endDate: dayEnd, apps: [] };
      }
      batches[batchKey].apps.push(app);
    });

    let count = 0;
    for (const key in batches) {
      const batch = batches[key];
      
      // LOOKUP DATE-AWARE FEE (Centralized)
      const feeScale = await getEffectivePlatformFee(batch.startDate);
      
      let totalGross = 0;
      let totalFees = 0;
      let totalNet = 0;

      batch.apps.forEach(a => {
        const actualBaseRev = a.status === 'CANCELLED' ? Number(a.cancellationFee || (a.servicePrice * 0.5)) : Number(a.servicePrice);
        
        // Snapshot Model: Prioritize the rate captured at booking. 
        // Fallback to dynamic feeScale only for legacy appointments (where platformFeeRate might be null/0.017 but we want to be safe)
        const appFeeRate = a.platformFeeRate ?? feeScale;
        const fees = calculateServiceFees(actualBaseRev, appFeeRate);
        
        totalGross += fees.totalCustomerPrice;
        totalFees += (fees.totalCustomerPrice - fees.basePrice);
        totalNet += fees.basePrice;
      });

      console.log(`[BATCHER] Creating Settlement for ${batch.tenantId}: Gross=${totalGross}, Net=${totalNet}, Fees=${totalFees}, FeeScale=${feeScale}`);

      const dayLabel = batch.startDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const weekLabel = `Daily: ${dayLabel}`;

      const settlementId = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Settlement" (id, "tenantId", amount, "grossAmount", "feeAmount", status, "weekLabel", "startDate", "endDate", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'OUTSTANDING', $6, $7, $8, NOW(), NOW())`,
        settlementId, batch.tenantId, totalNet, totalGross, totalFees, weekLabel, batch.startDate, batch.endDate
      );

      const appIds = batch.apps.map(a => a.id);
      for (const appId of appIds) {
        await prisma.$executeRawUnsafe(`UPDATE "Appointment" SET "settlementId" = $1 WHERE id = $2`, settlementId, appId);
      }
      count++;
    }

    revalidatePath("/admin/payouts");
    revalidatePath("/dashboard/reports");
    return { success: true, count };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Standard CRUD actions
 */
export async function deleteFeeScheduleAction(id: string) {
    await ensureAdmin();
    try {
        await prisma.$executeRawUnsafe(`DELETE FROM "PlatformFeeSchedule" WHERE id = $1`, id);
        revalidatePath("/admin/payouts");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateSettlementStatusAction(id: string, status: string, comment?: string) {
  await ensureAdmin();
  try {
    await prisma.$executeRawUnsafe(`UPDATE "Settlement" SET status = $1, "adminComments" = $2, "updatedAt" = NOW() WHERE id = $3`, status, comment || null, id);
    revalidatePath("/admin/payouts");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getSettlementDetailedReportAction(settlementId: string) {
  await ensureAdmin();
  try {
    const appointments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.id, a."startTime", a.status, a."paymentMethod", a."amountPaidStripe", a."bookingGroupId", a."cancellationFee", a."platformFeeRate", a."platformFeeFlat", s.name as "serviceName", s.price as "servicePrice", u.name as "customerName"
       FROM "Appointment" a JOIN "Service" s ON a."serviceId" = s.id JOIN "User" u ON a."customerId" = u.id
       WHERE a."settlementId" = $1 ORDER BY a."startTime" ASC`,
      settlementId
    );
    
    const appsWithFees = [];
    for (const a of appointments) {
      const actualBaseRev = a.status === 'CANCELLED' ? Number(a.cancellationFee || (a.servicePrice * 0.5)) : Number(a.servicePrice);
      
      // Use Snapshot if available
      const feeScale = a.platformFeeRate ?? (await getEffectivePlatformFee(new Date(a.startTime)));
      const fees = calculateServiceFees(actualBaseRev, feeScale);
      
      appsWithFees.push({
        ...a,
        actualServicePrice: fees.basePrice,
        totalWithFee: fees.totalCustomerPrice,
        platformDeduction: fees.totalCustomerPrice - fees.basePrice
      });
    }

    const settlementRows = await prisma.$queryRawUnsafe<any[]>(`SELECT s.*, t.name as "shopName", t.address as "shopAddress" FROM "Settlement" s JOIN "Tenant" t ON s."tenantId" = t.id WHERE s.id = $1 LIMIT 1`, settlementId);
    const platformRows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "PlatformSettings" WHERE id = 'platform_global' LIMIT 1`);
    return { appointments: appsWithFees, settlement: settlementRows[0], platform: platformRows[0] };
  } catch (err: any) { return { error: err.message }; }
}

/**
 * Shop Admin specific reporting (Own tenant only)
 */
export async function getShopSettlementReportAction(settlementId: string) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;
  const role = (session?.user as any)?.role;

  if (role !== "ADMIN" && !tenantId) throw new Error("Unauthorized");

  try {
    // Verify ownership
    const settlementRows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT s.*, t.name as "shopName", t.address as "shopAddress" 
       FROM "Settlement" s 
       JOIN "Tenant" t ON s."tenantId" = t.id 
       WHERE s.id = $1 AND (s."tenantId" = $2 OR $3 = 'ADMIN') 
       LIMIT 1`,
      settlementId, tenantId, role
    );

    if (settlementRows.length === 0) throw new Error("Settlement not found or permission denied.");

    const appointments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT a.id, a."startTime", a.status, a."paymentMethod", a."amountPaidStripe", a."bookingGroupId", a."cancellationFee", a."platformFeeRate", a."platformFeeFlat", s.name as "serviceName", s.price as "servicePrice", u.name as "customerName"
       FROM "Appointment" a JOIN "Service" s ON a."serviceId" = s.id JOIN "User" u ON a."customerId" = u.id
       WHERE a."settlementId" = $1 ORDER BY a."startTime" ASC`,
      settlementId
    );
    // Add Priority Fee to each appointment for the report
    const appsWithFees = [];
    for (const a of appointments) {
      const actualBaseRev = a.status === 'CANCELLED' ? Number(a.cancellationFee || (a.servicePrice * 0.5)) : Number(a.servicePrice);
      
      // Use Snapshot Model
      const feeScale = a.platformFeeRate ?? (await getEffectivePlatformFee(new Date(a.startTime)));
      const fees = calculateServiceFees(actualBaseRev, feeScale);
      
      appsWithFees.push({
        ...a,
        actualServicePrice: fees.basePrice,
        totalWithFee: fees.totalCustomerPrice,
        platformDeduction: fees.totalCustomerPrice - fees.basePrice
      });
    }

    const platformRows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "PlatformSettings" WHERE id = 'platform_global' LIMIT 1`);
    return { appointments: appsWithFees, settlement: settlementRows[0], platform: platformRows[0] };
  } catch (err: any) {
    return { error: err.message };
  }
}
