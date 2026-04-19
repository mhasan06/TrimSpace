const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Initiating Manual Ledger Synchronization...');
  
  try {
    // 1. Create PlatformSettings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PlatformSettings" (
        "id" TEXT NOT NULL DEFAULT 'platform_global',
        "defaultPlatformFee" DOUBLE PRECISION NOT NULL DEFAULT 0.02,
        "platformName" TEXT NOT NULL DEFAULT 'Antigravity Platform',
        "platformAbl" TEXT NOT NULL DEFAULT '00 000 000 000',
        "platformAddress" TEXT,
        "platformEmail" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe('ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformName" TEXT NOT NULL DEFAULT \'Antigravity Platform\';');
    await prisma.$executeRawUnsafe('ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformAbl" TEXT NOT NULL DEFAULT \'00 000 000 000\';');
    await prisma.$executeRawUnsafe('ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformAddress" TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformPhone" TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "platformEmail" TEXT;');
    console.log('Verified PlatformSettings table columns.');

    // 2. Create Settlement table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Settlement" (
        "id" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "grossAmount" DOUBLE PRECISION NOT NULL,
        "feeAmount" DOUBLE PRECISION NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'OUTSTANDING',
        "weekLabel" TEXT NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "adminComments" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Settlement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 3. Create PlatformFeeSchedule table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PlatformFeeSchedule" (
        "id" TEXT NOT NULL,
        "feePercentage" DOUBLE PRECISION NOT NULL,
        "effectiveFrom" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PlatformFeeSchedule_pkey" PRIMARY KEY ("id")
      );
    `);
    // 4. Update User table
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;');
    await prisma.$executeRawUnsafe('ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "shopImage" TEXT;');
    console.log('Verified Database tables.');

    // 5. Add settlementId to Appointment
    await prisma.$executeRawUnsafe('ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "settlementId" TEXT;');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_settlementId_fkey') THEN
          ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    console.log('Verified Appointment relation.');

    // 4. Seed default settings
    await prisma.$executeRawUnsafe(`
      INSERT INTO "PlatformSettings" ("id", "defaultPlatformFee") 
      VALUES ('platform_global', 0.02) 
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log('Seeded PlatformSettings.');

    console.log('SUCCESS: Platform Ledger DB Sync Complete.');
  } catch (err) {
    console.error('CRITICAL SYNC ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
