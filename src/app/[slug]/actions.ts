"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slotEngine";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function fetchPublicSlots(tenantSlug: string, dateStr: string, serviceDurations: number[], isGroup: boolean = false, preferredBarberId?: string) {
   const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
   if (!tenant) return { availableSlots: [], reason: "Tenant not found" };

   // We pass the preferredBarberId to the engine to filter lanes
   const slots = await getAvailableSlots(tenant.id, dateStr, serviceDurations, isGroup, preferredBarberId);
   return slots;
}

export async function fetchBarbers(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return [];

  // Fetch only barbers assigned to this specific shop
  const barbers = await prisma.user.findMany({
    where: { 
      role: 'BARBER',
      tenant: { slug: tenantSlug }
    },
    select: { id: true, name: true }
  });
  return barbers;
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
  isGroup: boolean = false, // New parameter
  stripePaymentIntentId?: string,
  giftCardId?: string,
  amountPaidGift: number = 0
) {
  try {
    if (!userId) throw new Error("Authentication required to finalize booking.");

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new Error("Tenant not found");

    // Fetch ALL active barbers for this shop to support load balancing
    const activeBarbers = await prisma.user.findMany({ 
      where: { tenantId: tenant.id, role: "BARBER" } 
    });
    
    if (activeBarbers.length === 0) throw new Error("The shop does not have any active staff to accept appointments.");

    // Fetch service durations for accurate scheduling
    const services = await prisma.service.findMany({
      where: { id: { in: cart.map(i => i.serviceId) } }
    });

    const [h, m] = targetTimeStr.split(':').map(Number);
    // Construct in Sydney Local context
    const baseStartTime = new Date(`${targetDateStr}T${targetTimeStr}:00`);
    
    // If the server is in a different timezone, we need to be more explicit
    // Best practice: Parse with a fixed timezone offset or use a timezone-aware constructor
    // Since we standardize on Australia/Sydney, we'll use the offset-aware string approach
    // Sydney is typically UTC+10 (AEST) or UTC+11 (AEDT). 
    // We'll use a trick to get the correct UTC date for a Sydney local string:
    const sydneyDate = new Date(new Date(`${targetDateStr}T${targetTimeStr}:00`).toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
    const serverDate = new Date(`${targetDateStr}T${targetTimeStr}:00`);
    const offset = serverDate.getTime() - sydneyDate.getTime();
    baseStartTime.setTime(baseStartTime.getTime() + offset);

    const paymentStatus = (paymentMethod === "CARD_ONLINE" || paymentMethod === "GIFT_CARD") ? "PAID" : "UNPAID";
    const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
    const giftPerApp = amountPaidGift / totalItems;
    const bookingGroupId = `grp_${Math.random().toString(36).substr(2, 9)}`;

    let processedCount = 0;
    let rollingStartTime = new Date(baseStartTime);

    // TRUE SEQUENTIAL ENGINE: We process each item one-by-one to avoid connection pool competition
    for (const item of cart) {
      // Handle both full object (direct call) and compact metadata (from Stripe)
      const serviceId = (item as any).serviceId || (item as any).s;
      const quantity = (item as any).quantity || (item as any).q;
      const personIndex = (item as any).p || 0; // Explicit person index from metadata

      const service = services.find(s => s.id === serviceId);
      const duration = service?.durationMinutes || 45;
      
      const safeGiftCardId = (giftCardId && giftCardId.trim() !== '') ? giftCardId : null;
      const safeStripeId = (stripePaymentIntentId && stripePaymentIntentId.trim() !== '') ? stripePaymentIntentId : null;

      for (let i = 0; i < quantity; i++) {
        const id = `apt_${Math.random().toString(36).substr(2, 9)}`;
        const localIndex = processedCount++;
        
        // Determine Start Time: Concurrent for groups, Sequential for solo
        const currentStartTime = isGroup ? new Date(baseStartTime) : new Date(rollingStartTime);
        const currentEndTime = new Date(currentStartTime.getTime() + 1000 * 60 * duration);

        // Assign Barber: 
        // For groups, we use the EXPLICIT personIndex from the customer journey
        // For solo, we use the first barber
        const barberIndex = isGroup ? (personIndex % activeBarbers.length) : 0;
        const assignedBarber = activeBarbers[barberIndex];

        // Increment rolling time ONLY if solo
        if (!isGroup) {
          rollingStartTime = new Date(currentEndTime);
        }

        const priorityFee = localIndex === 0 ? 0.50 : 0;
        const stripePerApp = (service?.price || 0) - giftPerApp + priorityFee;

        // AWAIT EACH CALL DIRECTLY IN THE LOOP
        await prisma.$executeRaw`
          INSERT INTO "Appointment" (
            "id", "startTime", "endTime", "status", "customerId", 
            "barberId", "serviceId", "tenantId", "paymentMethod", "paymentStatus", 
            "stripePaymentIntentId", "bookingGroupId", "amountPaidStripe", "amountPaidGift", "giftCardId", "updatedAt"
          ) VALUES (
            ${id}, ${currentStartTime}, ${currentEndTime}, 'CONFIRMED', ${userId}, 
            ${assignedBarber.id}, ${serviceId}, ${tenant.id}, ${paymentMethod}, ${paymentStatus}, 
            ${safeStripeId}, ${bookingGroupId}, ${stripePerApp}, ${giftPerApp}, ${safeGiftCardId}, NOW()
          )
        `;
      }
    }
    // ... revalidation and returns follow

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

