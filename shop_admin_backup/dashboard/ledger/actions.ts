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

export async function resolveDisputeAction(appointmentId: string, resolution: 'PAYOUT' | 'REFUND' | 'NO_ACTION', memo: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const adminName = session.user?.name || "Platform Admin";

    let status = 'RESOLVED_PAYOUT';
    if (resolution === 'REFUND') status = 'RESOLVED_REFUND';
    if (resolution === 'NO_ACTION') status = 'RESOLVED_NO_ACTION';
    
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        isDisputed: true,
        disputeStatus: status,
        disputeResolutionMemo: memo,
        disputeResolvedAt: new Date(),
        disputeResolvedBy: adminName
      }
    });

    revalidatePath('/admin/ledger');
    revalidatePath('/dashboard/ledger');
    revalidatePath('/my-bookings');
    return { success: true };
  } catch (error) {
    console.error("Failed to resolve dispute:", error);
    return { success: false, error: "Server error resolving dispute" };
  }
}

export async function addDisputeNoteAction(appointmentId: string, content: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const authorName = session.user?.name || "User";
    const authorRole = (session.user as any).role === 'ADMIN' ? 'ADMIN' : 'MERCHANT';

    await prisma.disputeNote.create({
      data: {
        appointmentId,
        content,
        authorName,
        authorRole
      }
    });

    revalidatePath('/admin/ledger');
    revalidatePath('/dashboard/ledger');
    return { success: true };
  } catch (error) {
    console.error("Failed to add note:", error);
    return { success: false, error: "Server error adding note" };
  }
}

export async function settleMerchantBatchAction(shopId: string, amount: number, appointmentIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'ADMIN') {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    // 1. Create the Settlement record
    const settlement = await prisma.settlement.create({
      data: {
        tenantId: shopId,
        amount: amount,
        grossAmount: amount, 
        feeAmount: 0,
        status: 'SETTLED',
        weekLabel: `Daily Payrun - ${new Date().toLocaleDateString('en-AU')}`,
        startDate: new Date(),
        endDate: new Date(),
        adminComments: `Daily payout run executed by ${session.user?.name || 'Admin'}`,
      }
    });

    // 2. Link all appointments to this settlement
    await prisma.appointment.updateMany({
      where: {
        id: { in: appointmentIds }
      },
      data: {
        settlementId: settlement.id
      }
    });

    revalidatePath('/admin/ledger');
    revalidatePath('/dashboard/ledger');
    
    return { success: true };
  } catch (error) {
    console.error("Settlement Error:", error);
    return { success: false, error: "Failed to process settlement batch." };
  }
}
