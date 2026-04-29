import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    const user = await prisma.user.findFirst({
      where: { email, verificationToken: code }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid verification code." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: "System error during verification." }, { status: 500 });
  }
}
