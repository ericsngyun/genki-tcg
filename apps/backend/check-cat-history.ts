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

  // Find CAT
  const catUser = await prisma.user.findFirst({
    where: { name: { equals: 'CAT', mode: 'insensitive' } },
  });

  if (!catUser) {
    console.log('❌ CAT user not found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\nCAT's Match History (User ID: ${catUser.id}):`);
  console.log('================================================================================\n');

  event.rounds.forEach((round) => {
    const catMatches = round.matches.filter(
      (m) => m.playerAId === catUser.id || m.playerBId === catUser.id
    );

    if (catMatches.length > 0) {
      console.log(`Round ${round.roundNumber} (${round.status}):`);
      catMatches.forEach((match) => {
        const isCatPlayerA = match.playerAId === catUser.id;
        const opponent = isCatPlayerA ? match.playerB?.name : match.playerA?.name;
        const isBye = match.playerBId === null;

        console.log(`  Table ${match.tableNumber}: ${match.playerA?.name || 'BYE'} vs ${match.playerB?.name || 'BYE'}`);
        console.log(`    Match ID: ${match.id}`);
        console.log(`    CAT is: ${isCatPlayerA ? 'Player A' : 'Player B'}`);
        console.log(`    Opponent: ${opponent || 'BYE'}`);
        console.log(`    Is Bye Match: ${isBye ? 'YES ⚠️' : 'NO'}`);
        console.log(`    Result: ${match.result || 'Not reported'}`);
        console.log(`    Confirmed: ${match.confirmedBy ? 'YES' : 'NO'}`);
        console.log('');
      });
    }
  });

  // Check for duplicate matches in Round 4
  const round4 = event.rounds.find((r) => r.roundNumber === 4);
  if (round4) {
    const catMatchesR4 = round4.matches.filter(
      (m) => m.playerAId === catUser.id || m.playerBId === catUser.id
    );

    if (catMatchesR4.length > 1) {
      console.log(`\n⚠️  ERROR: CAT has ${catMatchesR4.length} matches in Round 4 (should be 1)!`);
      console.log('This could cause display issues.\n');
    } else if (catMatchesR4.length === 1) {
      console.log(`\n✅ CAT has exactly 1 match in Round 4 (correct)\n`);
    } else {
      console.log(`\n⚠️  CAT has 0 matches in Round 4 (might have been dropped?)\n`);
    }
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
