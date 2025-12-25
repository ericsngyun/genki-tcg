import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`\n📋 Deleting DOUBLE_LOSS matches...\n`);

  const deleteResult = await prisma.match.deleteMany({
    where: {
      overriddenBy: 'system-drop-loss',
    },
  });

  console.log(`✅ Deleted ${deleteResult.count} DOUBLE_LOSS match(es).\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
