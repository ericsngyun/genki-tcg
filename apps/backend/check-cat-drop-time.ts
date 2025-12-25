import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: {
      entries: true,
      rounds: {
        where: { roundNumber: 4 },
        include: {
          matches: {
            include: {
              playerA: true,
              playerB: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!event) {
    console.log('❌ No in-progress event found');
    return;
  }

  const catUser = await prisma.user.findFirst({
    where: { name: { equals: 'CAT', mode: 'insensitive' } },
  });

  if (!catUser) {
    console.log('❌ CAT user not found');
    return;
  }

  const catEntry = event.entries?.find((e: any) => e.userId === catUser.id);

  console.log(`\n📋 Event: ${event.name}\n`);
  console.log('CAT Drop Analysis:');
  console.log('================================================================================');
  console.log(`User ID: ${catUser.id}`);
  console.log(`Entry ID: ${catEntry?.id || 'Not found'}`);
  console.log(`Dropped At: ${catEntry?.droppedAt || 'NOT DROPPED'}`);
  console.log('');

  if (event.rounds[0]) {
    const round4 = event.rounds[0];
    const catMatch = round4.matches.find(
      (m) => m.playerAId === catUser.id || m.playerBId === catUser.id
    );

    if (catMatch) {
      console.log('Round 4 Match Details:');
      console.log('================================================================================');
      console.log(`Table: ${catMatch.tableNumber}`);
      console.log(`Player A: ${catMatch.playerA?.name} (${catMatch.playerAId})`);
      console.log(`Player B: ${catMatch.playerB?.name || 'BYE'} (${catMatch.playerBId || 'NULL'})`);
      console.log(`Result: ${catMatch.result || 'Not reported'}`);
      console.log(`Reported At: ${catMatch.reportedAt || 'NULL'}`);
      console.log(`Round Started: ${round4.startAt || 'Not started'}`);
      console.log(`Round Ended: ${round4.endAt || 'Not ended'}`);
      console.log('');

      if (catEntry?.droppedAt) {
        const droppedTime = new Date(catEntry.droppedAt);
        const matchReportTime = catMatch.reportedAt ? new Date(catMatch.reportedAt) : null;

        console.log('Timeline:');
        console.log('─'.repeat(80));
        if (matchReportTime) {
          console.log(`Match Reported: ${matchReportTime.toLocaleString()}`);
        }
        console.log(`Player Dropped: ${droppedTime.toLocaleString()}`);

        if (matchReportTime && matchReportTime < droppedTime) {
          console.log('\n✅ Match was reported BEFORE player dropped');
          console.log('   → Result should stand as-is');
        } else if (matchReportTime && matchReportTime > droppedTime) {
          console.log('\n⚠️  Match was reported AFTER player dropped');
          console.log('   → This might be an error, result should potentially be DQ');
        } else {
          console.log('\n⚠️  Match has no report time, cannot determine');
        }
      }
    }
  }

  console.log('\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
