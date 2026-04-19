"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slotEngine";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function fetchPublicSlots(tenantSlug: string, dateStr: string, totalDurationMinutes: number) {
   const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
   if (!tenant) return { availableSlots: [], reason: "Tenant not found" };

   const slots = await getAvailableSlots(tenant.id, dateStr, totalDurationMinutes);
   return slots;
}

export async function registerCustomer(formData: any) {
  const { name, username, email, phone, password } = formData;
  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existing) throw new Error("Email or Username already taken");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        phone,
        password: hashedPassword,
        role: "CUSTOMER"
      }
    });

    return { success: true, userId: user.id };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createBookingTransaction(
  cart: { serviceId: string; quantity: number }[], 
  tenantSlug: string, 
  targetDateStr: string, 
  targetTimeStr: string,
  paymentMethod: string,
  userId: string,
  stripePaymentIntentId?: string,
  giftCardId?: string,
  amountPaidGift: number = 0
) {
  try {
    if (!userId) throw new Error("Authentication required to finalize booking.");

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new Error("Tenant not found");

    const defaultBarber = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: "BARBER" } });
    if (!defaultBarber) throw new Error("The shop does not have an assigned Barber to accept appointments.");

    // Fetch service durations for accurate endTime
    const services = await prisma.service.findMany({
      where: { id: { in: cart.map(i => i.serviceId) } }
    });

    const [h, m] = targetTimeStr.split(':').map(Number);
    const startDate = new Date(`${targetDateStr}T00:00:00Z`); 
    startDate.setUTCHours(h, m, 0, 0);

    const paymentStatus = (paymentMethod === "CARD_ONLINE" || paymentMethod === "GIFT_CARD") ? "PAID" : "UNPAID";

    // Calculate split per appointment (simplified: spread gift amount across first item or proportionally)
    // For MVP: Spread gift amount across all appointments in the cart equally
    const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
    const giftPerApp = amountPaidGift / totalItems;
    const bookingGroupId = `grp_${Math.random().toString(36).substr(2, 9)}`;

    const appointmentPromises = cart.flatMap(item => {
      const service = services.find(s => s.id === item.serviceId);
      const duration = service?.durationMinutes || 45;
      const endTime = new Date(startDate.getTime() + 1000 * 60 * duration);
      
      const stripePerApp = (service?.price || 0) - giftPerApp;
      // Normalize: empty string from Stripe metadata must become null to satisfy FK constraint
      const safeGiftCardId = (giftCardId && giftCardId.trim() !== '') ? giftCardId : null;
      const safeStripeId = (stripePaymentIntentId && stripePaymentIntentId.trim() !== '') ? stripePaymentIntentId : null;

      return Array(item.quantity).fill(null).map(async () => {
        const id = `apt_${Math.random().toString(36).substr(2, 9)}`;
        return prisma.$executeRaw`
          INSERT INTO "Appointment" (
            "id", "startTime", "endTime", "status", "customerId", 
            "barberId", "serviceId", "tenantId", "paymentMethod", "paymentStatus", 
            "stripePaymentIntentId", "bookingGroupId", "amountPaidStripe", "amountPaidGift", "giftCardId", "updatedAt"
          ) VALUES (
            ${id}, ${startDate}, ${endTime}, 'CONFIRMED', ${userId}, 
            ${defaultBarber.id}, ${item.serviceId}, ${tenant.id}, ${paymentMethod}, ${paymentStatus}, 
            ${safeStripeId}, ${bookingGroupId}, ${stripePerApp}, ${giftPerApp}, ${safeGiftCardId}, NOW()
          )
        `;
      });
    });

    await Promise.all(appointmentPromises);

    // DEDUCT GIFT CARD BALANCE
    if (giftCardId && amountPaidGift > 0) {
        await prisma.$executeRaw`
            UPDATE "GiftCard" 
            SET "balance" = "balance" - ${amountPaidGift} 
            WHERE "id" = ${giftCardId} AND "balance" >= ${amountPaidGift}
        `;
    }

    // Force Platform-wide revalidation so stats update in ALL portals immediately
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath(`/${tenantSlug}`);

    return { 
      success: true, 
      appointmentId: bookingGroupId, // Use group ID as the primary reference
      bookingGroupId: bookingGroupId,
      tenantId: tenant.id,
      message: "Appointments recorded and balanced!" 
    };
  } catch (error: any) {
    console.error("Booking Error:", error);
    return { success: false, error: error.message };
  }
}

export async function validateGiftCard(code: string, tenantSlug: string) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new Error("Shop not found");

    // RAW SQL: Resilience check for the new GiftCard table
    const cards: any[] = await prisma.$queryRaw`
      SELECT * FROM "GiftCard" 
      WHERE "code" = ${code} 
      AND "isActive" = true 
      AND ("tenantId" = ${tenant.id} OR "tenantId" = 'GLOBAL')
      LIMIT 1
    `;

    const card = cards?.[0];
    if (!card) return { error: "Invalid or inactive gift card code." };
    if (card.balance <= 0) return { error: "This gift card has no remaining balance." };

    return { 
      success: true, 
      cardId: card.id, 
      balance: card.balance 
    };
  } catch (err: any) {
    return { error: "Verification system error. Please try again later." };
  }
}

