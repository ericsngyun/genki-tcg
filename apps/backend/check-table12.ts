import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        where: { status: { in: ['ACTIVE', 'PENDING'] } },
        include: {
          matches: {
            include: {
              playerA: true,
              playerB: true,
            },
            orderBy: { tableNumber: 'asc' },
          },
        },
        orderBy: { roundNumber: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event || !event.rounds[0]) {
    console.log('❌ No active/pending round found');
    return;
  }

  const currentRound = event.rounds[0];

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`Round ${currentRound.roundNumber} (${currentRound.status})\n`);

  // Find Table 12
  const table12 = currentRound.matches.find((m) => m.tableNumber === 12);

  if (!table12) {
    console.log('❌ Table 12 not found in current round');
    return;
  }

  console.log('Table 12 Details:');
  console.log('================================================================================');
  console.log(`Match ID: ${table12.id}`);
  console.log(`Player A ID: ${table12.playerAId}`);
  console.log(`Player A Name: ${table12.playerA?.name || 'NULL'}`);
  console.log(`Player B ID: ${table12.playerBId || 'NULL'}`);
  console.log(`Player B Name: ${table12.playerB?.name || 'NULL (BYE)'}`);
  console.log(`\nResult: ${table12.result || 'Not reported'}`);
  console.log(`Score: ${table12.gamesWonA ?? 0} - ${table12.gamesWonB ?? 0}`);
  console.log(`\nReportedBy: ${table12.reportedBy || 'NULL'}`);
  console.log(`ConfirmedBy: ${table12.confirmedBy || 'NULL'}`);
  console.log(`OverriddenBy: ${table12.overriddenBy || 'NULL'}`);

  // Check if this is a bye match (playerB is null)
  if (table12.playerBId === null) {
    console.log('\n⚠️  This is a BYE match (playerB is NULL)');
  } else {
    console.log('\n✅ This is a regular match (both players assigned)');
  }

  // Find all matches for CAT
  console.log('\n\nAll CAT matches in current round:');
  console.log('================================================================================');

  // First, find CAT's user ID
  const catUser = await prisma.user.findFirst({
    where: { name: { equals: 'CAT', mode: 'insensitive' } },
  });

  if (!catUser) {
    console.log('❌ CAT user not found');
    return;
  }

  console.log(`CAT User ID: ${catUser.id}\n`);

  const catMatches = currentRound.matches.filter(
    (m) => m.playerAId === catUser.id || m.playerBId === catUser.id
  );

  catMatches.forEach((match) => {
    console.log(`Table ${match.tableNumber}:`);
    console.log(`  Player A: ${match.playerA?.name} (${match.playerAId})`);
    console.log(`  Player B: ${match.playerB?.name || 'BYE'} (${match.playerBId || 'NULL'})`);
    console.log(`  Is Bye: ${match.playerBId === null ? 'YES' : 'NO'}`);
    console.log('');
  });

  // Check for duplicate pairings
  if (catMatches.length > 1) {
    console.log(`⚠️  CAT has ${catMatches.length} matches in this round (should only have 1)!`);
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
