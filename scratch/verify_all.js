const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { emailVerified: null },
    data: { emailVerified: new Date() }
  });
  console.log(`Updated ${result.count} users to be verified.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
