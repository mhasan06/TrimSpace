"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSupportTicket(subject: string, category: string, content: string, tenantId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      category,
      tenantId,
      messages: {
        create: {
          content,
          senderId: (session.user as any).id,
          senderRole: "MERCHANT",
        }
      }
    }
  });

  revalidatePath("/dashboard/support");
  return ticket;
}

export async function replyToTicket(ticketId: string, content: string, senderRole: "MERCHANT" | "ADMIN") {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const message = await prisma.supportMessage.create({
    data: {
      ticketId,
      content,
      senderId: (session.user as any).id,
      senderRole,
    }
  });

  // Update ticket timestamp
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() }
  });

  revalidatePath("/dashboard/support");
  revalidatePath(`/dashboard/support/ticket/${ticketId}`);
  revalidatePath("/admin/support");
  return message;
}

export async function updateTicketStatus(ticketId: string, status: string) {
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status }
  });
  revalidatePath("/dashboard/support");
  revalidatePath("/admin/support");
}

export async function getMerchantTickets(tenantId: string) {
  return await prisma.supportTicket.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

export async function getAllTickets() {
  return await prisma.supportTicket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      tenant: { select: { name: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
}
