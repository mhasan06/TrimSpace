import Stripe from "stripe";
import { prisma } from "./prisma";
import { createBookingTransaction } from "@/app/[slug]/actions";
import { sendNotificationEmail } from "./mailer";
import { createMerchantAlert } from "./alerts";

const stripeKey = process.env.STRIPE_SECRET_KEY || '';

const stripe = stripeKey 
  ? new Stripe(stripeKey, {
      apiVersion: "2024-12-18.acacia" as any,
    })
  : null;

/**
 * Idempotent Booking Fulfillment Engine
 * Can be called by Webhook OR Client Success Page
 */
export async function fulfillBooking(sessionId: string) {
  try {
    // @ts-ignore - Stripe is guaranteed by check above
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
    
    if (piId) {
        const existing = await prisma.appointment.findFirst({
            where: { stripePaymentIntentId: piId }
        });
        if (existing) {
            console.log(`[Fulfillment] Session ${sessionId} already processed.`);
            return { success: true, alreadyProcessed: true, appointmentId: existing.id };
        }
    }

    if (session.payment_status !== 'paid') {
       throw new Error("Payment not completed at Stripe.");
    }

    // 2. Extract Metadata
    const { tenantSlug, targetDate, selectedTime, userId, cart: cartRaw, giftDiscount, giftCardId, isGroup: isGroupStr } = session.metadata || {};
    
    // Parse Compact Format: sId:q:p|sId:q:p
    const cart = (cartRaw || "").split('|').filter(Boolean).map(itemStr => {
      const [s, q, p] = itemStr.split(':');
      return {
        s,
        q: parseInt(q || "1"),
        p: parseInt(p || "0")
      };
    });

    const amountPaidGift = parseFloat(giftDiscount || "0");
    const isGroup = isGroupStr === 'true';

    // 3. Create Database Records
    const result = await createBookingTransaction(
      cart, 
      tenantSlug!, 
      targetDate!, 
      selectedTime!, 
      "CARD_ONLINE", 
      userId!, 
      isGroup, // 7th argument
      piId,
      giftCardId,
      amountPaidGift
    );

    if (!result.success) {
      throw new Error(result.error || "Database fulfillment failed.");
    }

    // 4. Notifications & Alerts
    await sendNotificationEmail(result.appointmentId!, 'CONFIRMED');
    await createMerchantAlert(
      result.tenantId!, 
      'BOOKING_CONFIRMED', 
      `New booking confirmed for ${selectedTime} on ${targetDate}`,
      { date: targetDate, appointmentId: result.appointmentId }
    );

    return { 
        success: true, 
        appointmentId: result.appointmentId,
        tenantSlug,
        targetDate,
        selectedTime
    };
  } catch (err: any) {
    console.error("[Fulfillment Error]", err.message);
    return { success: false, error: err.message };
  }
}
