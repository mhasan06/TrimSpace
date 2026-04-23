"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    return { success: false, error: "Failed to flag dispute. Please try again." };
  }
}

export async function resolveDisputeAction(appointmentId: string, resolution: 'PAYOUT' | 'REFUND', memo: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const adminName = session.user?.name || "Platform Admin";

    const status = resolution === 'PAYOUT' ? 'RESOLVED_PAYOUT' : 'RESOLVED_REFUND';
    
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        isDisputed: false,
        disputeStatus: status,
        disputeResolutionMemo: memo,
        disputeResolvedAt: new Date(),
        disputeResolvedBy: adminName
      }
    });

    revalidatePath('/admin/ledger');
    revalidatePath('/dashboard/ledger');
    return { success: true };
  } catch (error) {
    console.error("Failed to resolve dispute:", error);
    return { success: false, error: "Server error resolving dispute" };
  }
}
