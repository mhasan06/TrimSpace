const { PrismaClient } = require('@prisma/client');

// PrismaClient is instantiated without explicit params. In Prisma v5, it correctly reads .env
const prisma = new PrismaClient();

async function main() {
  // Clear the database completely
  await prisma.appointment.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.scheduleOverride.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('Database wiped! Seeding enterprise structures...');

  // 1. Create a Primary Prototype Shop
  const joshShop = await prisma.tenant.create({
    data: {
      name: "Josh's High-End Barbershop",
      slug: "josh-barbershop",
      address: "123 Center Street, Suite 400, New York",
      phone: "+1 555-0100",
      businessHours: {
        create: [
          { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" }, // Mon
          { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" }, // Tue
          { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" }, // Wed
          { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" }, // Thu
          { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00", lunchStart: "12:00", lunchEnd: "13:00" }, // Fri
          { dayOfWeek: 6, openTime: "10:00", closeTime: "16:00", lunchStart: "13:00", lunchEnd: "13:30" }, // Sat
        ]
      },
      services: {
        create: [
          { name: "Executive Haircut", durationMinutes: 45, price: 45.00 },
          { name: "Hot Towel Shave", durationMinutes: 30, price: 35.00 },
          { name: "Beard Sculpting", durationMinutes: 30, price: 25.00 },
        ]
      }
    }
  });

  // 2. Schedule Override (e.g., Shop Closed Tomorrow for Renovation)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateString = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
  await prisma.scheduleOverride.create({
    data: {
      date: dateString,
      reason: "Store Renovation",
      isClosed: true,
      tenantId: joshShop.id
    }
  });

  // 3. Create MULTIPLE Barbers (To test capacity matrix)
  const owner = await prisma.user.create({
    data: {
      email: "barber@joshbarbershop.com",
      name: "Josh",
      role: "BARBER",
      tenantId: joshShop.id
    }
  });

  const employee = await prisma.user.create({
    data: {
      email: "mike@joshbarbershop.com",
      name: "Mike",
      role: "BARBER", // Two barbers = 2 simultaneous bookings allowed per 30 minutes
      tenantId: joshShop.id
    }
  });

  // 4. Create dummy customer
  const customer = await prisma.user.create({
    data: {
      email: "customer@example.com",
      name: "Alice Smith",
      role: "CUSTOMER",
    }
  });

  console.log('Seeding Success! Created Shop with 2 Barbers, Lunch breaks 12-1pm, and blocked off Tomorrow.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
