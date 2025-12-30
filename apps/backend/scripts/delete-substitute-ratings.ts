import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUBSTITUTE_PLAYER_IDS = [
  'cmi3oy0mb0007z0x0g289bmaz', // Player 1
  'cmi3oy1bi001yz0x0ssdq1ppr', // Player 10
  'cmi3oy0pj000ez0x03pdsb6by', // Player 2
  'cmi3oy0se000lz0x02gzkp5e0', // Player 3
  'cmi3oy0v7000sz0x0tuz62pxf', // Player 4
  'cmi3oy0xv000zz0x0o8qrabut', // Player 5
  'cmi3oy10p0016z0x0y5et521a', // Player 6
  'cmi3oy139001dz0x0h86z35io', // Player 7
  'cmi3oy162001kz0x0y0v0m73i', // Player 8
  'cmi3oy18p001rz0x012hlhis2', // Player 9
];

async function deleteSubstituteRatings() {
  console.log('Deleting ratings for substitute players (Player 1-10)...\n');

  // Delete lifetime rating history
  const deletedHistory = await prisma.lifetimeRatingHistory.deleteMany({
    where: {
      lifetimeRating: {
        userId: { in: SUBSTITUTE_PLAYER_IDS },
      },
    },
  });
  console.log(`✓ Deleted ${deletedHistory.count} lifetime rating history entries`);

  // Delete seasonal ratings
  const deletedSeasonal = await prisma.playerCategorySeasonRating.deleteMany({
    where: {
      userId: { in: SUBSTITUTE_PLAYER_IDS },
    },
  });
  console.log(`✓ Deleted ${deletedSeasonal.count} seasonal ratings`);

  // Delete lifetime ratings
  const deletedLifetime = await prisma.playerCategoryLifetimeRating.deleteMany({
    where: {
      userId: { in: SUBSTITUTE_PLAYER_IDS },
    },
  });
  console.log(`✓ Deleted ${deletedLifetime.count} lifetime ratings\n`);

  console.log('✅ All substitute player ratings deleted!');
  console.log('These players will not receive ratings in future tournaments.\n');

  await prisma.$disconnect();
}

deleteSubstituteRatings().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
