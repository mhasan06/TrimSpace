"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getCustomerFavorites() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            shopImage: true,
            category: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { favorites: favorites.map(f => f.tenant) };
  } catch (error) {
    console.error("Fetch favorites error:", error);
    return { error: "Failed to fetch favorites" };
  }
}

export async function toggleFavorite(tenantId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return { action: "removed" };
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          tenantId
        }
      });
      return { action: "added" };
    }
  } catch (error) {
    return { error: "Action failed" };
  }
}
