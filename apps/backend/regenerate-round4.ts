import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      rounds: {
        where: { roundNumber: 4 },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event || !event.rounds[0]) {
    console.log('❌ Round 4 not found');
    return;
  }

  const round4 = event.rounds[0];

  if (round4.status !== 'PENDING') {
    console.log(`❌ Round 4 is ${round4.status}, can only regenerate PENDING rounds`);
    return;
  }

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\n🔄 Deleting Round 4 (${round4.id})...`);

  // Delete matches first
  await prisma.match.deleteMany({
    where: { roundId: round4.id },
  });

  // Delete round
  await prisma.round.delete({
    where: { id: round4.id },
  });

  console.log(`✅ Round 4 deleted successfully!\n`);
  console.log(`You can now create Round 4 again via the admin web interface.\n`);
  console.log(`The pairings should now be correct with proper Swiss pairing logic.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
