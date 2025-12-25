import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`\n📋 Deleting forfeit loss matches...\n`);

  const deleteResult = await prisma.match.deleteMany({
    where: {
      overriddenBy: 'system-forfeit-loss',
    },
  });

  console.log(`✅ Deleted ${deleteResult.count} forfeit match(es).\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
