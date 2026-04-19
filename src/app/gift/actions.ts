"use server";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TRIM-${seg()}-${seg()}`;
}

export async function fulfillGiftCardPurchase(sessionId: string) {
  try {
    if (!sessionId) throw new Error("Missing session ID");

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") throw new Error("Payment not completed");

    // Idempotency: check if already fulfilled
    const existing = await prisma.giftCard.findFirst({
      where: { stripeSessionId: sessionId } as any,
    });
    if (existing) {
      return {
        success: true,
        code: existing.code,
        amount: existing.initialValue,
        recipientEmail: existing.recipientEmail,
        alreadyFulfilled: true,
      };
    }

    const { amount, recipientEmail } = session.metadata || {};
    const value = parseFloat(amount || "0");
    if (!value || !recipientEmail) throw new Error("Invalid session metadata");

    const code = generateGiftCode();

    const card = await prisma.giftCard.create({
      data: {
        code,
        initialValue: value,
        balance: value,
        recipientEmail,
        isActive: true,
        tenantId: "GLOBAL",
        // stripeSessionId stored via raw update for schema flexibility
      } as any,
    });

    // Store the session ID for idempotency (graceful — non-fatal if column missing)
    try {
      await prisma.$executeRaw`
        UPDATE "GiftCard" SET "stripeSessionId" = ${sessionId} WHERE id = ${card.id}
      `;
    } catch (_) { /* column may not exist yet — ignore */ }

    return {
      success: true,
      code,
      amount: value,
      recipientEmail,
      alreadyFulfilled: false,
    };
  } catch (err: any) {
    console.error("Gift fulfillment error:", err);
    return { success: false, error: err.message };
  }
}
