import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { key, value, label } = await req.json();
        const id = `gs_${Math.random().toString(36).substring(2, 9)}`;
        await prisma.$executeRawUnsafe(
            `INSERT INTO "GlobalSetting" (id, "key", "value", "label", "updatedAt") 
             VALUES ($1, $2, $3, $4, NOW())`,
            id, key, value, label
        );
        return NextResponse.json({ id, key, value, label });
    } catch (err) {
        return NextResponse.json({ error: "Conflict" }, { status: 409 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, value } = await req.json();
        await prisma.$executeRawUnsafe(
            `UPDATE "GlobalSetting" SET "value" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
            value, id
        );
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await req.json();
        await prisma.$executeRawUnsafe(
            `DELETE FROM "GlobalSetting" WHERE "id" = $1`,
            id
        );
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
}
