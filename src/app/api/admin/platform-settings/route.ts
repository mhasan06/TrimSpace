import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { cancellationPolicy, bookingPolicy } = await req.json();

        const updated = await prisma.platformSettings.upsert({
            where: { id: 'platform_global' },
            update: {
                cancellationPolicy,
                bookingPolicy
            },
            create: {
                id: 'platform_global',
                cancellationPolicy,
                bookingPolicy
            }
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("Platform Settings Update Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
