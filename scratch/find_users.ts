import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(users, null, 2));
}

main();
