"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function flagDisputeAction(appointmentId: string, reason: string) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        isDisputed: true,
        disputeReason: reason,
        disputeStatus: 'PENDING'
      }
    });

    revalidatePath("/dashboard/ledger");
    revalidatePath("/admin/ledger");
    
    return { success: true };
  } catch (error) {
    console.error("Dispute Error:", error);
    return { error: "Failed to flag dispute. Please try again." };
  }
}

export async function resolveDisputeAction(appointmentId: string, resolution: 'PAYOUT' | 'REFUND', memo: string) {
  try {
    const data: any = {
      isDisputed: false,
      disputeStatus: resolution === 'PAYOUT' ? 'RESOLVED_PAYOUT' : 'RESOLVED_REFUND',
      disputeResolvedAt: new Date(),
      disputeResolutionMemo: memo
    };

    // If it's a refund, we might want to update paymentStatus as well
    if (resolution === 'REFUND') {
      data.paymentStatus = 'REFUNDED';
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data
    });

    revalidatePath("/dashboard/ledger");
    revalidatePath("/admin/ledger");
    
    return { success: true };
  } catch (error) {
    console.error("Resolution Error:", error);
    return { error: "Failed to resolve dispute." };
  }
}
