import { PrismaClient } from '@prisma/client';
import { calculateStandings } from '@genki-tcg/tournament-logic';

const prisma = new PrismaClient();

async function main() {
  // Get the most recent in-progress event
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
              playerA: true,
              playerB: true,
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

  // Calculate standings using the tournament logic
  const playerIds = event.entries.map((e) => e.userId);
  const playerNames = new Map(event.entries.map((e) => [e.userId, e.user.name]));
  const droppedPlayers = new Set(
    event.entries.filter((e) => e.droppedAt).map((e) => e.userId)
  );

  // Get all matches from completed rounds
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

  console.log('Standings After Round 2:');
  console.log('================================================================================');
  standings.forEach((standing, index) => {
    const name = standing.playerName || standing.playerId || 'Unknown';
    const mw = standing.matchWins ?? 0;
    const ml = standing.matchLosses ?? 0;
    const md = standing.matchDraws ?? 0;
    const mwp = (standing.matchWinPercentage ?? 0).toFixed(3);
    const omwp = (standing.opponentMatchWinPercentage ?? 0).toFixed(3);
    const gwp = (standing.gameWinPercentage ?? 0).toFixed(3);

    console.log(
      `${(index + 1).toString().padStart(2)}. ${name.padEnd(30)} ` +
        `${mw}-${ml}-${md} ` +
        `(MW%: ${mwp}, OMW%: ${omwp}, GW%: ${gwp})`
    );
  });

  // Check Round 3 pairings
  const round3 = event.rounds.find((r) => r.roundNumber === 3);
  if (round3) {
    console.log(`\n\nRound 3 Pairings (Status: ${round3.status}):`);
    console.log('================================================================================');

    const pairings = round3.matches.sort((a, b) => a.tableNumber - b.tableNumber);

    pairings.forEach((match) => {
      const playerAName = match.playerA?.name || 'BYE';
      const playerBName = match.playerB?.name || 'BYE';

      const standingA = standings.find(s => s.playerId === match.playerAId);
      const standingB = match.playerBId ? standings.find(s => s.playerId === match.playerBId) : null;

      const recordA = standingA ? `${standingA.matchWins}-${standingA.matchLosses}` : '?';
      const recordB = standingB ? `${standingB.matchWins}-${standingB.matchLosses}` : 'BYE';

      console.log(
        `Table ${match.tableNumber}: ${playerAName} (${recordA}) vs ${playerBName} (${recordB})`
      );
    });

    // Check for Swiss pairing violations
    console.log('\n\nPairing Analysis:');
    console.log('================================================================================');

    // Group by record brackets
    const brackets = new Map<string, string[]>();
    pairings.forEach((match) => {
      const standingA = standings.find(s => s.playerId === match.playerAId);
      const standingB = match.playerBId ? standings.find(s => s.playerId === match.playerBId) : null;

      if (standingA && standingB) {
        const recordA = `${standingA.matchWins}-${standingA.matchLosses}`;
        const recordB = `${standingB.matchWins}-${standingB.matchLosses}`;

        if (recordA !== recordB) {
          console.log(`⚠️  Cross-bracket pairing at Table ${match.tableNumber}: ${recordA} vs ${recordB}`);
        }
      }
    });

    // Check for rematches
    const previousMatchups = new Map<string, Set<string>>();
    completedRounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (match.playerAId && match.playerBId) {
          if (!previousMatchups.has(match.playerAId)) {
            previousMatchups.set(match.playerAId, new Set());
          }
          if (!previousMatchups.has(match.playerBId)) {
            previousMatchups.set(match.playerBId, new Set());
          }
          previousMatchups.get(match.playerAId)!.add(match.playerBId);
          previousMatchups.get(match.playerBId)!.add(match.playerAId);
        }
      });
    });

    pairings.forEach((match) => {
      if (match.playerAId && match.playerBId) {
        const hasPlayed = previousMatchups.get(match.playerAId)?.has(match.playerBId);
        if (hasPlayed) {
          console.log(`⚠️  REMATCH at Table ${match.tableNumber}: ${match.playerA?.name} vs ${match.playerB?.name}`);
        }
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
