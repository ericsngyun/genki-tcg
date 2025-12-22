import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 Deleting AI-generated players...\n');

  // Common AI-generated Japanese names from seed data
  const aiNamePatterns = [
    'Akira',
    'Sakura',
    'Yuki',
    'Haruto',
    'Hana',
    'Riku',
    'Aoi',
    'Sora',
    'Mei',
    'Ren',
    'Tanaka',
    'Yamamoto',
    'Suzuki',
    'Watanabe',
    'Takahashi',
    'Sato',
    'Kobayashi',
    'Kato',
    'Ito',
    'Nakamura',
  ];

  const allUsers = await prisma.user.findMany({
    include: {
      entries: true,
    },
  });

  const aiPlayers = allUsers.filter((user) => {
    const name = user.name || '';
    return aiNamePatterns.some((pattern) => name.includes(pattern));
  });

  console.log(`Found ${aiPlayers.length} AI-generated player(s) to delete:\n`);

  let deletedCount = 0;

  for (const player of aiPlayers) {
    console.log(`  Deleting: ${player.name} (ID: ${player.id})`);

    // Check if player has any entries
    if (player.entries.length > 0) {
      console.log(`    ⚠️  Player has ${player.entries.length} event entries, skipping...`);
      continue;
    }

    try {
      // Delete user account and all related data
      await prisma.user.delete({
        where: { id: player.id },
      });
      console.log(`    ✅ Deleted successfully`);
      deletedCount++;
    } catch (error) {
      console.log(`    ❌ Failed to delete: ${error.message}`);
    }
  }

  console.log(`\n✅ Deleted ${deletedCount} AI-generated player(s).\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
