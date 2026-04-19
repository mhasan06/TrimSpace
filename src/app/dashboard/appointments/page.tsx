import styles from "../page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AppointmentsLedger() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) return <div style={{ color: 'white' }}>Unauthorized</div>;

  // Pull every single future appointment unconditionally
  const allAppointments = await prisma.appointment.findMany({
    where: { 
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: new Date() } // Only future
    },
    include: { customer: true, barber: true, service: true },
    orderBy: { startTime: 'asc' }
  });

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <h1>Master Ledger</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Infinite chronological list of all future bookings</p>
        </div>
      </header>

      <section className={styles.recentSection} style={{ marginTop: '2rem' }}>
        <div className={`${styles.tableContainer} glass`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Client Name</th>
                <th>Assigned Barber</th>
                <th>Payment Status</th>
                <th>Source</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {allAppointments.length === 0 && (
                 <tr>
                    <td colSpan={6} style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '2rem' }}>
                       Your future ledger is currently empty.
                    </td>
                 </tr>
              )}
              {allAppointments.map((app) => (
                 <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>
                        {new Date(app.startTime).toLocaleDateString()} <br/>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                            {new Date(app.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </td>
                    <td>{app.customer.name}</td>
                    <td>{app.barber.name}</td>
                    <td>
                        <span style={{ 
                            padding: '0.3rem 0.6rem', 
                            borderRadius: '4px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            background: app.paymentStatus === 'PAID' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                            color: app.paymentStatus === 'PAID' ? '#4ade80' : '#fbbf24',
                            border: `1px solid ${app.paymentStatus === 'PAID' ? '#4ade80' : '#fbbf24'}`
                        }}>
                            {app.paymentStatus === 'PAID' ? 'SETTLED' : 'DUE ON ARRIVAL'}
                        </span>
                    </td>
                    <td>
                        <span style={{ fontSize: '0.9rem' }}>{app.paymentMethod === 'CARD_ONLINE' ? '🌐 Online' : '💵 Cash'}</span>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{app.service.name}</div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>${app.service.price.toFixed(2)}</td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
