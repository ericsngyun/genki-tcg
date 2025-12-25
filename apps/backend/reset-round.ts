import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roundNumber = process.argv[2] ? parseInt(process.argv[2]) : null;

  if (!roundNumber) {
    console.log('❌ Please specify a round number: npx tsx reset-round.ts <roundNumber>');
    return;
  }

  // Get the most recent in-progress event
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        where: { roundNumber },
        include: { matches: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No in-progress events found');
    return;
  }

  if (event.rounds.length === 0) {
    console.log(`❌ Round ${roundNumber} not found`);
    return;
  }

  const round = event.rounds[0];

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\n🔄 Resetting Round ${round.roundNumber}...`);
  console.log(`   Current Status: ${round.status}`);

  // Reset the round to ACTIVE
  const updatedRound = await prisma.round.update({
    where: { id: round.id },
    data: {
      status: 'ACTIVE',
      endAt: null, // Clear the end time
    },
  });

  console.log(`\n✅ Round ${updatedRound.roundNumber} has been reset!`);
  console.log(`   New Status: ${updatedRound.status}`);
  console.log(`   End time cleared: ${updatedRound.endAt === null ? 'Yes' : 'No'}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
