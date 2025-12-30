import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRatingHistory() {
  // Find spvcecowboy
  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: 'spvcecowboy',
        mode: 'insensitive',
      },
    },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`Found user: ${user.name} (${user.id})\n`);

  // Get lifetime rating
  const lifetimeRating = await prisma.playerCategoryLifetimeRating.findFirst({
    where: {
      userId: user.id,
      category: 'ONE_PIECE_TCG',
    },
  });

  if (!lifetimeRating) {
    console.log('No lifetime rating found');
    return;
  }

  console.log(`Current rating: ${Math.round(lifetimeRating.rating)}`);
  console.log(`Total matches: ${lifetimeRating.totalRatedMatches}`);
  console.log(`Record: ${lifetimeRating.matchWins}-${lifetimeRating.matchLosses}\n`);

  // Get rating history
  const history = await prisma.lifetimeRatingHistory.findMany({
    where: {
      lifetimeRatingId: lifetimeRating.id,
    },
    orderBy: {
      calculatedAt: 'asc',
    },
  });

  console.log(`Rating History (${history.length} entries):\n`);

  for (const entry of history) {
    // Get event details
    const event = entry.eventId ? await prisma.event.findUnique({
      where: { id: entry.eventId },
      select: { name: true, startAt: true },
    }) : null;

    // Get opponent details
    const opponent = await prisma.user.findUnique({
      where: { id: entry.opponentId },
      select: { name: true },
    });

    // Determine outcome from matchResult
    let outcome = 'Unknown';
    if (entry.matchResult === 'PLAYER_A_WIN' || entry.matchResult === 'PLAYER_B_WIN') {
      // We'd need to know if this player was A or B to determine win/loss
      // For now, just show the result
      outcome = entry.matchResult;
    } else if (entry.matchResult === 'DRAW') {
      outcome = 'Draw';
    }

    console.log(`${event?.name || 'Unknown Event'} (${event?.startAt.toISOString().split('T')[0] || 'Unknown Date'})`);
    console.log(`  ${outcome} vs ${opponent?.name || 'Unknown'}`);
    console.log(`  Rating: ${Math.round(entry.ratingBefore)} → ${Math.round(entry.ratingAfter)} (${entry.ratingChange > 0 ? '+' : ''}${Math.round(entry.ratingChange)})`);
    console.log(`  Opponent rating: ${Math.round(entry.opponentRatingBefore)}\n`);
  }

  await prisma.$disconnect();
}

checkRatingHistory().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
