import { PrismaClient } from '@prisma/client';
import { calculateStandings } from '@genki-tcg/tournament-logic';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: {
        include: { user: true },
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

  // Calculate standings after Round 3
  const playerIds = event.entries.map((e) => e.userId);
  const playerNames = new Map(event.entries.map((e) => [e.userId, e.user.name]));
  const droppedPlayers = new Set(
    event.entries.filter((e) => e.droppedAt).map((e) => e.userId)
  );

  const completedRounds = event.rounds.filter((r) => r.status === 'COMPLETED');
  const allMatches = completedRounds.flatMap((r) =>
    r.matches.map((m) => ({
      playerAId: m.playerAId,
      playerBId: m.playerBId,
      result: m.result,
      gamesWonA: m.gamesWonA ?? 0,
      gamesWonB: m.gamesWonB ?? 0,
    }))
  );

  const standings = calculateStandings({
    playerIds,
    playerNames,
    matches: allMatches,
    droppedPlayers,
  });

  console.log('Standings After Round 3:');
  console.log('================================================================================');
  standings.forEach((s, idx) => {
    const name = s.playerName || s.playerId || 'Unknown';
    console.log(
      `${(idx + 1).toString().padStart(2)}. ${name.padEnd(30)} ${s.matchWins}-${s.matchLosses}-${s.matchDraws}`
    );
  });

  // Find undefeated players (3-0)
  const undefeatedPlayers = standings.filter((s) => s.matchWins === 3 && s.matchLosses === 0);

  console.log(`\n\n🏆 Undefeated Players (3-0): ${undefeatedPlayers.length}`);
  console.log('================================================================================');
  undefeatedPlayers.forEach((s) => {
    const name = s.playerName || s.playerId || 'Unknown';
    console.log(`  ${name} (${s.matchWins}-${s.matchLosses})`);
  });

  // Check Round 4 pairings
  const round4 = event.rounds.find((r) => r.roundNumber === 4);
  if (round4) {
    console.log(`\n\nRound 4 Pairings (Status: ${round4.status}):`);
    console.log('================================================================================');

    const pairings = round4.matches.sort((a, b) => a.tableNumber - b.tableNumber);

    pairings.forEach((match) => {
      const playerAName = match.playerA?.name || 'BYE';
      const playerBName = match.playerB?.name || 'BYE';

      const standingA = standings.find((s) => s.playerId === match.playerAId);
      const standingB = match.playerBId
        ? standings.find((s) => s.playerId === match.playerBId)
        : null;

      const recordA = standingA ? `${standingA.matchWins}-${standingA.matchLosses}` : '?';
      const recordB = standingB ? `${standingB.matchWins}-${standingB.matchLosses}` : 'BYE';

      const isDownpair = standingA && standingB && standingA.matchWins !== standingB.matchWins;

      console.log(
        `Table ${match.tableNumber}: ${playerAName.padEnd(30)} (${recordA}) vs ${playerBName.padEnd(30)} (${recordB}) ${isDownpair ? '⚠️ DOWNPAIR' : ''}`
      );
    });

    // Count downpairs
    const downpairs = pairings.filter((match) => {
      const standingA = standings.find((s) => s.playerId === match.playerAId);
      const standingB = match.playerBId
        ? standings.find((s) => s.playerId === match.playerBId)
        : null;
      return standingA && standingB && standingA.matchWins !== standingB.matchWins;
    });

    console.log(`\n⚠️  Total Downpairs: ${downpairs.length}`);

    if (undefeatedPlayers.length === 4 || undefeatedPlayers.length === 2) {
      console.log(`\n❌ ISSUE: With ${undefeatedPlayers.length} undefeated players, they should all be paired together!`);
      console.log('There should be NO downpairs in the 3-0 bracket.\n');
    }
  } else {
    console.log('\n⚠️  Round 4 has not been created yet.\n');
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
