import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const tenantWithBarbers = await prisma.tenant.findFirst({
        where: { users: { some: { role: 'BARBER', isActive: true } } },
        include: { users: { where: { role: 'BARBER', isActive: true } } }
    });

    if (!tenantWithBarbers) return;

    const hours = await prisma.businessHours.findMany({ 
        where: { tenantId: tenantWithBarbers.id } 
    });

    console.log("Business Hours configured for:", tenantWithBarbers.name);
    hours.forEach(h => {
        console.log(`Day ${h.dayOfWeek}: ${h.isOpen ? 'OPEN' : 'CLOSED'} (${h.openTime} - ${h.closeTime})`);
    });
}
run().finally(() => prisma.$disconnect());
