const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing database columns for Service table...');
  try {
    // Add columns if they don't exist
    await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "description" TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
    
    console.log('Successfully synchronized columns.');

    // Final Check
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Service';
    `);
    console.log('Current Service table columns:', columns);
  } catch (err) {
    console.error('Sync failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
