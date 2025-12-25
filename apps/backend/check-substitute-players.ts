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

  // Find substitute players (Player 1-10)
  const substitutePlayers = event.entries
    .filter((e) => e.user.name.match(/^Player \d+$/))
    .sort((a, b) => {
      const numA = parseInt(a.user.name.replace('Player ', ''));
      const numB = parseInt(b.user.name.replace('Player ', ''));
      return numA - numB;
    });

  console.log('Substitute Players Found:');
  substitutePlayers.forEach((entry) => {
    console.log(`  ${entry.user.name} (ID: ${entry.userId})`);
  });

  console.log('\n\nMatch History for Each Substitute Player:');
  console.log('================================================================================\n');

  for (const entry of substitutePlayers) {
    const playerId = entry.userId;
    const playerName = entry.user.name;

    console.log(`${playerName}:`);
    console.log('─'.repeat(80));

    let wins = 0;
    let losses = 0;

    event.rounds.forEach((round) => {
      const playerMatches = round.matches.filter(
        (m) => m.playerAId === playerId || m.playerBId === playerId
      );

      playerMatches.forEach((match) => {
        const isPlayerA = match.playerAId === playerId;
        const opponent = isPlayerA ? match.playerB : match.playerA;
        const opponentName = opponent?.name || 'BYE';

        let resultText = 'Not reported';
        let outcome = '';

        if (match.result) {
          if (match.result === 'PLAYER_A_WIN') {
            resultText = `${match.playerA?.name} wins ${match.gamesWonA}-${match.gamesWonB}`;
            outcome = isPlayerA ? '✅ WIN' : '❌ LOSS';
            if (isPlayerA) wins++;
            else losses++;
          } else if (match.result === 'PLAYER_B_WIN') {
            resultText = `${match.playerB?.name} wins ${match.gamesWonB}-${match.gamesWonA}`;
            outcome = isPlayerA ? '❌ LOSS' : '✅ WIN';
            if (isPlayerA) losses++;
            else wins++;
          } else if (match.result === 'DRAW') {
            resultText = `Draw ${match.gamesWonA}-${match.gamesWonB}`;
            outcome = '🤝 DRAW';
          }
        }

        console.log(
          `  Round ${round.roundNumber} vs ${opponentName.padEnd(25)} | ${resultText.padEnd(35)} | ${outcome}`
        );
      });
    });

    console.log(`  TOTAL RECORD: ${wins}-${losses}\n`);
  }

  // Expected records
  console.log('\n\nExpected Records (before Round 3):');
  console.log('================================================================================');
  console.log('  Player 1:  2-0');
  console.log('  Player 3:  2-0');
  console.log('  Player 5:  1-1');
  console.log('  Player 9:  1-1');
  console.log('  Player 10: 2-0');
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
