import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the most recent in-progress event
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        include: { matches: true },
        orderBy: { roundNumber: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No in-progress events found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\n🔍 All Rounds:\n`);

  for (const round of event.rounds) {
    console.log(`   Round ${round.roundNumber}`);
    console.log(`   Status: ${round.status}`);
    console.log(`   Created: ${round.createdAt}`);
    if (round.endAt) {
      console.log(`   Ended: ${round.endAt}`);
    }
    console.log(`   Matches: ${round.matches.length}`);
    console.log('');
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
