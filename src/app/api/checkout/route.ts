import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey 
  ? new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" as any })
  : null;

export async function POST(req: Request) {
  try {
    if (!stripe) throw new Error("Stripe is not initialized. Check your STRIPE_SECRET_KEY.");
    
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { cart, tenantSlug, targetDate, selectedTime, giftCode, isGroup } = body;
    
    // Server-side identity resolution
    const sessionUserId = (session?.user as any)?.id;
    const userId = sessionUserId || body.userId; // Use session ID as primary, fallback to body only if session missing

    if (!cart || !tenantSlug || !targetDate || !selectedTime || !userId) {
      return NextResponse.json({ error: "Missing required booking data." }, { status: 400 });
    }

    let giftDiscount = 0;
    let giftCardId = "";
    if (giftCode) {
      const tenant: any[] = await prisma.$queryRaw`SELECT id FROM "Tenant" WHERE slug = ${tenantSlug} LIMIT 1`;
      const tenantId = tenant?.[0]?.id;

      const cards: any[] = await prisma.$queryRaw`
        SELECT * FROM "GiftCard" 
        WHERE "code" = ${giftCode} 
        AND "isActive" = true 
        AND ("tenantId" = ${tenantId} OR "tenantId" = 'GLOBAL')
        LIMIT 1
      `;
      if (cards?.[0]) {
        const cartTotal = cart.reduce((acc: number, i: any) => acc + (i.service.price * i.quantity), 0);
        giftDiscount = Math.min(cartTotal, cards[0].balance);
        giftCardId = cards[0].id;
      }
    }

    const cartTotal = cart.reduce((acc: number, i: any) => acc + (i.service.price * i.quantity), 0);
    const amountAfterGift = Math.max(0, cartTotal - giftDiscount);
    
    // OPTION A: Add $0.50 Priority Booking Fee
    const priorityFee = 0.50;
    const finalAmount = amountAfterGift + priorityFee;

    if (finalAmount <= 0) {
      return NextResponse.json({ bypassStripe: true, giftDiscount, giftCardId });
    }

    // Map cart to Stripe line items
    let line_items;
    
    if (giftDiscount > 0 || priorityFee > 0) {
      line_items = [{
        price_data: {
          currency: "aud",
          product_data: {
            name: "Booking Total (Inc. Priority Fee)",
            description: `Base: $${amountAfterGift.toFixed(2)} + Priority Fee: $${priorityFee.toFixed(2)}`,
          },
          unit_amount: Math.round(finalAmount * 100),
        },
        quantity: 1,
      }];
    } else {
      line_items = cart.map((item: any) => ({
        price_data: {
          currency: "aud",
          product_data: {
            name: item.service.name,
            description: `Booking at ${tenantSlug} for ${targetDate} at ${selectedTime}`,
          },
          unit_amount: Math.round(item.service.price * 100), // Stripe expects cents
        },
        quantity: item.quantity,
      }));
    }

    // Dynamic Origin Detection: Ensures Stripe always redirects back to the current site (Prod or Local)
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${tenantSlug}`,
      metadata: {
        tenantSlug,
        targetDate,
        selectedTime,
        userId,
        giftCode: giftCode || "",
        giftDiscount: giftDiscount.toString(),
        giftCardId: giftCardId,
        isGroup: (isGroup || false).toString(),
        // Compact Format: sId:q:p|sId:q:p to fit Stripe limits
        cart: Object.keys(body.multiCart || { 0: cart }).flatMap(pIdx => {
          const items = body.multiCart ? body.multiCart[Number(pIdx)] : cart;
          return items.map((i: any) => `${i.service.id}:${i.quantity}:${pIdx}`);
        }).join('|').substring(0, 500), 
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
