import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create phantom match losses for dropped players who missed rounds.
 * This ensures proper OMW%/OOMW% calculations for their opponents.
 *
 * Creates "bye loss" matches where the dropped player lost to a bye.
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

  console.log(`Fixing records for ${droppedPlayers.length} dropped player(s)...\n`);

  let phantomMatchesCreated = 0;

  for (const entry of droppedPlayers) {
    const playerId = entry.userId;
    const playerName = entry.user.name;

    // Find last round they actually played in
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

    const missedRounds = completedRounds.filter(
      (r) => r.roundNumber > lastRoundPlayed
    );

    if (missedRounds.length === 0) {
      console.log(`✅ ${playerName}: All completed rounds accounted for`);
      continue;
    }

    console.log(`🔧 ${playerName}: Dropped after Round ${lastRoundPlayed}, missed ${missedRounds.length} round(s)`);

    for (const round of missedRounds) {
      // Check if they already have a match in this round
      const existingMatch = round.matches.find(
        (m) => m.playerAId === playerId || m.playerBId === playerId
      );

      if (existingMatch) {
        console.log(`  ℹ️  Round ${round.roundNumber}: Match already exists`);
        continue;
      }

      // Create a phantom "bye loss" match
      // This represents that the dropped player would have lost this round
      const newMatch = await prisma.match.create({
        data: {
          roundId: round.id,
          tableNumber: 999, // Use high number to indicate phantom match
          playerAId: playerId,
          playerBId: null, // Bye loss
          result: 'PLAYER_A_DQ', // DQ represents dropped/forfeited
          gamesWonA: 0,
          gamesWonB: 0,
          reportedAt: entry.droppedAt,
          overriddenBy: 'system-drop-phantom',
        },
      });

      console.log(`  ✅ Round ${round.roundNumber}: Created phantom DQ loss (match ID: ${newMatch.id})`);
      phantomMatchesCreated++;
    }

    console.log('');
  }

  if (phantomMatchesCreated > 0) {
    console.log(`\n✅ Created ${phantomMatchesCreated} phantom match loss(es).`);
    console.log(`Dropped players now have complete records for OMW%/OOMW% calculations.\n`);
  } else {
    console.log(`\n✅ All dropped players already have complete records.\n`);
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
