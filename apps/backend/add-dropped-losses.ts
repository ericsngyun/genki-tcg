import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Add match losses for dropped players in rounds they missed.
 * This ensures their opponents' OMW%/OOMW% are calculated correctly.
 */
async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: {
        include: { user: true },
      },
      rounds: {
        include: {
          matches: true,
        },
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

  const droppedPlayers = event.entries.filter((e) => e.droppedAt !== null);

  if (droppedPlayers.length === 0) {
    console.log('✅ No dropped players found.\n');
    return;
  }

  const completedRounds = event.rounds.filter((r) => r.status === 'COMPLETED');

  console.log(`Processing ${droppedPlayers.length} dropped player(s)...\n`);

  let lossesAdded = 0;

  for (const entry of droppedPlayers) {
    const playerId = entry.userId;
    const playerName = entry.user.name;

    // Find last round they played
    let lastRoundPlayed = 0;
    for (const round of event.rounds) {
      const hasMatch = round.matches.some(
        (m) =>
          (m.playerAId === playerId || m.playerBId === playerId) && m.result !== null
      );
      if (hasMatch) {
        lastRoundPlayed = Math.max(lastRoundPlayed, round.roundNumber);
      }
    }

    const roundsToAddLosses = completedRounds.filter(
      (r) => r.roundNumber > lastRoundPlayed
    );

    if (roundsToAddLosses.length === 0) {
      console.log(`${playerName}: No missing rounds (dropped after all completed rounds)`);
      continue;
    }

    console.log(`${playerName}: Adding ${roundsToAddLosses.length} loss(es) for missed rounds`);

    for (const round of roundsToAddLosses) {
      // Check if they already have a match in this round
      const existingMatch = round.matches.find(
        (m) => m.playerAId === playerId || m.playerBId === playerId
      );

      if (existingMatch) {
        if (!existingMatch.result) {
          // Update existing match to show a loss
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              result: 'PLAYER_A_WIN', // Opponent wins by default
              gamesWonA: 2,
              gamesWonB: 0,
              reportedAt: new Date(),
              overriddenBy: 'system-drop',
            },
          });
          console.log(`  ✅ Round ${round.roundNumber}: Recorded loss (existing match updated)`);
          lossesAdded++;
        } else {
          console.log(`  ℹ️  Round ${round.roundNumber}: Already has result`);
        }
      } else {
        // No match exists - create a bye loss record
        // In Swiss, we record this as the player receiving a "match loss"
        // This is typically done by giving them 0 points for that round
        // However, since there's no opponent, we can't create a match
        console.log(`  ⚠️  Round ${round.roundNumber}: No match assignment (already dropped before pairing)`);
        console.log(`      Note: This player's record will show fewer matches than others`);
      }
    }

    console.log('');
  }

  if (lossesAdded > 0) {
    console.log(`\n✅ Added ${lossesAdded} loss(es) for dropped players.`);
    console.log(`OMW%/OOMW% calculations should now be more accurate.\n`);
  } else {
    console.log(`\n✅ All dropped players already have proper records.\n`);
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
