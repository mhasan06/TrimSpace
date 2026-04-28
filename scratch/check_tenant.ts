
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { name: { contains: 'MOHAMMAD', mode: 'insensitive' } },
    include: { users: true }
  });
  console.log(JSON.stringify(tenant, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
