const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
