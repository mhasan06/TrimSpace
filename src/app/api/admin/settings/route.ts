import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { key, value, label } = await req.json();
        const setting = await prisma.globalSetting.create({
            data: { key, value, label }
        });
        return NextResponse.json(setting);
    } catch (err) {
        return NextResponse.json({ error: "Conflict" }, { status: 409 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, value } = await req.json();
        const setting = await prisma.globalSetting.update({
            where: { id },
            data: { value }
        });
        return NextResponse.json(setting);
    } catch (err) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await req.json();
        await prisma.globalSetting.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
}
