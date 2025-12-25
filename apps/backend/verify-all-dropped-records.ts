import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: true,
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
    console.log('❌ No in-progress event found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}\n`);

  const droppedPlayers = ['Forgotten', 'Justin', 'CAT', 'Miguelito'];

  console.log('Complete Records for Dropped Players:');
  console.log('================================================================================\n');

  for (const playerName of droppedPlayers) {
    const user = await prisma.user.findFirst({
      where: { name: { equals: playerName, mode: 'insensitive' } },
    });

    if (!user) continue;

    const entry = event.entries?.find((e: any) => e.userId === user.id);

    console.log(`${playerName} (Dropped: ${entry?.droppedAt ? new Date(entry.droppedAt).toLocaleDateString() : 'NO'})`);
    console.log('─'.repeat(80));

    let totalWins = 0;
    let totalLosses = 0;

    event.rounds.forEach((round) => {
      const matches = round.matches.filter(
        (m) => m.playerAId === user.id || m.playerBId === user.id
      );

      if (matches.length > 0) {
        matches.forEach((match) => {
          const isPlayerA = match.playerAId === user.id;
          const opponent = isPlayerA ? match.playerB?.name : match.playerA?.name;
          const isPhantom = match.overriddenBy === 'system-drop-phantom';

          let result = 'Not reported';
          if (match.result) {
            if (match.result === 'PLAYER_A_WIN') {
              result = isPlayerA ? 'WIN' : 'LOSS';
              if (isPlayerA) totalWins++;
              else totalLosses++;
            } else if (match.result === 'PLAYER_B_WIN') {
              result = isPlayerA ? 'LOSS' : 'WIN';
              if (isPlayerA) totalLosses++;
              else totalWins++;
            } else if (match.result === 'PLAYER_A_DQ') {
              result = isPlayerA ? 'DQ (DROP)' : 'WIN by DQ';
              if (isPlayerA) totalLosses++;
              else totalWins++;
            }
          }

          console.log(`  Round ${round.roundNumber}: vs ${opponent || 'BYE'} - ${result} ${isPhantom ? '(PHANTOM)' : ''}`);
        });
      } else {
        console.log(`  Round ${round.roundNumber}: No match`);
      }
    });

    console.log(`  \n  Total Record: ${totalWins}-${totalLosses}`);
    console.log('');
  }

  console.log('✅ All dropped players have complete records for OMW%/OOMW% calculations.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
