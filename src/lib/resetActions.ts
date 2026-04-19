"use server";
import { prisma } from "./prisma";

// OTPs store
const globalAny: any = global;
if (!globalAny.otpStore) {
  globalAny.otpStore = new Map<string, { otp: string, expires: number }>();
}
const otpStore = globalAny.otpStore;

export async function requestResetOTP(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "No account found with that email address." };
  
  // Use a fallback phone if none exists for testing purposes
  const phone = user.phone || "+1 000-000-0000";

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });

  // Simulate SMS
  console.log(`
=============================================
📱 VIRTUAL SMS NOTIFICATION
To: ${phone}
Message: Your TrimSpace password reset code is: ${otp}. Valid for 10 minutes.
=============================================
`);

  return { success: true, maskedPhone: phone.slice(-4) };
}

export async function verifyOTPAndReset(email: string, otp: string, newPassword: string) {
  const stored = otpStore.get(email);
  if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
    return { error: "Invalid or expired OTP." };
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  otpStore.delete(email);

  // Simulate Email
  console.log(`
=============================================
📧 VIRTUAL EMAIL NOTIFICATION
To: ${email}
Subject: Password Reset Successful

Hello,
Your TrimSpace password has been successfully reset. 
If you did not request this change, please contact support immediately.
=============================================
`);

  return { success: true };
}
