const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    take: 5
  });
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
