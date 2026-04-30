
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'platform_global' }
  });
  console.log('--- TARGET DATA ---');
  console.log('ID:', settings?.id);
  console.log('Fee:', settings?.defaultPlatformFee);
  console.log('Effective From:', settings?.defaultFeeEffectiveFrom);
}

main().catch(console.error).finally(() => prisma.$disconnect());
