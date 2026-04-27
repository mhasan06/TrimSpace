
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function init() {
  const tenants = await prisma.tenant.findMany();
  
  for (const t of tenants) {
    const barbers = await prisma.user.findMany({ where: { tenantId: t.id, role: 'BARBER', isActive: true } });
    console.log(`Setting up roster for Shop: ${t.name} (${barbers.length} barbers)`);
    
    for (const b of barbers) {
      // Create Mon-Fri (1-5) schedules by default
      for (let day = 1; day <= 5; day++) {
        await prisma.staffSchedule.upsert({
          where: { userId_dayOfWeek: { userId: b.id, dayOfWeek: day } },
          update: { isActive: true },
          create: {
            userId: b.id,
            tenantId: t.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true
          }
        });
      }
      console.log(`  - Default roster set for ${b.name} (Mon-Fri)`);
    }
  }
  process.exit(0);
}

init();
