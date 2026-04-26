"use server";
import { prisma } from "@/lib/prisma";

export async function verifyEmailAction(token: string) {
  if (!token) return { error: "No verification token provided." };

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return { error: "Invalid or expired verification token." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null // Clear token after use
      }
    });

    return { success: true, message: "Your email has been verified! You can now log in." };
  } catch (error) {
    console.error("[VerifyAction] Error:", error);
    return { error: "An error occurred during verification. Please try again." };
  }
}
