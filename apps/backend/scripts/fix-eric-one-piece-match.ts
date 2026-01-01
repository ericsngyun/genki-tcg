import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEricOnePieceMatch() {
  console.log('Finding live One Piece TCG tournament...\n');

  // Find the in-progress One Piece event
  const liveEvent = await prisma.event.findFirst({
    where: {
      status: 'IN_PROGRESS',
      game: 'ONE_PIECE_TCG',
    },
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
        orderBy: {
          roundNumber: 'asc',
        },
      },
    },
  });

  if (!liveEvent) {
    console.log('❌ No live One Piece TCG event found');
    await prisma.$disconnect();
    return;
  }

  console.log(`✓ Found live event: ${liveEvent.name}`);
  console.log(`  Status: ${liveEvent.status}`);
  console.log(`  Game: ${liveEvent.game}\n`);

  // Find Eric's matches with 0-0 score
  let foundMatches = false;
  for (const round of liveEvent.rounds) {
    const ericMatches = round.matches.filter(
      (m) =>
        (m.playerA?.name?.toLowerCase().includes('eric') ||
         m.playerB?.name?.toLowerCase().includes('eric')) &&
        m.result &&
        m.gamesWonA === 0 &&
        m.gamesWonB === 0
    );

    if (ericMatches.length > 0) {
      foundMatches = true;
      for (const match of ericMatches) {
        console.log(`✓ Found Eric's match with 0-0 in Round ${round.roundNumber}:`);
        console.log(`  Match ID: ${match.id}`);
        console.log(`  Table: ${match.tableNumber}`);
        console.log(`  Player A: ${match.playerA?.name}`);
        console.log(`  Player B: ${match.playerB?.name || 'BYE'}`);
        console.log(`  Current Score: ${match.gamesWonA}-${match.gamesWonB}`);
        console.log(`  Result: ${match.result}\n`);

        // Determine the correct score based on result
        let newGamesWonA = 0;
        let newGamesWonB = 0;

        if (match.result === 'PLAYER_A_WIN') {
          newGamesWonA = 1;
          newGamesWonB = 0;
        } else if (match.result === 'PLAYER_B_WIN') {
          newGamesWonA = 0;
          newGamesWonB = 1;
        } else if (match.result === 'DRAW' || match.result === 'INTENTIONAL_DRAW') {
          newGamesWonA = 0;
          newGamesWonB = 0;
          console.log('⚠️  Match is a draw, keeping 0-0\n');
          continue;
        }

        // Update the match
        const updatedMatch = await prisma.match.update({
          where: { id: match.id },
          data: {
            gamesWonA: newGamesWonA,
            gamesWonB: newGamesWonB,
          },
        });

        const ericIsPlayerA = match.playerA?.name?.toLowerCase().includes('eric');
        const ericScore = ericIsPlayerA ? newGamesWonA : newGamesWonB;
        const opponentScore = ericIsPlayerA ? newGamesWonB : newGamesWonA;

        console.log(`✅ Updated Eric's match to ${ericScore}-${opponentScore} (Eric ${ericIsPlayerA ? 'wins' : 'loses'})`);
        console.log(`  New Score: ${updatedMatch.gamesWonA}-${updatedMatch.gamesWonB}\n`);
      }
    }
  }

  if (!foundMatches) {
    console.log('❌ No matches found for Eric with 0-0 score in this event');
    console.log('\nAll Eric matches:');
    for (const round of liveEvent.rounds) {
      const ericMatches = round.matches.filter(
        (m) =>
          m.playerA?.name?.toLowerCase().includes('eric') ||
          m.playerB?.name?.toLowerCase().includes('eric')
      );
      for (const match of ericMatches) {
        console.log(`  Round ${round.roundNumber}, Table ${match.tableNumber}: ${match.playerA?.name} vs ${match.playerB?.name || 'BYE'} - ${match.gamesWonA}-${match.gamesWonB} (${match.result || 'Pending'})`);
      }
    }
  }

  await prisma.$disconnect();
}

fixEricOnePieceMatch().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
