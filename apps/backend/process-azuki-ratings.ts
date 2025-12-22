import { PrismaClient } from '@prisma/client';
import { RatingsService } from './src/ratings/ratings.service';
import { SeasonsService } from './src/ratings/seasons.service';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Finding recent Azuki tournaments...\n');

  // Find the most recent Azuki tournament
  const event = await prisma.event.findFirst({
    where: {
      game: 'AZUKI_TCG',
      status: 'COMPLETED',
      ratingsProcessed: false,
    },
    include: {
      _count: {
        select: { entries: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No unprocessed completed Azuki tournaments found');
    console.log('\nChecking all recent Azuki tournaments:');

    const allEvents = await prisma.event.findMany({
      where: {
        game: 'AZUKI_TCG',
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const e of allEvents) {
      console.log(`\n  ID: ${e.id}`);
      console.log(`  Name: ${e.name}`);
      console.log(`  Status: ${e.status}`);
      console.log(`  Players: ${e._count.entries}`);
      console.log(`  Ratings Processed: ${e.ratingsProcessed ? 'Yes ✅' : 'No ❌'}`);
    }

    return;
  }

  console.log(`📋 Found tournament: ${event.name}`);
  console.log(`   ID: ${event.id}`);
  console.log(`   Status: ${event.status}`);
  console.log(`   Players: ${event._count.entries}`);
  console.log(`   Ratings Processed: ${event.ratingsProcessed ? 'Yes' : 'No'}`);

  if (event._count.entries < 25 || event._count.entries > 35) {
    console.log(`\n⚠️  Warning: Expected ~30 players, found ${event._count.entries}`);
    console.log('   Is this the correct tournament? (Ctrl+C to cancel)\n');
  }

  console.log('\n🎲 Processing player ratings...\n');

  // Create service instances
  const seasonsService = new SeasonsService(prisma);
  const ratingsService = new RatingsService(prisma, seasonsService);

  try {
    await ratingsService.processTournamentRatings(event.id);

    console.log('✅ Tournament ratings processed successfully!\n');

    // Show some sample updated ratings
    console.log('📊 Sample updated ratings:');

    const updatedRatings = await prisma.tournamentRatingUpdate.findMany({
      where: { tournamentId: event.id },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { seasonalRatingAfter: 'desc' },
      take: 10,
    });

    for (const rating of updatedRatings) {
      const change = rating.seasonalRatingDelta >= 0 ? '+' : '';
      console.log(`   ${rating.user.name}: ${Math.round(rating.seasonalRatingBefore)} → ${Math.round(rating.seasonalRatingAfter)} (${change}${Math.round(rating.seasonalRatingDelta)}) [${rating.tierAfter}]`);
    }

    console.log(`\n🏆 Total players updated: ${updatedRatings.length}`);
    console.log('\nPlayer rankings have been updated and are now visible in the leaderboard!\n');

  } catch (error: any) {
    console.error('❌ Error processing ratings:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
