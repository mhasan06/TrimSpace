import styles from "../page.module.css";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UpcomingLedgerTable from "@/components/UpcomingLedgerTable";

export default async function AppointmentsLedger({ searchParams }: { searchParams: { period?: string, start?: string, end?: string } }) {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as any)?.tenantId;
  const params = await searchParams;

  if (!tenantId) return <div style={{ color: 'white' }}>Unauthorized</div>;

  const { getSydneyDate } = require("@/lib/dateUtils");
  const nowSydney = getSydneyDate();
  
  let startDate = new Date(nowSydney);
  let endDate = new Date(nowSydney);

  if (params.period === 'week' || !params.period) {
    startDate.setDate(nowSydney.getDate() - nowSydney.getDay());
    startDate.setHours(0,0,0,0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23,59,59,999);
  } else if (params.period === 'month') {
    startDate = new Date(nowSydney.getFullYear(), nowSydney.getMonth(), 1);
    endDate = new Date(nowSydney.getFullYear(), nowSydney.getMonth() + 1, 0);
    endDate.setHours(23,59,59,999);
  } else if (params.period === 'year') {
    startDate = new Date(nowSydney.getFullYear(), 0, 1);
    endDate = new Date(nowSydney.getFullYear(), 11, 31);
    endDate.setHours(23,59,59,999);
  } else if (params.start && params.end) {
    startDate = new Date(params.start);
    endDate = new Date(params.end);
    endDate.setHours(23,59,59,999);
  }

  const allAppointments = await prisma.appointment.findMany({
    where: { 
      tenantId,
      startTime: { gte: startDate, lte: endDate }
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
        <UpcomingLedgerTable 
          appointments={allAppointments} 
          currentPeriod={params.period}
          startDate={startDate}
          endDate={endDate}
        />
      </section>
    </>
  );
}
