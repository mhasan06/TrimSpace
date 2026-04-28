import { prisma } from "@/lib/prisma";
import { getAllTickets } from "../../dashboard/support/actions";
import SupportTicketManager from "@/components/SupportTicketManager";

export default async function AdminSupportPage() {
  const tickets = await getAllTickets();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Global Support Hub</h1>
        <p style={{ color: '#ef4444', fontSize: '0.95rem', fontWeight: 700 }}>Managing requests from {tickets.length} partner shops.</p>
      </div>

      <SupportTicketManager 
        initialTickets={tickets as any} 
        tenantId="PLATFORM" // Not used for admin
        role="ADMIN"
      />
    </div>
  );
}
