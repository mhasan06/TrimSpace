
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'platform_global' }
  });
  console.log('--- PLATFORM SETTINGS ---');
  console.log(JSON.stringify(settings, null, 2));
  
  const schedules = await prisma.platformFeeSchedule.findMany({
    orderBy: { effectiveFrom: 'desc' }
  });
  console.log('--- FEE SCHEDULES ---');
  console.log(JSON.stringify(schedules, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
