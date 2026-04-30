
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- STARTING NUCLEAR SUPABASE FIX ---");

  // 1. CLEAR ALL SCHEDULES (This stops the 0% override)
  const deletedSchedules = await prisma.platformFeeSchedule.deleteMany({});
  console.log(`SUCCESS: Deleted ${deletedSchedules.count} overriding fee schedules.`);

  // 2. Force Global Settings to 1.7%
  const settings = await prisma.platformSettings.upsert({
    where: { id: 'platform_global' },
    update: { defaultPlatformFee: 0.017 },
    create: {
      id: 'platform_global',
      defaultPlatformFee: 0.017,
      penaltyLongThreshold: 48,
      penaltyShortThreshold: 24,
      penaltyLongRate: 0,
      penaltyMidRate: 0.2,
      penaltyShortRate: 1.0
    }
  });
  console.log("SUCCESS: Platform Settings locked to 1.7%.");

  // 3. Clear old test data
  const testShop = await prisma.tenant.findFirst({ where: { name: 'Validation Test Shop' } });
  if (testShop) {
    await prisma.settlement.deleteMany({ where: { tenantId: testShop.id } });
    await prisma.appointment.deleteMany({ where: { tenantId: testShop.id } });
    console.log("SUCCESS: Validation Shop data cleared.");
  }

  console.log("--- NUCLEAR SYNC COMPLETE ---");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
