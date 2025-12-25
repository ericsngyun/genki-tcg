import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: true,
      rounds: {
        where: { roundNumber: 5 },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No in-progress events found');
    return;
  }

  if (!event.rounds[0]) {
    console.log('❌ Round 5 not found. Please create Round 5 first.');
    return;
  }

  const round5 = event.rounds[0];

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\nAdding phantom losses for Round 5...\n`);

  const droppedPlayersToFix = ['Forgotten', 'Justin', 'CAT', 'Miguelito'];
  let phantomLossesCreated = 0;

  for (const playerName of droppedPlayersToFix) {
    const user = await prisma.user.findFirst({
      where: { name: { equals: playerName, mode: 'insensitive' } },
    });

    if (!user) {
      console.log(`❌ ${playerName}: User not found`);
      continue;
    }

    // Verify they're dropped
    const entry = event.entries?.find((e: any) => e.userId === user.id);
    if (!entry?.droppedAt) {
      console.log(`⚠️  ${playerName}: Not marked as dropped, skipping`);
      continue;
    }

    // Check if they already have a match in Round 5
    const existingMatch = await prisma.match.findFirst({
      where: {
        roundId: round5.id,
        OR: [{ playerAId: user.id }, { playerBId: user.id }],
      },
    });

    if (existingMatch) {
      console.log(`ℹ️  ${playerName}: Already has a match in Round 5, skipping`);
      continue;
    }

    // Find next available table number
    const maxTable = await prisma.match.findFirst({
      where: { roundId: round5.id },
      orderBy: { tableNumber: 'desc' },
      select: { tableNumber: true },
    });

    const nextTableNumber = (maxTable?.tableNumber || 0) + 1;

    // Create phantom DQ loss
    const newMatch = await prisma.match.create({
      data: {
        roundId: round5.id,
        tableNumber: nextTableNumber,
        playerAId: user.id,
        playerBId: null,
        result: 'PLAYER_A_DQ',
        gamesWonA: 0,
        gamesWonB: 0,
        reportedAt: entry.droppedAt,
        overriddenBy: 'system-drop-phantom',
      },
    });

    console.log(`✅ ${playerName}: Created phantom DQ loss (match ID: ${newMatch.id})`);
    phantomLossesCreated++;
  }

  console.log(`\n✅ Created ${phantomLossesCreated} phantom loss(es) for Round 5.`);
  console.log(`\nDropped players now have complete Round 5 records.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
