import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Run this script after reporting match results to ensure they show in standings.
 * This auto-confirms any staff-reported matches that are missing confirmation.
 *
 * Usage: npx tsx sync-standings.ts
 */
async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
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
    console.log('❌ No in-progress events found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}\n`);

  let fixedCount = 0;

  for (const round of event.rounds) {
    // Find matches that are reported but not confirmed
    const unconfirmedMatches = round.matches.filter(
      (m) => m.result && m.reportedBy && !m.confirmedBy && !m.overriddenBy
    );

    if (unconfirmedMatches.length > 0) {
      console.log(`Round ${round.roundNumber}: Auto-confirming ${unconfirmedMatches.length} staff reports...`);

      for (const match of unconfirmedMatches) {
        await prisma.match.update({
          where: { id: match.id },
          data: { confirmedBy: match.reportedBy },
        });

        const playerAName = match.playerA?.name || 'BYE';
        const playerBName = match.playerB?.name || 'BYE';
        console.log(`  ✅ Table ${match.tableNumber}: ${playerAName} vs ${playerBName}`);
        fixedCount++;
      }
    }
  }

  if (fixedCount === 0) {
    console.log('✅ All reports are properly confirmed. Standings are up to date!\n');
  } else {
    console.log(`\n✅ Fixed ${fixedCount} match(es). Standings are now synced!\n`);
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
