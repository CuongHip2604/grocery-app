import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default user
  const passwordHash = await bcrypt.hash('12345678', 12);
  const user = await prisma.user.upsert({
    where: { email: 'owner@store.local' },
    update: { passwordHash },
    create: {
      email: 'owner@store.local',
      passwordHash,
    },
  });
  console.log('Created user:', user.email);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
