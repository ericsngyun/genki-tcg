import { PrismaClient } from '@prisma/client';
import { RatingsService } from '../src/ratings/ratings.service';
import { SeasonsService } from '../src/ratings/seasons.service';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient() as unknown as PrismaService;

async function processAllTournaments() {
  console.log('Processing all unprocessed tournaments...\n');

  // Initialize services
  const seasonsService = new SeasonsService(prisma);
  const ratingsService = new RatingsService(prisma, seasonsService);

  // Get all completed tournaments that haven't been processed
  const tournaments = await prisma.event.findMany({
    where: {
      status: 'COMPLETED',
      ratingsProcessed: false,
    },
    orderBy: {
      startAt: 'asc', // Process in chronological order
    },
    select: {
      id: true,
      name: true,
      game: true,
      startAt: true,
    },
  });

  console.log(`Found ${tournaments.length} tournaments to process\n`);

  for (const tournament of tournaments) {
    console.log(`Processing: ${tournament.name} (${tournament.game}) - ${tournament.startAt.toISOString().split('T')[0]}`);

    try {
      await ratingsService.processTournamentRatings(tournament.id);
      console.log(`✓ Successfully processed ${tournament.name}\n`);
    } catch (error: any) {
      console.error(`✗ Error processing ${tournament.name}:`, error.message);
      console.error(error.stack);
      console.log('');
    }
  }

  console.log('✅ All tournaments processed!');
  await prisma.$disconnect();
}

processAllTournaments().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
