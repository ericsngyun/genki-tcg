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
    console.log('❌ No in-progress events found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}\n`);
  console.log('Fixing staff-reported matches without confirmation...\n');

  let fixedCount = 0;

  for (const round of event.rounds) {
    const problematicMatches = round.matches.filter(
      (m) => m.result && m.reportedBy && !m.confirmedBy && !m.overriddenBy
    );

    if (problematicMatches.length > 0) {
      console.log(`\nRound ${round.roundNumber}: Fixing ${problematicMatches.length} matches...`);
      console.log('─'.repeat(80));

      for (const match of problematicMatches) {
        console.log(`  Table ${match.tableNumber}: ${match.playerA?.name} vs ${match.playerB?.name || 'BYE'}`);
        console.log(`    Setting confirmedBy = reportedBy (${match.reportedBy})`);

        await prisma.match.update({
          where: { id: match.id },
          data: {
            confirmedBy: match.reportedBy, // Auto-confirm staff reports
          },
        });

        fixedCount++;
        console.log('    ✅ Fixed!\n');
      }
    }
  }

  console.log(`\n✅ Total matches fixed: ${fixedCount}`);
  console.log('\nStandings should now calculate correctly!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
