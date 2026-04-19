import { NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfillBooking } from "@/lib/fulfillment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    if (!sig || !endpointSecret) {
        // Fallback for development if secret not set
        event = JSON.parse(body);
    } else {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    }
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log(`[Webhook] Processing session ${session.id}`);
    
    // Trigger Fulfillment logic
    await fulfillBooking(session.id);
  }

  return NextResponse.json({ received: true });
}

