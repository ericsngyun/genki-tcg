import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        where: { roundNumber: 3 },
        include: {
          matches: {
            include: {
              playerA: { select: { name: true } },
              playerB: { select: { name: true } },
            },
            orderBy: { tableNumber: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event || !event.rounds[0]) {
    console.log('❌ Round 3 not found');
    return;
  }

  const round3 = event.rounds[0];

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\nRound 3 Status: ${round3.status}\n`);

  const reportedMatches = round3.matches.filter((m) => m.result !== null);
  const unreportedMatches = round3.matches.filter((m) => m.result === null);

  console.log(`Total Matches: ${round3.matches.length}`);
  console.log(`Reported: ${reportedMatches.length}`);
  console.log(`Unreported: ${unreportedMatches.length}\n`);

  if (reportedMatches.length > 0) {
    console.log('Reported Matches:');
    console.log('================================================================================\n');

    reportedMatches.forEach((match) => {
      const playerAName = match.playerA?.name || 'BYE';
      const playerBName = match.playerB?.name || 'BYE';

      console.log(`Table ${match.tableNumber}: ${playerAName} vs ${playerBName}`);
      console.log(`  Result: ${match.result}`);
      console.log(`  Score: ${match.gamesWonA}-${match.gamesWonB}`);
      console.log(`  ReportedBy: ${match.reportedBy || 'NULL'}`);
      console.log(`  ReportedAt: ${match.reportedAt || 'NULL'}`);
      console.log(`  ConfirmedBy: ${match.confirmedBy || 'NULL'} ${!match.confirmedBy && match.reportedBy ? '⚠️ MISSING!' : '✅'}`);
      console.log(`  OverriddenBy: ${match.overriddenBy || 'NULL'}`);
      console.log('');
    });

    // Check for unconfirmed matches
    const unconfirmedMatches = reportedMatches.filter(
      (m) => m.reportedBy && !m.confirmedBy && !m.overriddenBy
    );

    if (unconfirmedMatches.length > 0) {
      console.log(`\n⚠️  WARNING: ${unconfirmedMatches.length} reported matches are MISSING confirmedBy!`);
      console.log('These will NOT be included in standings calculation.\n');
      console.log('This means the backend code fix has not been applied yet (needs rebuild).\n');
    } else {
      console.log('✅ All reported matches are properly confirmed!\n');
    }
  }

  if (unreportedMatches.length > 0) {
    console.log('\nUnreported Matches:');
    console.log('================================================================================\n');

    unreportedMatches.forEach((match) => {
      const playerAName = match.playerA?.name || 'BYE';
      const playerBName = match.playerB?.name || 'BYE';
      console.log(`  Table ${match.tableNumber}: ${playerAName} vs ${playerBName}`);
    });
    console.log('');
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
