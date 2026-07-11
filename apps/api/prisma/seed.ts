import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const PASSWORD_SALT_ROUNDS = 12;

async function main(): Promise<void> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('Skipping seed: SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD are required.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      schoolId: null,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      role: Role.SUPER_ADMIN,
      schoolId: null,
      isActive: true,
    },
  });

  console.log(`Seeded SUPER_ADMIN user: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
