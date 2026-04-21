const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Existing tables:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error fetching tables:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
