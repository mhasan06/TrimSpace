import styles from "../page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PhoneCommunicationsHub() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) return <div style={{ color: 'white' }}>Unauthorized</div>;

  // We fetch upcoming appointments to find client phone numbers for the Daily CRM
  const upcomingAppointments = await prisma.appointment.findMany({
    where: { tenantId },
    include: { customer: true, service: true },
    orderBy: { startTime: 'asc' },
    take: 10
  });

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <h1>Client Communications</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Phone Hub & SMS Automations</p>
        </div>
        <div className={styles.profileStats}>
          <span className={styles.badge}>Monthly Allocation: 20/50 SMS Used</span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginTop: '2rem' }}>
         <section className={styles.recentSection} style={{ marginTop: 0 }}>
            <h2>Today's Call List (Upcoming Appointments)</h2>
            <div className={`${styles.tableContainer} glass`}>
            <table className={styles.table}>
               <thead>
                  <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Contact info</th>
                  <th>Status</th>
                  <th>Action</th>
                  </tr>
               </thead>
               <tbody>
                  {upcomingAppointments.length === 0 && (
                     <tr>
                        <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, fontStyle: 'italic', padding: '2rem' }}>
                           Your booking schedule is currently empty.
                        </td>
                     </tr>
                  )}
                  {upcomingAppointments.map((app) => (
                     <tr key={app.id}>
                        <td>{app.customer.name}</td>
                        <td>{app.service.name}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>[Phone Blocked]</td>
                        <td><span className={styles.statusPending}>Pending</span></td>
                        <td>
                           <button style={{ padding: '0.4rem 1rem', background: 'transparent', border: '1px solid var(--primary)', borderRadius: '4px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                              Send Reminder
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            </div>
         </section>

         <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={`${styles.statCard} glass`} style={{ border: '1px solid var(--accent)' }}>
               <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Automated Reminders</h3>
               <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8, marginBottom: '1rem' }}>
                  Reduce no-shows by automatically sending SMS reminders 24 hours before an appointment.
               </p>
               <button style={{ width: '100%', background: 'var(--accent)', color: 'white', padding: '0.8rem', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Enable Automations
               </button>
            </div>

            <div className={`${styles.statCard} glass`}>
               <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Bulk Marketing</h3>
               <p style={{ fontSize: '0.9rem', color: 'var(--foreground)', opacity: 0.8, marginBottom: '1rem' }}>
                  Send an SMS blast to all previous clients to fill empty slots for the weekend.
               </p>
               <button style={{ width: '100%', background: 'transparent', color: 'var(--primary)', padding: '0.8rem', border: '1px solid var(--primary)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Create Campaign
               </button>
            </div>
         </aside>
      </div>
    </>
  );
}
