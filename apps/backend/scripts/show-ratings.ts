import { PrismaClient, GameType } from '@prisma/client';

const prisma = new PrismaClient();

function mapRatingToTier(rating: number): string {
  if (rating >= 2150) return 'GENKI';
  if (rating >= 1950) return 'DIAMOND';
  if (rating >= 1750) return 'PLATINUM';
  if (rating >= 1550) return 'GOLD';
  if (rating >= 1350) return 'SILVER';
  if (rating >= 1200) return 'BRONZE';
  return 'UNRANKED';
}

async function showRatings() {
  const gameTypes: GameType[] = ['ONE_PIECE_TCG', 'AZUKI_TCG', 'RIFTBOUND'];

  for (const gameType of gameTypes) {
    console.log(`\n=== ${gameType} Ratings ===\n`);

    const ratings = await prisma.playerCategoryLifetimeRating.findMany({
      where: {
        category: gameType,
      },
      orderBy: {
        rating: 'desc',
      },
      select: {
        userId: true,
        rating: true,
        totalRatedMatches: true,
        matchWins: true,
        matchLosses: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`Total players: ${ratings.length}\n`);

    ratings.forEach((r, i) => {
      const tier = mapRatingToTier(r.rating);
      const record = `${r.matchWins}-${r.matchLosses}`;
      console.log(
        `${(i + 1).toString().padStart(2)}. ${r.user.name.padEnd(20)} ${Math.round(r.rating).toString().padStart(4)} (${tier.padEnd(8)}) - ${record} (${r.totalRatedMatches} matches)`
      );
    });
  }

  await prisma.$disconnect();
}

showRatings().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
