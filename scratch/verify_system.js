
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AU_TIMEZONE = 'Australia/Sydney';

async function verify() {
  const tenantId = 'cmnt3lwjj0001lsuhslycyroo'; // Mohammad Shop One
  const dateStr = '2026-04-28';
  const targetTime = '10:30';
  const preferredBarberId = 'cmognew0g0000zsgtzung56p8'; // Anas

  console.log('==============================================');
  console.log('   SYSTEM INTEGRITY CHECK: Mohhamad Shop One  ');
  console.log('==============================================');

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

  const startUTC = getSydneyUTC(dateStr, "09:00");
  console.log(`[TIMEZONE] Shop Open (Sydney 09:00) -> UTC Anchor: ${startUTC.toISOString()}`);
  
  if (startUTC.getUTCHours() === 23) {
    console.log('✅ TIMEZONE CHECK: PASS (9am Sydney is 11pm UTC prev day)');
  } else {
    console.log('❌ TIMEZONE CHECK: FAIL - Please check your system clock');
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: new Date(startUTC.getTime() - 1*60*60*1000), lte: new Date(startUTC.getTime() + 10*60*60*1000) }
    }
  });

  console.log(`\n[DATA] Found ${appointments.length} appointments for April 28th.`);
  
  const currentMs = getSydneyUTC(dateStr, targetTime).getTime();
  const durationMs = 45 * 60 * 1000;
  
  console.log(`\n[OVERLAP] Checking ${targetTime} Slot (Duration: 45m)...`);
  
  const barbers = await prisma.user.findMany({ where: { tenantId, role: 'BARBER' } });
  
  barbers.forEach(b => {
    const conflict = appointments.find(a => {
        if (a.barberId !== b.id) return false;
        return (currentMs < a.endTime.getTime() && currentMs + durationMs > a.startTime.getTime());
    });
    
    if (conflict) {
        console.log(`- Specialist [${b.name}] is BUSY (Collision found with booking ${conflict.id})`);
    } else {
        console.log(`- Specialist [${b.name}] is FREE`);
    }
  });

  const anasIsBusy = !!appointments.find(a => a.barberId === preferredBarberId && currentMs < a.endTime.getTime() && currentMs + durationMs > a.startTime.getTime());
  
  if (anasIsBusy) {
     console.log('\n✅ OVERLAP PROTECTION: PASS (Anas is correctly blocked at 10:30)');
  } else {
     console.log('\n❌ OVERLAP PROTECTION: FAIL - No conflict detected for Anas');
  }

  process.exit(0);
}

verify();
