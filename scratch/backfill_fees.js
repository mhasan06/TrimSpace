const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "Appointment" 
      SET "cancellationFee" = "amountPaidStripe" + "amountPaidGift" 
      WHERE status = 'CANCELLED' AND "cancellationFee" = 0
    `);
    console.log(`Updated ${result} appointments with backfilled cancellation fees.`);
  } catch (err) {
    console.error("Error updating appointments:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
