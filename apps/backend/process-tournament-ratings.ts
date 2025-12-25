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

  console.log('Processing tournament ratings...\n');

  // Call the backend API to process ratings
  const response = await fetch(`http://localhost:3001/ratings/tournaments/${event.id}/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    console.log('✅ Tournament ratings processed successfully!');
    console.log('\nPlayer ratings have been updated based on tournament results.\n');
  } else {
    console.log(`⚠️  API call failed with status: ${response.status}`);
    console.log('Note: Ratings should have been auto-processed when tournament completed.\n');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    console.log('\nNote: The ratings processing happens automatically when the tournament completes.');
    console.log('If the backend is running, ratings should already be updated.\n');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
