import styles from "../page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UpcomingLedgerTable from "@/components/UpcomingLedgerTable";

export default async function AppointmentsLedger() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;

  if (!tenantId) return <div style={{ color: 'white' }}>Unauthorized</div>;

  // Pull every single future appointment unconditionally
  const { getSydneyDate } = require("@/lib/dateUtils");
  const nowSydney = getSydneyDate();

  const allAppointments = await prisma.appointment.findMany({
    where: { 
      tenantId,
      startTime: { gte: new Date(nowSydney.setDate(nowSydney.getDate() - 30)) } // Last 30 days in Sydney time
    },
    include: { customer: true, barber: true, service: true },
    orderBy: { startTime: 'asc' }
  });

  return (
    <>
      <header className={`${styles.header} glass`}>
        <div>
           <div style={{ fontSize: '0.6rem', background: 'var(--primary)', color: 'black', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 900, marginBottom: '0.5rem' }}>BUILD V2.2 - CASCADING ACTIVE</div>
           <h1>Master Ledger</h1>
           <p style={{ color: 'var(--accent)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Unified view of all upcoming sessions and bookings</p>
        </div>
      </header>

      <section className={styles.recentSection} style={{ marginTop: '2rem' }}>
        <UpcomingLedgerTable appointments={allAppointments} />
      </section>
    </>
  );
}
