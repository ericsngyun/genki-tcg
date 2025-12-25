import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        where: {
          roundNumber: { in: [1, 2] },
        },
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
  console.log('Checking for staff-reported matches without confirmation in Rounds 1-2...\n');

  let issuesFound = 0;

  event.rounds.forEach((round) => {
    const problematicMatches = round.matches.filter(
      (m) => m.result && m.reportedBy && !m.confirmedBy && !m.overriddenBy
    );

    if (problematicMatches.length > 0) {
      console.log(`\n⚠️  Round ${round.roundNumber}: Found ${problematicMatches.length} matches with reportedBy but no confirmedBy:`);
      console.log('─'.repeat(80));

      problematicMatches.forEach((match) => {
        console.log(`  Table ${match.tableNumber}: ${match.playerA?.name} vs ${match.playerB?.name || 'BYE'}`);
        console.log(`    Result: ${match.result}`);
        console.log(`    ReportedBy: ${match.reportedBy}`);
        console.log(`    ConfirmedBy: ${match.confirmedBy || 'NULL'}`);
        console.log(`    OverriddenBy: ${match.overriddenBy || 'NULL'}`);
        console.log('');
        issuesFound++;
      });
    }
  });

  if (issuesFound === 0) {
    console.log('✅ No issues found! All reported matches have confirmation or override.\n');
  } else {
    console.log(`\n⚠️  Total issues found: ${issuesFound} matches`);
    console.log('\nThese matches are being excluded from standings calculation!');
    console.log('They need either confirmedBy or overriddenBy to be included.\n');
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
