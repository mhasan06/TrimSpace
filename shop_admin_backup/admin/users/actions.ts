"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Toggle user active status
 */
export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  const session = await getServerSession(authOptions);
  
  // Security check
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized: Platform Admin access required.");
  }

  try {
    const newStatus = !currentStatus;
    
    // Prevent self-disabling
    if (!session?.user || (session.user as any).id === userId) {
      return { error: "You cannot disable your own administrator account." };
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "isActive" = $1, "updatedAt" = NOW() WHERE id = $2`,
      newStatus, userId
    );

    revalidatePath("/admin/users");
    return { success: true, newStatus };
  } catch (err: any) {
    return { error: err.message };
  }
}

/**
 * Delete user account permanently
 */
export async function deleteUserAction(userId: string) {
  const session = await getServerSession(authOptions);
  
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized: Platform Admin access required.");
  }

  // Prevent self-deletion
  if (!session?.user || (session.user as any).id === userId) {
    return { error: "You cannot delete your own administrator account." };
  }

  try {
    await prisma.user.delete({
      where: { id: userId }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    return { error: "Failed to delete user. They may have active associations." };
  }
}
