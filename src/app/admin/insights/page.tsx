
import AdminInsightsClient from "@/components/AdminInsightsClient";
import { prisma } from "@/lib/prisma";

export default async function AdminInsightsPage() {
  // Pre-fetch some basic stats for the "suggestions" area
  const shopCount = await prisma.tenant.count();
  const appointmentCount = await prisma.appointment.count();
  
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
         <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', marginBottom: '1rem' }}>
           AI Insight Center
         </h1>
         <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>
           Ask questions about your {shopCount} shops and {appointmentCount} total bookings.
         </p>
      </div>

      <AdminInsightsClient />
    </div>
  );
}
