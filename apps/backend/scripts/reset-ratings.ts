import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetRatings() {
  console.log('Resetting all ratings and marking tournaments for reprocessing...\n');

  // 1. Delete all existing ratings
  console.log('Deleting all rating history...');
  await prisma.lifetimeRatingHistory.deleteMany({});
  console.log('✓ Rating history deleted');

  console.log('Deleting all seasonal ratings...');
  await prisma.playerCategorySeasonRating.deleteMany({});
  console.log('✓ Seasonal ratings deleted');

  console.log('Deleting all lifetime ratings...');
  await prisma.playerCategoryLifetimeRating.deleteMany({});
  console.log('✓ Lifetime ratings deleted\n');

  // 2. Mark all completed tournaments as not processed
  const result = await prisma.event.updateMany({
    where: {
      status: 'COMPLETED',
      ratingsProcessed: true,
    },
    data: {
      ratingsProcessed: false,
      ratingsProcessedAt: null,
      ratingsProcessedBy: null,
    },
  });

  console.log(`✓ Marked ${result.count} tournaments for reprocessing\n`);

  console.log('✅ All ratings have been reset!');
  console.log('\nThe backend will automatically reprocess ratings with the new protection rules.');
  console.log('(Players below PLATINUM tier will not lose rating points)\n');

  await prisma.$disconnect();
}

resetRatings().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
