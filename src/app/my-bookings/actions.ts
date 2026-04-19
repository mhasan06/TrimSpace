"use server";

import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendNotificationEmail } from "@/lib/mailer";
import { createMerchantAlert } from "@/lib/alerts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any,
});

export async function handleRefundAndCancel(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    const isGroup = id.startsWith("grp_");
    
    // 1. Fetch appointments (either one or the whole group)
    const appointments: any[] = isGroup 
      ? await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Appointment" WHERE "bookingGroupId" = $1`, id)
      : await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Appointment" WHERE "id" = $1`, id);

    if (appointments.length === 0) throw new Error("Booking not found.");
    if (appointments.some(a => a.customerId !== userId)) throw new Error("Unauthorized.");
    if (appointments.every(a => a.status === "CANCELLED")) throw new Error("Booking is already cancelled.");

    let totalStripeRefund = 0;
    let totalGiftRefund = 0;

    // Process each appointment in the group (or the single one)
    for (const app of appointments) {
      if (app.status === "CANCELLED") continue;

      if (app.paymentStatus === "PAID") {
        const stripeRefundAmount = Number(app.amountPaidStripe) * 0.5;
        const giftRefundAmount   = Number(app.amountPaidGift)   * 0.5;

        // Stripe Refund
        if (stripeRefundAmount > 0 && app.stripePaymentIntentId) {
          try {
            await stripe.refunds.create({
              payment_intent: app.stripePaymentIntentId,
              amount: Math.round(stripeRefundAmount * 100),
              reason: "requested_by_customer",
            });
            totalStripeRefund += stripeRefundAmount;
          } catch (err: any) {
            console.error(`Stripe refund failed for app ${app.id}:`, err.message);
          }
        }

        // Gift Refund
        if (giftRefundAmount > 0 && app.giftCardId) {
          try {
            await prisma.$executeRawUnsafe(`UPDATE "GiftCard" SET "balance" = "balance" + $1 WHERE id = $2`, giftRefundAmount, app.giftCardId);
            totalGiftRefund += giftRefundAmount;
          } catch (err: any) {
            console.error(`Gift restoration failed for app ${app.id}:`, err.message);
          }
        }

        // Update Appointment Status
        await prisma.$executeRawUnsafe(
          `UPDATE "Appointment" SET status = 'CANCELLED', "paymentStatus" = 'PARTIAL_REFUNDED', 
           "amountPaidStripe" = "amountPaidStripe" - $1, "amountPaidGift" = "amountPaidGift" - $2, "updatedAt" = NOW()
           WHERE id = $3`,
          stripeRefundAmount, giftRefundAmount, app.id
        );
      } else {
        // Not paid, just cancel
        await prisma.$executeRawUnsafe(`UPDATE "Appointment" SET status = 'CANCELLED', "updatedAt" = NOW() WHERE id = $1`, app.id);
      }

      // Notify and Alert
      try {
        await sendNotificationEmail(app.id, "CANCELLED");
        await createMerchantAlert(
          app.tenantId,
          "BOOKING_CANCELLED",
          `Booking ${isGroup ? '(Group)' : ''} cancelled — Refunded 50%`,
          { date: new Date(app.startTime).toISOString().split('T')[0], appointmentId: app.id }
        );
      } catch (e) {}
    }

    revalidatePath("/my-bookings");
    revalidatePath("/dashboard");
    revalidatePath("/admin/finance");

    return {
      success: true,
      refunded: totalStripeRefund > 0 || totalGiftRefund > 0,
      stripeRefundAmount: totalStripeRefund,
      giftRefundAmount: totalGiftRefund,
      count: appointments.length
    };
  } catch (error: any) {
    console.error("Cancellation/Refund Error:", error);
    return { error: error.message };
  }
}

export async function updateCustomerProfile(data: { name?: string, phone?: string, password?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    
    const userId = (session.user as any).id;
    
    let updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    
    if (data.password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    
    if (Object.keys(updateData).length === 0) return { success: true };
    
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });
    
    revalidatePath("/my-bookings");
    return { success: true };
  } catch(error: any) {
    return { error: error.message };
  }
}

export async function submitReview(appointmentId: string, rating: number, comment: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");
    const userId = (session.user as any).id;

    // Fetch appointment to verify ownership and completeness
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) throw new Error("Appointment not found.");
    if (appointment.customerId !== userId) throw new Error("Unauthorized.");
    if (appointment.status === "CANCELLED") throw new Error("Cannot review a cancelled appointment.");
    if (new Date(appointment.startTime) > new Date()) throw new Error("Appointment has not occurred yet.");
    
    try {
      const existing: any[] = await prisma.$queryRaw`SELECT id FROM "Review" WHERE "appointmentId" = ${appointmentId}`;
      if (existing.length > 0) throw new Error("You have already reviewed this appointment.");
    } catch(e: any) {
      if (e.message === "You have already reviewed this appointment.") throw e;
      // otherwise table might not exist yet, allow creation attempt which will natively fail or succeed
    }

    await prisma.review.create({
      data: {
        appointmentId,
        customerId: userId,
        tenantId: appointment.tenantId,
        barberId: appointment.barberId,
        rating,
        comment
      }
    });

    revalidatePath("/my-bookings");
    revalidatePath(`/${appointment.tenantId}`); // Best effort to revalidate shop page if routing is simple
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
