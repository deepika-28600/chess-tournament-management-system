import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@chesstournament.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log('Seed admin already exists, skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@12345', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      settings: { create: {} },
    },
  });

  console.log(`Seed admin created: ${admin.email} / Admin@12345 (change this immediately)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
