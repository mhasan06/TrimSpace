import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { amount, recipientEmail } = await req.json();

    if (!amount || amount < 5) {
      return NextResponse.json({ error: "Minimum gift card amount is $5" }, { status: 400 });
    }
    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json({ error: "A valid recipient email is required" }, { status: 400 });
    }

    const purchaserEmail = session?.user?.email || recipientEmail;

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: `TrimSpace Gift Card — $${amount} Credit`,
              description: `Valid at all TrimSpace partner shops. Code will be sent to ${recipientEmail}.`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "GIFT_CARD_PURCHASE",
        amount: String(amount),
        recipientEmail,
        purchaserEmail,
      },
      success_url: `${process.env.NEXTAUTH_URL}/gift/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/gift`,
      customer_email: purchaserEmail,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.error("Gift card checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
