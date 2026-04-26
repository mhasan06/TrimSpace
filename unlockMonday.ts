import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    const tenant = await prisma.tenant.findFirst({
        where: { users: { some: { role: 'BARBER', isActive: true } } }
    });
    
    await prisma.businessHours.updateMany({
        where: { tenantId: tenant!.id, dayOfWeek: 1 },
        data: { isClosed: false, openTime: '09:00', closeTime: '17:00' }
    });
    console.log("✅ Monday unlocked!");
}
run().finally(() => prisma.$disconnect());
