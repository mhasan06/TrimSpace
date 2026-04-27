"use server";

import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/slotEngine";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { sendVerificationEmail } from "@/lib/mailer";

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

    const token = crypto.randomBytes(32).toString("hex");
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
        state: formData.state,
        verificationToken: token,
        emailVerified: null
      }
    });

    await sendVerificationEmail(email, name, token);
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
    // 1. Resolve Sydney -> UTC Precision (Using the robust offset calculation)
    const getSydneyUTC = (dateStr: string, timeStr: string) => {
      const [y, mm, d] = dateStr.split('-').map(Number);
      const [hh, min] = timeStr.split(':').map(Number);
      const date = new Date(Date.UTC(y, mm - 1, d, hh, min));
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Sydney', hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
      const parts = formatter.formatToParts(date);
      const sHour = parseInt(parts.find(p => p.type === 'hour')?.value || "0", 10);
      const sDay = parseInt(parts.find(p => p.type === 'day')?.value || "0", 10);
      let diffHours = sHour - hh;
      if (sDay !== d) diffHours += (sDay > d || (sDay === 1 && d > 27)) ? 24 : -24;
      return new Date(date.getTime() - (diffHours * 3600000));
    };

    const baseStartTime = getSydneyUTC(targetDateStr, targetTimeStr);

    // 2. Fetch ALL existing appointments for this window to perform SMART ASSIGNMENT
    const windowStart = new Date(baseStartTime.getTime() - 4*60*60*1000);
    const windowEnd = new Date(baseStartTime.getTime() + 8*60*60*1000);
    const existingApps = await prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        status: { not: 'CANCELLED' },
        startTime: { gte: windowStart, lte: windowEnd }
      }
    });

    const paymentStatus = (paymentMethod === "CARD_ONLINE" || paymentMethod === "GIFT_CARD") ? "PAID" : "UNPAID";
    const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);
    const giftPerApp = amountPaidGift / totalItems;
    const bookingGroupId = `grp_${Math.random().toString(36).substr(2, 9)}`;

    let processedCount = 0;
    const usedBarberIds = new Set<string>();

    // TRUE SEQUENTIAL ENGINE: Assigns barbers dynamically based on ACTUAL availability
    for (const item of cart) {
      const serviceId = (item as any).serviceId || (item as any).s || (item as any).service?.id;
      const quantity = (item as any).quantity || (item as any).q;
      const service = services.find(s => s.id === serviceId);
      const duration = service?.durationMinutes || 45;

      for (let i = 0; i < quantity; i++) {
        const id = `apt_${Math.random().toString(36).substr(2, 9)}`;
        const currentStartTime = new Date(baseStartTime.getTime()); // All in group start at same time currently
        const currentEndTime = new Date(currentStartTime.getTime() + 1000 * 60 * duration);

        // SMART ASSIGNMENT: Find a barber who is FREE for THIS specific window
        const freeBarber = activeBarbers.find(b => {
          // If we've already assigned this barber to another person in THIS group, they are not free
          if (usedBarberIds.has(b.id)) return false;

          // Check against existing appointments in the DB
          const hasConflict = existingApps.some(a => {
            if (a.barberId !== b.id) return false;
            return (currentStartTime.getTime() < a.endTime.getTime() && currentEndTime.getTime() > a.startTime.getTime());
          });

          return !hasConflict;
        });

        if (!freeBarber) {
          throw new Error("Conflict detected: No specialist is available for one or more services at this time. Please try another slot.");
        }

        // Lock this barber for the rest of this group booking
        usedBarberIds.add(freeBarber.id);

        const priorityFee = processedCount === 0 ? 0.50 : 0;
        const stripePerApp = (service?.price || 0) - giftPerApp + priorityFee;
        const finalStripeAmt = Math.max(0, stripePerApp || 0);
        const finalGiftAmt = Math.max(0, giftPerApp || 0);

        await prisma.$executeRaw`
          INSERT INTO "Appointment" (
            "id", "startTime", "endTime", "status", "customerId", 
            "barberId", "serviceId", "tenantId", "paymentMethod", "paymentStatus", 
            "stripePaymentIntentId", "bookingGroupId", "amountPaidStripe", "amountPaidGift", 
            "giftCardId", "emailSent", "cancellationFee", "updatedAt", "createdAt"
          ) VALUES (
            ${id}, ${currentStartTime}, ${currentEndTime}, 'CONFIRMED', ${userId}, 
            ${freeBarber.id}, ${serviceId}, ${tenant.id}, ${paymentMethod}, ${paymentStatus}, 
            ${stripePaymentIntentId || null}, ${bookingGroupId}, ${finalStripeAmt}, ${finalGiftAmt}, 
            ${giftCardId || null}, false, 0, NOW(), NOW()
          )
        `;
        processedCount++;
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

