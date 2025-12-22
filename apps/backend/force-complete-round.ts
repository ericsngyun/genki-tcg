import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the most recent in-progress event
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        where: { status: { in: ['ACTIVE', 'PENDING'] } },
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
    console.log('❌ No active or pending rounds found');
    return;
  }

  const round = event.rounds[0];

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`   Force completing Round ${round.roundNumber}...\n`);

  // Find matches that need confirmation
  const needsConfirmation = round.matches.filter(
    (m) => m.result && m.reportedBy && !m.confirmedBy && !m.overriddenBy
  );

  console.log(`   Total Matches: ${round.matches.length}`);
  console.log(`   Need Confirmation: ${needsConfirmation.length}`);

  // Auto-confirm all unconfirmed matches
  if (needsConfirmation.length > 0) {
    console.log(`\n   🔧 Auto-confirming ${needsConfirmation.length} matches...`);

    for (const match of needsConfirmation) {
      await prisma.match.update({
        where: { id: match.id },
        data: { confirmedBy: match.reportedBy }, // Self-confirm
      });
    }

    console.log(`   ✅ All matches auto-confirmed!`);
  }

  // Check for unreported matches
  const unreported = round.matches.filter((m) => !m.result);

  if (unreported.length > 0) {
    console.log(`\n   ⚠️  ${unreported.length} matches have no result. Setting to DRAW...`);

    for (const match of unreported) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          result: 'DRAW',
          gamesWonA: 1,
          gamesWonB: 1,
          reportedAt: new Date(),
          overriddenBy: 'system', // Mark as system override
        },
      });
    }

    console.log(`   ✅ All unreported matches set to DRAW`);
  }

  // Now complete the round
  console.log(`\n   📝 Completing Round ${round.roundNumber}...`);

  const completedRound = await prisma.round.update({
    where: { id: round.id },
    data: {
      status: 'COMPLETED',
      endAt: new Date(),
    },
  });

  console.log(`\n✅ Round ${completedRound.roundNumber} has been force completed!`);
  console.log(`   Status: ${completedRound.status}`);
  console.log(`   Ended at: ${completedRound.endAt}\n`);
  console.log('🎯 You can now create the next round via the admin web.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
