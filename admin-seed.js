const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Platform Super-Admin...");
  const hashedPassword = await bcrypt.hash('admin', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@trimspace.co' },
    update: {},
    create: {
      email: 'admin@trimspace.co',
      name: 'Mohammad (App Owner)',
      password: hashedPassword,
      role: 'ADMIN' // Globally overrides all tenant checks!
    }
  });

  console.log("Admin seeded securely!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
