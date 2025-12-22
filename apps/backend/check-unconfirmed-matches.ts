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
              playerA: { select: { name: true } },
              playerB: { select: { name: true } },
            },
          },
        },
        orderBy: { roundNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('No in-progress events found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}\n`);

  for (const round of event.rounds) {
    console.log(`🎯 Round ${round.roundNumber} (Status: ${round.status})`);
    console.log('='.repeat(80));

    const needsConfirmation = round.matches.filter(
      (m) => m.reportedBy && !m.confirmedBy && !m.overriddenBy
    );

    console.log(`   Total Matches: ${round.matches.length}`);
    console.log(`   Needs Confirmation: ${needsConfirmation.length}\n`);

    if (needsConfirmation.length > 0) {
      console.log('   ⚠️  MATCHES NEEDING OPPONENT CONFIRMATION:');
      needsConfirmation.forEach((m) => {
        const playerBName = m.playerB?.name || 'BYE';
        console.log(`      Table ${m.tableNumber}: ${m.playerA.name} vs ${playerBName}`);
        console.log(`         Result: ${m.result} (reported but not confirmed)`);
        console.log(`         Match ID: ${m.id}\n`);
      });

      console.log('\n   💡 FIX OPTIONS:');
      console.log('      1. Have opponents confirm the matches');
      console.log('      2. Admin can override matches to bypass confirmation');
      console.log('      3. Run the auto-confirm script below\n');
    } else {
      console.log('   ✅ All matches are properly reported/confirmed!\n');
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
