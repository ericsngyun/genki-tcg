import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No completed events found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`   Event ID: ${event.id}\n`);

  // Check if ratings exist for this tournament
  const ratingUpdates = await prisma.tournamentRatingUpdate.findMany({
    where: { tournamentId: event.id },
    include: {
      player: { select: { name: true } },
    },
    orderBy: { lifetimeRatingAfter: 'desc' },
  });

  console.log(`Rating Updates for Tournament: ${ratingUpdates.length}\n`);

  if (ratingUpdates.length === 0) {
    console.log('⚠️  No rating updates found for this tournament.');
    console.log('    Ratings may need to be processed.\n');
  } else {
    console.log('✅ Ratings have been processed for this tournament!\n');
    console.log('Top 10 Players by New Rating:');
    console.log('================================================================================');

    ratingUpdates.slice(0, 10).forEach((update, index) => {
      const delta = update.lifetimeRatingDelta;
      const sign = delta >= 0 ? '+' : '';
      console.log(
        `${(index + 1).toString().padStart(2)}. ${update.player.name.padEnd(30)} ` +
        `${update.lifetimeRatingBefore.toFixed(0)} → ${update.lifetimeRatingAfter.toFixed(0)} (${sign}${delta.toFixed(0)})`
      );
    });
    console.log('\n');
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
