const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const apps = await prisma.$queryRawUnsafe(`
      SELECT id, status, "paymentStatus", "amountPaidStripe", "amountPaidGift", "cancellationFee", "bookingGroupId", "startTime"
      FROM "Appointment"
      WHERE status = 'CANCELLED'
      ORDER BY "updatedAt" DESC
      LIMIT 5
    `);
    console.log("Recent Cancelled Appointments:", JSON.stringify(apps, null, 2));
  } catch (err) {
    console.error("Error fetching data:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
