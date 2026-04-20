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
    if (!stripe) throw new Error("Stripe client is not initialized.");
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
    const { tenantSlug, targetDate, selectedTime, userId, cart: cartJson, giftDiscount, giftCardId } = session.metadata || {};
    const cart = JSON.parse(cartJson || "[]");
    const amountPaidGift = parseFloat(giftDiscount || "0");

    // 3. Create Database Records
    const result = await createBookingTransaction(
      cart, 
      tenantSlug!, 
      targetDate!, 
      selectedTime!, 
      "CARD_ONLINE", 
      userId!, 
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
