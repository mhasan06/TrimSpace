const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'GlobalSetting'
    `);
    console.log("Columns of GlobalSetting:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error fetching columns:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
