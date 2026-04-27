const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAliApril28() {
  const requestedDateStr = '2026-04-28';
  const tenantSlug = 'josh-barbershop'; // Based on your previous shops
  
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    console.log("Tenant not found");
    return;
  }

  const windowStart = new Date(`${requestedDateStr}T00:00:00Z`);
  windowStart.setHours(windowStart.getHours() - 14);
  const windowEnd = new Date(`${requestedDateStr}T23:59:59Z`);
  windowEnd.setHours(windowEnd.getHours() + 11);

  console.log("Window Start (UTC):", windowStart.toISOString());
  console.log("Window End (UTC):", windowEnd.toISOString());

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId: tenant.id,
      status: { not: 'CANCELLED' },
      startTime: { gte: windowStart, lte: windowEnd }
    },
    include: { barber: true }
  });

  console.log(`Found ${appointments.length} appointments in window.`);
  
  appointments.forEach(a => {
    const s = a.startTime.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
    const e = a.endTime.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
    console.log(`- [${a.barber?.name}] ${s} to ${e} (${a.status})`);
  });
}

checkAliApril28().catch(console.error).finally(() => prisma.$disconnect());
