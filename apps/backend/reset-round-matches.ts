import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the most recent in-progress event
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        where: { status: 'ACTIVE' },
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

  if (event.rounds.length === 0) {
    console.log('❌ No active rounds found');
    return;
  }

  const round = event.rounds[0];

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\n🔄 Resetting Round ${round.roundNumber} to start...`);
  console.log(`   Total Matches: ${round.matches.length}\n`);

  // Reset all matches to unreported state
  for (const match of round.matches) {
    await prisma.match.update({
      where: { id: match.id },
      data: {
        result: null,
        gamesWonA: 0,
        gamesWonB: 0,
        reportedBy: null,
        reportedAt: null,
        confirmedBy: null,
        overriddenBy: null,
      },
    });
  }

  // Ensure round is active and clear end time
  await prisma.round.update({
    where: { id: round.id },
    data: {
      status: 'ACTIVE',
      endAt: null,
    },
  });

  console.log(`✅ Round ${round.roundNumber} has been reset to the start!`);
  console.log(`   All ${round.matches.length} matches cleared`);
  console.log(`   Players can now report their matches\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
