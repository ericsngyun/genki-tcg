import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`\n📋 Deleting all phantom drop matches...\n`);

  // Find all phantom matches
  const phantomMatches = await prisma.match.findMany({
    where: {
      overriddenBy: 'system-drop-phantom',
    },
    include: {
      round: true,
      playerA: true,
    },
  });

  console.log(`Found ${phantomMatches.length} phantom match(es):\n`);

  phantomMatches.forEach((match) => {
    console.log(
      `  Round ${match.round.roundNumber}: ${match.playerA?.name} (Table ${match.tableNumber})`
    );
  });

  if (phantomMatches.length === 0) {
    console.log('✅ No phantom matches found.\n');
    return;
  }

  console.log(`\nDeleting phantom matches...`);

  const deleteResult = await prisma.match.deleteMany({
    where: {
      overriddenBy: 'system-drop-phantom',
    },
  });

  console.log(`\n✅ Deleted ${deleteResult.count} phantom match(es).`);
  console.log(
    `\nDropped players will now show their actual records (fewer total matches).\n`
  );
  console.log(
    `OMW% calculations will still be accurate due to the 33.33% floor.\n`
  );
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
