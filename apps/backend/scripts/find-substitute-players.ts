import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findSubstitutePlayers() {
  console.log('Finding substitute players (Player 1-10)...\n');

  // Find all users with names matching "Player 1" through "Player 10"
  const substitutePlayers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { in: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10'] } },
        { name: { contains: 'Player', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log(`Found ${substitutePlayers.length} potential substitute players:\n`);

  for (const player of substitutePlayers) {
    console.log(`ID: ${player.id}`);
    console.log(`Name: ${player.name}`);
    console.log(`Email: ${player.email}`);
    console.log(`Created: ${player.createdAt.toISOString()}`);
    console.log('---');
  }

  await prisma.$disconnect();
}

findSubstitutePlayers().catch((error) => {
  console.error('Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
