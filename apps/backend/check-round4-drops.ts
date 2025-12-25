import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: true,
      rounds: {
        where: { roundNumber: 4 },
        include: {
          matches: {
            include: {
              playerA: true,
              playerB: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event || !event.rounds[0]) {
    console.log('❌ Round 4 not found');
    return;
  }

  const round4 = event.rounds[0];

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\nRound 4 Status: ${round4.status}\n`);

  const playersToCheck = ['Forgotten', 'Justin', 'CAT', 'Miguelito'];

  console.log('Checking Round 4 records for:');
  console.log('================================================================================\n');

  for (const playerName of playersToCheck) {
    const user = await prisma.user.findFirst({
      where: { name: { equals: playerName, mode: 'insensitive' } },
    });

    if (!user) {
      console.log(`❌ ${playerName}: User not found`);
      continue;
    }

    // Check if dropped
    const entry = event.entries?.find((e: any) => e.userId === user.id) ||
      await prisma.entry.findFirst({
        where: {
          eventId: event.id,
          userId: user.id,
        },
      });

    const isDropped = entry?.droppedAt !== null;

    // Find matches in Round 4
    const matches = round4.matches.filter(
      (m) => m.playerAId === user.id || m.playerBId === user.id
    );

    console.log(`${playerName} (${isDropped ? '⚠️ DROPPED' : '✅ ACTIVE'}):`);

    if (matches.length === 0) {
      console.log('  ❌ NO MATCH in Round 4');
      if (isDropped) {
        console.log('  → Needs phantom DQ loss for Round 4');
      } else {
        console.log('  → ERROR: Active player missing from pairings!');
      }
    } else {
      matches.forEach((match) => {
        const isPlayerA = match.playerAId === user.id;
        const opponent = isPlayerA ? match.playerB?.name : match.playerA?.name;
        const tableNum = match.tableNumber;
        const result = match.result || 'Not reported';
        const isPhantom = match.overriddenBy === 'system-drop-phantom';

        console.log(`  Table ${tableNum}: vs ${opponent || 'BYE'}`);
        console.log(`  Result: ${result}`);
        console.log(`  Match Type: ${isPhantom ? 'PHANTOM DROP LOSS' : 'NORMAL'}`);

        if (isDropped && !isPhantom && !match.result) {
          console.log('  → Should be recorded as DQ/DROP');
        } else if (isDropped && match.result && !isPhantom) {
          console.log('  → Has result but player was dropped?');
        }
      });
    }
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
