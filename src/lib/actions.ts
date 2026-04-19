"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function registerAction(prevState: any, formData: FormData) {
    const accountType = formData.get("accountType") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const shopName = formData.get("shopName") as string;

    if (!email || !password || !name) {
        return { error: "Missing required profile fields." };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { error: "Email is already registered. Please login." };

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        if (accountType === "business") {
            if (!shopName) return { error: "Shop Name is required for Business accounts." };
            const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
            if (existingTenant) return { error: "A business with a similar name already exists! Please adjust your Shop Name." };

            // Creates the Tenant AND the Barber user simultaneously!
            await prisma.$transaction(async (tx) => {
                const tenant = await tx.tenant.create({ data: { name: shopName, slug } });
                await tx.user.create({ data: { email, name, password: hashedPassword, role: "BARBER", tenantId: tenant.id } });
            });
            return { success: true, message: "Business Registered Successfully! You may now login." };

        } else {
            await prisma.user.create({ data: { email, name, password: hashedPassword, role: "CUSTOMER" } });
            return { success: true, message: "Customer Account Registered! You may now login." };
        }
    } catch (error) {
        return { error: "An internal server error occurred." };
    }
}

export async function toggleShopAction(tenantId: string, isActive: boolean) {
  try {
    // RE-RUNNING RAW SQL to bypass Prisma Client Drift (EPERM fix)
    await prisma.$executeRaw`UPDATE "Tenant" SET "isActive" = ${isActive} WHERE id = ${tenantId}`;
    
    revalidatePath("/admin/shops");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Action Error:", err.message);
    return { error: err.message };
  }
}
