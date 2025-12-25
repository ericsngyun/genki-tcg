import { PrismaClient } from '@prisma/client';

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

  // Calculate records for each player
  const playerRecords = new Map<string, { wins: number; losses: number; draws: number; name: string }>();

  // Initialize all players
  event.entries.forEach((entry) => {
    playerRecords.set(entry.userId, {
      wins: 0,
      losses: 0,
      draws: 0,
      name: entry.user.name,
    });
  });

  // Process rounds 1 and 2 only
  const completedRounds = event.rounds.filter(r => r.status === 'COMPLETED');

  console.log(`Processing ${completedRounds.length} completed rounds...\n`);

  completedRounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (!match.result) return;

      const playerAId = match.playerAId;
      const playerBId = match.playerBId;

      if (!playerAId) return;

      const recordA = playerRecords.get(playerAId);
      const recordB = playerBId ? playerRecords.get(playerBId) : null;

      if (match.result === 'PLAYER_A_WIN') {
        if (recordA) recordA.wins++;
        if (recordB) recordB.losses++;
      } else if (match.result === 'PLAYER_B_WIN') {
        if (recordA) recordA.losses++;
        if (recordB) recordB.wins++;
      } else if (match.result === 'DRAW') {
        if (recordA) recordA.draws++;
        if (recordB) recordB.draws++;
      }
    });
  });

  // Display records
  console.log('Player Records (Completed Rounds):');
  console.log('================================================================================\n');

  const sortedPlayers = Array.from(playerRecords.entries()).sort((a, b) => {
    return a[1].name.localeCompare(b[1].name);
  });

  sortedPlayers.forEach(([playerId, record]) => {
    const total = record.wins + record.losses + record.draws;
    const status = total === 2 ? '✅' : '⚠️';
    console.log(`${status} ${record.name.padEnd(30)} ${record.wins}-${record.losses}${record.draws > 0 ? `-${record.draws}` : ''} (Total: ${total})`);
  });

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
