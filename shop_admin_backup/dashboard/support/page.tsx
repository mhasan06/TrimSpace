import { getActiveTenantContext } from "@/lib/support";
import { getMerchantTickets } from "./actions";
import SupportTicketManager from "@/components/SupportTicketManager";
import styles from "../page.module.css";

export default async function MerchantSupportPage() {
  const context = await getActiveTenantContext();
  if (!context?.tenantId) return null;

  const tickets = await getMerchantTickets(context.tenantId);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem' }}>Partner Support Center</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Need assistance? Start a conversation with our platform team.</p>
      </div>

      <SupportTicketManager 
        initialTickets={tickets as any} 
        tenantId={context.tenantId} 
        role="MERCHANT"
      />
    </div>
  );
}
