import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEricByeMatch() {
  console.log('Finding live Azuki event...\n');

  // Find the in-progress Azuki event
  const liveEvent = await prisma.event.findFirst({
    where: {
      status: 'IN_PROGRESS',
      game: 'AZUKI_TCG',
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
          roundNumber: 'desc',
        },
      },
    },
  });

  if (!liveEvent) {
    console.log('❌ No live Azuki event found');
    await prisma.$disconnect();
    return;
  }

  console.log(`✓ Found live event: ${liveEvent.name}`);
  console.log(`  Status: ${liveEvent.status}`);
  console.log(`  Game: ${liveEvent.game}\n`);

  // Find Eric's BYE match (where Eric is playerA and playerB is null, with 2-0 score)
  let foundMatch = false;
  for (const round of liveEvent.rounds) {
    const ericByeMatch = round.matches.find(
      (m) =>
        m.playerA?.name?.toLowerCase().includes('eric') &&
        m.playerBId === null &&
        m.gamesWonA === 2 &&
        m.gamesWonB === 0
    );

    if (ericByeMatch) {
      foundMatch = true;
      console.log(`✓ Found Eric's BYE match in Round ${round.roundNumber}:`);
      console.log(`  Match ID: ${ericByeMatch.id}`);
      console.log(`  Table: ${ericByeMatch.tableNumber}`);
      console.log(`  Player A: ${ericByeMatch.playerA?.name} (Eric)`);
      console.log(`  Player B: BYE`);
      console.log(`  Current Score: ${ericByeMatch.gamesWonA}-${ericByeMatch.gamesWonB}`);
      console.log(`  Result: ${ericByeMatch.result}\n`);

      // Update the match to 1-0
      const updatedMatch = await prisma.match.update({
        where: { id: ericByeMatch.id },
        data: {
          gamesWonA: 1,
          gamesWonB: 0,
        },
      });

      console.log(`✅ Updated Eric's BYE match to 1-0`);
      console.log(`  New Score: ${updatedMatch.gamesWonA}-${updatedMatch.gamesWonB}\n`);
      break;
    }
  }

  if (!foundMatch) {
    console.log('❌ No BYE match found for Eric with 2-0 score in this event');
  }

  await prisma.$disconnect();
}

fixEricByeMatch().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
