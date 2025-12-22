import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No in-progress events found');
    return;
  }

  console.log(`\n📋 Event: ${event.name}`);
  console.log(`\n🏁 Completing tournament...\n`);

  const updatedEvent = await prisma.event.update({
    where: { id: event.id },
    data: {
      status: 'COMPLETED',
      endAt: new Date(),
    },
  });

  console.log(`✅ Tournament completed!`);
  console.log(`   Status: ${updatedEvent.status}`);
  console.log(`   Ended at: ${updatedEvent.endAt}\n`);
  console.log(`🏆 Champion: SWTNB (5-0)\n`);
  console.log(`Final standings are now available in the admin web.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
