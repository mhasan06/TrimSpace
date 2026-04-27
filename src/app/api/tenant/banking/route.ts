import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { tenantId, bankName, bsb, accountNumber } = await req.json();
        
        // Security check: user must belong to this tenant
        if ((session.user as any).tenantId !== tenantId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.$transaction([
            prisma.tenant.update({
                where: { id: tenantId },
                data: { bankName, bsb, accountNumber }
            }),
            prisma.bankHistory.create({
                data: {
                    tenantId,
                    bankName,
                    bsb,
                    accountNumber,
                    changedBy: (session.user as any).id
                }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
