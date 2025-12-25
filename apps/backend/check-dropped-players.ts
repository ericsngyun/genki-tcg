import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: {
        include: {
          user: true,
        },
      },
      rounds: {
        include: {
          matches: {
            include: {
              playerA: { select: { id: true, name: true } },
              playerB: { select: { id: true, name: true } },
            },
          },
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

  // Find dropped players
  const droppedPlayers = event.entries.filter((e) => e.droppedAt !== null);

  console.log(`Dropped Players: ${droppedPlayers.length}`);
  console.log('================================================================================\n');

  if (droppedPlayers.length === 0) {
    console.log('✅ No players have dropped from this tournament.\n');
    return;
  }

  const totalRounds = event.rounds.length;
  const completedRounds = event.rounds.filter((r) => r.status === 'COMPLETED').length;

  console.log(`Total Rounds Created: ${totalRounds}`);
  console.log(`Completed Rounds: ${completedRounds}\n`);

  for (const entry of droppedPlayers) {
    const playerId = entry.userId;
    const playerName = entry.user.name;

    console.log(`${playerName} (Dropped at: ${entry.droppedAt})`);
    console.log('─'.repeat(80));

    // Count how many matches they played
    let matchesPlayed = 0;
    let lastRoundPlayed = 0;

    event.rounds.forEach((round) => {
      const playerMatches = round.matches.filter(
        (m) => m.playerAId === playerId || m.playerBId === playerId
      );

      if (playerMatches.length > 0) {
        playerMatches.forEach((match) => {
          if (match.result) {
            matchesPlayed++;
            lastRoundPlayed = Math.max(lastRoundPlayed, round.roundNumber);
          }
        });
      }
    });

    console.log(`  Matches Played: ${matchesPlayed}`);
    console.log(`  Last Round Played: ${lastRoundPlayed}`);
    console.log(`  Rounds Missed: ${completedRounds - lastRoundPlayed}`);

    if (completedRounds > lastRoundPlayed) {
      console.log(`  ⚠️  Should have ${completedRounds - lastRoundPlayed} losses added for missed rounds`);
    }

    // Show their match history
    console.log(`\n  Match History:`);
    event.rounds.forEach((round) => {
      const playerMatches = round.matches.filter(
        (m) => m.playerAId === playerId || m.playerBId === playerId
      );

      if (playerMatches.length > 0) {
        playerMatches.forEach((match) => {
          const isPlayerA = match.playerAId === playerId;
          const opponent = isPlayerA ? match.playerB?.name : match.playerA?.name;
          const result = match.result || 'Not played';
          console.log(`    Round ${round.roundNumber}: vs ${opponent || 'BYE'} - ${result}`);
        });
      } else if (round.status === 'COMPLETED') {
        console.log(`    Round ${round.roundNumber}: NO MATCH (should be LOSS)`);
      }
    });

    console.log('\n');
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
