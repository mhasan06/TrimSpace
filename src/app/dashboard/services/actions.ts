"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function revalidatePortal(tenantId: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true }
    });
    if (tenant?.slug) {
      revalidatePath(`/${tenant.slug}`);
      console.log(`Revalidated portal for slug: ${tenant.slug}`);
    }
  } catch (err) {
    console.error("Portal revalidation error:", err);
  }
}

export async function createServiceAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  
  // Cast type to bypass strict session types since we customized it in auth.ts
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) {
    throw new Error("Unauthorized: B2B Tenant required.");
  }

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10);
    const price = parseFloat(formData.get("price") as string);

    if (!name || isNaN(durationMinutes) || isNaN(price)) {
      throw new Error("Missing required fields or invalid numerical values.");
    }

    console.log(`Creating Service: ${name} for Tenant: ${tenantId}`);

    const id = crypto.randomUUID();
    // Raw SQL to bypass Prisma Client validation issues during dev
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Service" (id, name, description, "durationMinutes", price, "tenantId", "updatedAt", "isActive") 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), true)`,
      id, name, description, durationMinutes, price, tenantId
    );

    revalidatePath("/dashboard/services");
    await revalidatePortal(tenantId);
  } catch (err: any) {
    console.error("Service Creation Error:", err.message);
    throw new Error(`Failed to publish service: ${err.message}`);
  }
}

export async function deleteServiceAction(id: string) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  try {
    await prisma.service.delete({
      where: { id, tenantId }
    });
    revalidatePath("/dashboard/services");
    await revalidatePortal(tenantId);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateServiceAction(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10);
    const price = parseFloat(formData.get("price") as string);

    // Raw SQL Update to bypass local type-checking locks
    await prisma.$executeRawUnsafe(
      `UPDATE "Service" 
       SET name = $1, description = $2, "durationMinutes" = $3, price = $4, "updatedAt" = NOW()
       WHERE id = $5 AND "tenantId" = $6`,
      name, description, durationMinutes, price, id, tenantId
    );
    
    revalidatePath("/dashboard/services");
    await revalidatePortal(tenantId);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function toggleServiceVisibilityAction(id: string, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;
  if (!tenantId) throw new Error("Unauthorized");

  try {
    const newStatus = !currentStatus;
    // Template literal handles boolean mapping to SQL types correctly
    await prisma.$executeRaw`
      UPDATE "Service" 
      SET "isActive" = ${newStatus}, "updatedAt" = NOW()
      WHERE id = ${id} AND "tenantId" = ${tenantId}
    `;
    
    revalidatePath("/dashboard/services");
    revalidatePath(`/dashboard`);
    await revalidatePortal(tenantId);
    return { success: true };
  } catch (err: any) {
    console.error("Raw SQL Toggle Failed:", err.message);
    return { error: err.message };
  }
}

