
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AU_TIMEZONE = 'Australia/Sydney';

async function simulate() {
  const tenantId = 'cmnt3lwjj0001lsuhslycyroo'; // Mohammad Shop One
  const requestedDateStr = '2026-04-28';
  const preferredBarberId = 'cmognew0g0000zsgtzung56p8'; // Anas

  console.log('--- STARTING SIMULATION for ANAS on APRIL 28 ---');

  const getSydneyUTC = (dateStr, timeStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, hh, mm));
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: AU_TIMEZONE, hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    const parts = formatter.formatToParts(date);
    const sHour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const sDay = parseInt(parts.find(p => p.type === 'day').value, 10);
    let diffHours = sHour - hh;
    if (sDay !== d) diffHours += (sDay > d || (sDay === 1 && d > 27)) ? 24 : -24;
    return new Date(date.getTime() - (diffHours * 3600000));
  };

  const businessDay = await prisma.businessHours.findFirst({ where: { tenantId, dayOfWeek: 2 } });
  const barbers = await prisma.user.findMany({ where: { tenantId, role: 'BARBER', isActive: true } });
  
  const startMoment = getSydneyUTC(requestedDateStr, businessDay.openTime);
  const endMoment = getSydneyUTC(requestedDateStr, businessDay.closeTime);

  console.log(`Shop Hours: ${businessDay.openTime} - ${businessDay.closeTime}`);
  console.log(`UTC Range: ${startMoment.toISOString()} to ${endMoment.toISOString()}`);

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      status: { not: 'CANCELLED' },
      startTime: { gte: new Date(startMoment.getTime() - 12*60*60*1000), lte: new Date(endMoment.getTime() + 12*60*60*1000) }
    }
  });

  console.log(`Found ${appointments.length} appointments in window.`);
  appointments.forEach(a => {
    const bName = barbers.find(b => b.id === a.barberId)?.name;
    console.log(`- [${bName}] ${a.startTime.toISOString()} to ${a.endTime.toISOString()} (${a.status})`);
  });

  // TEST CASE: 10:30 AM Slot (Duration 45m)
  const targetTime = "10:30";
  const durationMs = 45 * 60 * 1000;
  const currentMs = getSydneyUTC(requestedDateStr, targetTime).getTime();

  console.log(`\n--- CHECKING SLOT: ${targetTime} (UTC: ${new Date(currentMs).toISOString()}) ---`);

  const freeBarbers = barbers.filter(b => {
    if (preferredBarberId && b.id !== preferredBarberId) return false;
    
    const conflict = appointments.find(a => {
      if (a.barberId !== b.id) return false;
      return (currentMs < a.endTime.getTime() && currentMs + durationMs > a.startTime.getTime());
    });

    if (conflict) {
      console.log(`Barber [${b.name}] BUSY because of conflict with App ending at ${conflict.endTime.toISOString()}`);
    } else {
      console.log(`Barber [${b.name}] FREE`);
    }
    return !conflict;
  });

  console.log(`Result: ${freeBarber.length} barbers free.`);
  process.exit(0);
}

simulate();
