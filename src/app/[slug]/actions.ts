"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slotEngine";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function fetchPublicSlots(tenantSlug: string, dateStr: string, serviceGroups: number[][], preferredBarberId?: string) {
   console.log(`[Action] fetchPublicSlots called for ${tenantSlug} on ${dateStr}`);
   console.log(`[Action] Groups:`, JSON.stringify(serviceGroups));
   
   const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
   if (!tenant) return { availableSlots: [], reason: "Tenant not found" };

   // We pass the preferredBarberId to the engine to filter lanes
   const slots = await getAvailableSlots(tenant.id, dateStr, serviceGroups, preferredBarberId);
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
        role: "CUSTOMER",
        street: formData.street,
        suburb: formData.suburb,
        state: formData.state
      }
    });

    return { success: true, userId: user.id };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function createBookingTransaction(
  cart: any[], 
  tenantSlug: string, 
  targetDateStr: string, 
  targetTimeStr: string,
  paymentMethod: string,
  userId: string,
  isGroup: boolean = false,
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
    const serviceIds = cart.map((i: any) => i.serviceId || i.s || i.service?.id).filter(Boolean);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    const [h, m] = targetTimeStr.split(':').map(Number);
    // 1. Resolve Sydney -> UTC Precision
    // We create a Date object in Sydney context to find the true UTC moment
    const sydneyFormatter = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });

    // To find the UTC offset for Sydney on THIS specific date:
    const testDate = new Date(`${targetDateStr}T${targetTimeStr}:00Z`); // ISO Z
    const sydneyParts = sydneyFormatter.formatToParts(testDate);
    const sYear = parseInt(sydneyParts.find(p => p.type === 'year')?.value || "0");
    const sMonth = parseInt(sydneyParts.find(p => p.type === 'month')?.value || "0");
    const sDay = parseInt(sydneyParts.find(p => p.type === 'day')?.value || "0");
    const sHour = parseInt(sydneyParts.find(p => p.type === 'hour')?.value || "0");
    const sMin = parseInt(sydneyParts.find(p => p.type === 'minute')?.value || "0");

    const sydneyLocalMoment = new Date(sYear, sMonth - 1, sDay, sHour, sMin);
    const driftMs = sydneyLocalMoment.getTime() - testDate.getTime();
    
    // Now we have the exact UTC date for "Sydney 9am"
    const baseStartTime = new Date(new Date(`${targetDateStr}T${targetTimeStr}:00Z`).getTime() - driftMs);

    const paymentStatus = (paymentMethod === "CARD_ONLINE" || paymentMethod === "GIFT_CARD") ? "PAID" : "UNPAID";
    const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
    const giftPerApp = amountPaidGift / totalItems;
    const bookingGroupId = `grp_${Math.random().toString(36).substr(2, 9)}`;

    let processedCount = 0;
    let rollingStartTime = new Date(baseStartTime);

    // TRUE SEQUENTIAL ENGINE: We process each item one-by-one to avoid connection pool competition
    for (const item of cart) {
      // Handle all possible input shapes: serviceId, s (compact), or service.id (frontend)
      const serviceId = (item as any).serviceId || (item as any).s || (item as any).service?.id;
      const quantity = (item as any).quantity || (item as any).q;
      const personIndex = (item as any).p || 0; 

      if (!serviceId) continue; // Safety skip for malformed items

      const service = services.find(s => s.id === serviceId);
      const duration = service?.durationMinutes || 45;
      
      const safeGiftCardId = (giftCardId && giftCardId.trim() !== '') ? giftCardId : null;
      const safeStripeId = (stripePaymentIntentId && stripePaymentIntentId.trim() !== '') ? stripePaymentIntentId : null;

      for (let i = 0; i < quantity; i++) {
        const id = `apt_${Math.random().toString(36).substr(2, 9)}`;
        const localIndex = processedCount++;
        
        // Determine Start Time: 
        // With parallel staff, we can fit 'staffCount' people at the same time
        // Every 'staffCount' people, we jump forward by the duration
        const laneIndex = localIndex % activeBarbers.length;
        const jumpIndex = Math.floor(localIndex / activeBarbers.length);
        
        // Calculate the actual start time based on parallel lanes
        // P1 & P2 start at 9:00. P3 & P4 start at 9:45 (if staffCount=2)
        const currentStartTime = new Date(baseStartTime.getTime() + (jumpIndex * 1000 * 60 * duration));
        const currentEndTime = new Date(currentStartTime.getTime() + 1000 * 60 * duration);

        // Assign Barber: Explicit lane assignment
        const assignedBarber = activeBarbers[laneIndex];

        const priorityFee = localIndex === 0 ? 0.50 : 0;
        const stripePerApp = (service?.price || 0) - giftPerApp + priorityFee;

        const safeStripeId = stripePaymentIntentId || null;
        const safeGiftCardId = giftCardId || null;
        const finalStripeAmt = Math.max(0, stripePerApp || 0);
        const finalGiftAmt = Math.max(0, giftPerApp || 0);

        // AWAIT EACH CALL DIRECTLY IN THE LOOP
        await prisma.$executeRaw`
          INSERT INTO "Appointment" (
            "id", "startTime", "endTime", "status", "customerId", 
            "barberId", "serviceId", "tenantId", "paymentMethod", "paymentStatus", 
            "stripePaymentIntentId", "bookingGroupId", "amountPaidStripe", "amountPaidGift", 
            "giftCardId", "emailSent", "cancellationFee", "updatedAt", "createdAt"
          ) VALUES (
            ${id}, ${currentStartTime}, ${currentEndTime}, 'CONFIRMED', ${userId}, 
            ${assignedBarber.id}, ${serviceId}, ${tenant.id}, ${paymentMethod}, ${paymentStatus}, 
            ${safeStripeId}, ${bookingGroupId}, ${finalStripeAmt}, ${finalGiftAmt}, 
            ${safeGiftCardId}, false, 0, NOW(), NOW()
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

