const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const apps = await prisma.$queryRawUnsafe(`
      SELECT id, status, "paymentStatus", "amountPaidStripe", "startTime", "updatedAt"
      FROM "Appointment"
      ORDER BY "startTime" ASC
      LIMIT 100
    `);
    console.log("All Appointments (First 100):", JSON.stringify(apps, null, 2));
  } catch (err) {
    console.error("Error fetching data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
