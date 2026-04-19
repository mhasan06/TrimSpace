const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: 'Josh', mode: 'insensitive' } },
                { email: { contains: 'Josh', mode: 'insensitive' } }
            ]
        },
        include: {
            tenant: true
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
