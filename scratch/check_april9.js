const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const apps = await prisma.$queryRawUnsafe(`
      SELECT id, status, "paymentStatus", "amountPaidStripe", "amountPaidGift", "cancellationFee", "startTime", "updatedAt"
      FROM "Appointment"
      WHERE "startTime" >= '2026-04-09T00:00:00Z' AND "startTime" < '2026-04-10T00:00:00Z'
      ORDER BY "updatedAt" DESC
    `);
    console.log("Appointments for April 9th:", JSON.stringify(apps, null, 2));
  } catch (err) {
    console.error("Error fetching data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
