import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "CUSTOMER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { appointmentId, reason, description } = await req.json();

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });

        if (!appointment || appointment.customerId !== (session.user as any).id) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Update appointment with dispute status
        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                isDisputed: true,
                disputeReason: reason,
                disputeStatus: "PENDING",
                // Create an initial internal note
                disputeNotes: {
                    create: {
                        authorId: (session.user as any).id,
                        content: `Customer raised dispute. Reason: ${reason}. Description: ${description}`,
                        isInternal: false
                    }
                }
            }
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("Dispute Submission Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
