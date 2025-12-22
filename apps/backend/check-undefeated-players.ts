import { PrismaClient } from '@prisma/client';

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

  // Calculate records manually
  const playerRecords = new Map<string, { wins: number; losses: number; name: string }>();

  event.entries.forEach((entry) => {
    playerRecords.set(entry.userId, {
      wins: 0,
      losses: 0,
      name: entry.user.name,
    });
  });

  // Process all completed rounds
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
    .filter(([_, record]) => record.losses === 0 && record.wins > 0)
    .map(([id, record]) => ({ id, ...record }))
    .sort((a, b) => b.wins - a.wins);

  console.log(`🏆 Undefeated Players (X-0): ${undefeatedPlayers.length}`);
  console.log('================================================================================');

  if (undefeatedPlayers.length === 0) {
    console.log('  None found\n');
  } else {
    undefeatedPlayers.forEach((p) => {
      console.log(`  ${p.name} - ${p.wins}-${p.losses}`);
    });
    console.log('');
  }

  console.log(`Total Rounds Completed: ${completedRounds.length}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
