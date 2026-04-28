"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(tenantId: string) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return { success: false, error: "Please log in to save favorites." };
        }

        // Check if already favorited
        const existing = await prisma.favorite.findUnique({
            where: {
                userId_tenantId: { userId, tenantId }
            }
        });

        if (existing) {
            // Remove it
            await prisma.favorite.delete({
                where: { id: existing.id }
            });
            revalidatePath("/");
            return { success: true, favorited: false };
        } else {
            // Add it
            await prisma.favorite.create({
                data: { userId, tenantId }
            });
            revalidatePath("/");
            return { success: true, favorited: true };
        }
    } catch (err: any) {
        console.error("[Favorite Error]", err.message);
        return { success: false, error: "Failed to update favorites." };
    }
}

export async function getIsFavorited(tenantId: string) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return false;

    const favorite = await prisma.favorite.findUnique({
        where: {
            userId_tenantId: { userId, tenantId }
        }
    });

    return !!favorite;
}
