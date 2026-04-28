"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markAlertAsRead(alertId: string) {
    try {
        await prisma.merchantAlert.update({
            where: { id: alertId },
            data: { isRead: true }
        });
        revalidatePath("/dashboard");
    } catch (err) {
        console.error("Failed to mark alert as read:", err);
    }
}
