import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Add LOSSES for dropped players for rounds they missed.
 * Uses DOUBLE_LOSS result to ensure they get a loss (not a bye win).
 */
async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: true,
      rounds: {
        orderBy: { roundNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No in-progress events found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}\n`);
  console.log('Adding LOSSES for dropped players in missed rounds...\n');

  const droppedPlayers = event.entries.filter((e) => e.droppedAt !== null);

  if (droppedPlayers.length === 0) {
    console.log('✅ No dropped players found.\n');
    return;
  }

  const completedRounds = event.rounds.filter((r) => r.status === 'COMPLETED');

  let lossesAdded = 0;

  for (const entry of droppedPlayers) {
    const playerId = entry.userId;
    const user = await prisma.user.findUnique({ where: { id: playerId } });
    const playerName = user?.name || 'Unknown';

    // Find last round they actually played
    let lastRoundPlayed = 0;
    for (const round of completedRounds) {
      const matches = await prisma.match.findMany({
        where: {
          roundId: round.id,
          OR: [{ playerAId: playerId }, { playerBId: playerId }],
        },
      });

      if (matches.length > 0 && matches.some((m) => m.result !== null)) {
        lastRoundPlayed = Math.max(lastRoundPlayed, round.roundNumber);
      }
    }

    const missedRounds = completedRounds.filter((r) => r.roundNumber > lastRoundPlayed);

    if (missedRounds.length === 0) {
      console.log(`✅ ${playerName}: All completed rounds accounted for`);
      continue;
    }

    console.log(`🔧 ${playerName}: Adding ${missedRounds.length} loss(es) for missed rounds`);

    for (const round of missedRounds) {
      // Check if match already exists
      const existingMatch = await prisma.match.findFirst({
        where: {
          roundId: round.id,
          OR: [{ playerAId: playerId }, { playerBId: playerId }],
        },
      });

      if (existingMatch) {
        console.log(`  ℹ️  Round ${round.roundNumber}: Match already exists`);
        continue;
      }

      // Find next available table number
      const maxTable = await prisma.match.findFirst({
        where: { roundId: round.id },
        orderBy: { tableNumber: 'desc' },
        select: { tableNumber: true },
      });

      const nextTableNumber = (maxTable?.tableNumber || 0) + 1;

      // Create a match with DOUBLE_LOSS to ensure it counts as a loss
      const newMatch = await prisma.match.create({
        data: {
          roundId: round.id,
          tableNumber: nextTableNumber,
          playerAId: playerId,
          playerBId: playerId, // Self-match to avoid bye logic
          result: 'DOUBLE_LOSS', // Both lose, but it's just one player
          gamesWonA: 0,
          gamesWonB: 0,
          reportedAt: entry.droppedAt,
          overriddenBy: 'system-drop-loss',
        },
      });

      console.log(`  ✅ Round ${round.roundNumber}: Added DOUBLE_LOSS (match ID: ${newMatch.id})`);
      lossesAdded++;
    }

    console.log('');
  }

  console.log(`\n✅ Added ${lossesAdded} loss(es) for dropped players.`);
  console.log(`Dropped players now have losses for all missed rounds.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
