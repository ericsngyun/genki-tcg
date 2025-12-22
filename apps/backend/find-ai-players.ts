import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 Finding AI-generated players...\n');

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

  console.log(`Found ${aiPlayers.length} AI-generated player(s):\n`);

  aiPlayers.forEach((player) => {
    const entryCount = player.entries.length;
    console.log(`  - ${player.name} (ID: ${player.id}, Entries: ${entryCount})`);
  });

  if (aiPlayers.length === 0) {
    console.log('  No AI-generated players found.\n');
  } else {
    console.log(`\n⚠️  Ready to remove ${aiPlayers.length} AI-generated player(s).\n`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
