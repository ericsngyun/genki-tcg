import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
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

  // Find Forgotten
  const forgottenUser = await prisma.user.findFirst({
    where: { name: { equals: 'Forgotten', mode: 'insensitive' } },
  });

  if (!forgottenUser) {
    console.log('❌ Forgotten user not found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\nForgotten's Complete Match Record (User ID: ${forgottenUser.id}):`);
  console.log('================================================================================\n');

  let wins = 0;
  let losses = 0;
  let draws = 0;

  event.rounds.forEach((round) => {
    const matches = round.matches.filter(
      (m) => m.playerAId === forgottenUser.id || m.playerBId === forgottenUser.id
    );

    matches.forEach((match) => {
      const isPlayerA = match.playerAId === forgottenUser.id;
      const opponent = isPlayerA ? match.playerB?.name : match.playerA?.name;

      let result = 'Not reported';
      if (match.result) {
        if (match.result === 'PLAYER_A_WIN') {
          result = isPlayerA ? 'WIN' : 'LOSS';
          if (isPlayerA) wins++;
          else losses++;
        } else if (match.result === 'PLAYER_B_WIN') {
          result = isPlayerA ? 'LOSS' : 'WIN';
          if (isPlayerA) losses++;
          else wins++;
        } else if (match.result === 'DRAW' || match.result === 'INTENTIONAL_DRAW') {
          result = 'DRAW';
          draws++;
        } else if (match.result === 'PLAYER_A_DQ') {
          result = isPlayerA ? 'DQ/DROP' : 'WIN by DQ';
          if (isPlayerA) losses++;
          else wins++;
        }
      }

      console.log(`Round ${round.roundNumber} (${round.status}):`);
      console.log(`  vs ${opponent || 'BYE'}`);
      console.log(`  Result: ${result}`);
      console.log(`  Match Type: ${match.overriddenBy === 'system-drop-phantom' ? 'PHANTOM DROP LOSS' : 'NORMAL'}`);
      console.log('');
    });
  });

  console.log(`\nForgotten's Final Record: ${wins}-${losses}${draws > 0 ? `-${draws}` : ''}`);
  console.log(`Match Win Percentage: ${((wins / (wins + losses + draws)) * 100).toFixed(1)}%`);
  console.log(`(Floored to 33.33% minimum for OMW calculations)\n`);

  // Check opponents
  console.log('\nForgotten\'s Opponents (who benefit from this fix):');
  console.log('================================================================================');

  const opponentIds = new Set<string>();
  event.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.playerAId === forgottenUser.id && match.playerBId) {
        opponentIds.add(match.playerBId);
      } else if (match.playerBId === forgottenUser.id) {
        opponentIds.add(match.playerAId);
      }
    });
  });

  for (const opponentId of opponentIds) {
    const opponent = await prisma.user.findUnique({
      where: { id: opponentId },
    });
    console.log(`  - ${opponent?.name || 'Unknown'} (will see Forgotten as ${wins}-${losses} for OMW%)`);
  }

  console.log('\n✅ Dropped players now have complete records for accurate tiebreakers.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
