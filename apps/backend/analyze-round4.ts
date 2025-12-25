import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: { include: { user: true } },
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

  // Calculate records manually
  const playerRecords = new Map<string, { wins: number; losses: number; name: string }>();

  event.entries.forEach((entry) => {
    playerRecords.set(entry.userId, {
      wins: 0,
      losses: 0,
      name: entry.user.name,
    });
  });

  // Process completed rounds (1, 2, 3)
  const completedRounds = event.rounds.filter((r) => r.status === 'COMPLETED');

  completedRounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (!match.result || !match.playerAId) return;

      const recordA = playerRecords.get(match.playerAId);
      const recordB = match.playerBId ? playerRecords.get(match.playerBId) : null;

      if (match.result === 'PLAYER_A_WIN') {
        if (recordA) recordA.wins++;
        if (recordB) recordB.losses++;
      } else if (match.result === 'PLAYER_B_WIN') {
        if (recordA) recordA.losses++;
        if (recordB) recordB.wins++;
      }
    });
  });

  // Find undefeated players
  const undefeatedPlayers = Array.from(playerRecords.entries())
    .filter(([_, record]) => record.wins === 3 && record.losses === 0)
    .map(([id, record]) => ({ id, ...record }));

  console.log(`\n📋 Event: ${event.name}\n`);
  console.log(`🏆 Undefeated Players (3-0): ${undefeatedPlayers.length}`);
  console.log('================================================================================');
  undefeatedPlayers.forEach((p) => {
    console.log(`  ${p.name} - ${p.wins}-${p.losses}`);
  });

  // Check Round 4 pairings
  const round4 = event.rounds.find((r) => r.roundNumber === 4);
  if (!round4) {
    console.log('\n⚠️  Round 4 has not been created yet.\n');
    return;
  }

  console.log(`\n\nRound 4 Pairings (Status: ${round4.status}):`);
  console.log('================================================================================');

  const pairings = round4.matches.sort((a, b) => a.tableNumber - b.tableNumber);
  const downpairs: any[] = [];

  pairings.forEach((match) => {
    const playerAName = match.playerA?.name || 'BYE';
    const playerBName = match.playerB?.name || 'BYE';

    const recordA = match.playerAId ? playerRecords.get(match.playerAId) : null;
    const recordB = match.playerBId ? playerRecords.get(match.playerBId) : null;

    const displayA = recordA ? `${recordA.wins}-${recordA.losses}` : '?';
    const displayB = recordB ? `${recordB.wins}-${recordB.losses}` : 'BYE';

    const isDownpair = recordA && recordB && recordA.wins !== recordB.wins;

    if (isDownpair) {
      downpairs.push({
        table: match.tableNumber,
        playerA: playerAName,
        playerB: playerBName,
        recordA: displayA,
        recordB: displayB,
      });
    }

    console.log(
      `Table ${match.tableNumber.toString().padStart(2)}: ${playerAName.padEnd(30)} (${displayA}) vs ${playerBName.padEnd(30)} (${displayB}) ${isDownpair ? '⚠️ DOWNPAIR' : ''}`
    );
  });

  console.log(`\n\n📊 Analysis:`);
  console.log('================================================================================');
  console.log(`Total Downpairs: ${downpairs.length}`);

  if (downpairs.length > 0) {
    console.log('\n⚠️  Downpairs Found:');
    downpairs.forEach((dp) => {
      console.log(`  Table ${dp.table}: ${dp.playerA} (${dp.recordA}) vs ${dp.playerB} (${dp.recordB})`);
    });
  }

  if (undefeatedPlayers.length === 4) {
    const undefeatedIds = new Set(undefeatedPlayers.map((p) => p.id));
    const undefeatedPairings = pairings.filter(
      (m) =>
        m.playerAId &&
        m.playerBId &&
        undefeatedIds.has(m.playerAId) &&
        undefeatedIds.has(m.playerBId)
    );

    console.log(`\n\n3-0 Bracket Pairings: ${undefeatedPairings.length} / 2 expected`);
    if (undefeatedPairings.length !== 2) {
      console.log('❌ ERROR: All 4 undefeated players should be paired together in 2 matches!');
    }
  }

  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
