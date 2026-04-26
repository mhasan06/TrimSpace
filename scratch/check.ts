import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  const shops = await prisma.tenant.findMany({
    where: { name: { contains: 'Mohammad', mode: 'insensitive' } },
    include: { businessHours: true }
  });

  const appointments = await prisma.appointment.findMany({
    where: { 
      tenantId: shops[0].id,
      status: { not: 'CANCELLED' },
      startTime: {
        gte: new Date('2026-04-27T00:00:00Z'),
        lte: new Date('2026-04-27T23:59:59Z')
      }
    }
  });

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  console.log("WEEKLY STAFF CONFIG:");
  shops[0].businessHours.forEach((bh: any) => {
    console.log(`${days[bh.dayOfWeek]}: ${bh.activeStaff} staff`);
  });
  await prisma.$disconnect();
}

check();
