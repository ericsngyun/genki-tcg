import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Add forfeit LOSSES for dropped players.
 * Creates matches where they are playerB and lost to a system/placeholder opponent.
 */
async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: {
        include: { user: true },
      },
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

  // Find a placeholder opponent (use first active player or create one)
  const activeEntry = event.entries.find((e) => !e.droppedAt);
  if (!activeEntry) {
    console.log('❌ No active players found');
    return;
  }

  const placeholderOpponentId = activeEntry.userId; // Using first active player as placeholder

  console.log(`\n📋 Event: ${event.name}\n`);
  console.log('Adding forfeit LOSSES for dropped players...\n');

  const droppedPlayers = event.entries.filter((e) => e.droppedAt !== null);
  const completedRounds = event.rounds.filter((r) => r.status === 'COMPLETED');

  let lossesAdded = 0;

  for (const entry of droppedPlayers) {
    const playerId = entry.userId;
    const playerName = entry.user.name;

    // Find last round they actually played
    let lastRoundPlayed = 0;
    for (const round of completedRounds) {
      const matches = await prisma.match.findMany({
        where: {
          roundId: round.id,
          OR: [{ playerAId: playerId }, { playerBId: playerId }],
          result: { not: null },
        },
      });

      if (matches.length > 0) {
        lastRoundPlayed = Math.max(lastRoundPlayed, round.roundNumber);
      }
    }

    const missedRounds = completedRounds.filter((r) => r.roundNumber > lastRoundPlayed);

    if (missedRounds.length === 0) {
      console.log(`✅ ${playerName}: All rounds accounted for`);
      continue;
    }

    console.log(`🔧 ${playerName}: Adding ${missedRounds.length} forfeit loss(es)`);

    for (const round of missedRounds) {
      // Check if match already exists
      const existingMatch = await prisma.match.findFirst({
        where: {
          roundId: round.id,
          OR: [{ playerAId: playerId }, { playerBId: playerId }],
        },
      });

      if (existingMatch) {
        console.log(`  ℹ️  Round ${round.roundNumber}: Match exists`);
        continue;
      }

      // Find next available table number
      const maxTable = await prisma.match.findFirst({
        where: { roundId: round.id },
        orderBy: { tableNumber: 'desc' },
        select: { tableNumber: true },
      });

      const nextTableNumber = (maxTable?.tableNumber || 0) + 1;

      // Create forfeit loss: placeholderOpponent wins, dropped player loses
      const newMatch = await prisma.match.create({
        data: {
          roundId: round.id,
          tableNumber: nextTableNumber,
          playerAId: placeholderOpponentId, // Placeholder wins
          playerBId: playerId, // Dropped player loses
          result: 'PLAYER_A_WIN',
          gamesWonA: 2,
          gamesWonB: 0,
          reportedAt: entry.droppedAt,
          overriddenBy: 'system-forfeit-loss',
        },
      });

      console.log(`  ✅ Round ${round.roundNumber}: Added forfeit loss (match ID: ${newMatch.id})`);
      lossesAdded++;
    }

    console.log('');
  }

  console.log(`\n✅ Added ${lossesAdded} forfeit loss(es).`);
  console.log(`\n⚠️  NOTE: The placeholder opponent will show extra wins in standings.`);
  console.log(`These are forfeit wins and don't affect OMW% calculations for other players.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
