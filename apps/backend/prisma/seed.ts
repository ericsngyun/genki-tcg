import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Genki organization
  const genkiOrg = await prisma.organization.upsert({
    where: { slug: 'genki' },
    update: {},
    create: {
      name: 'Genki TCG',
      slug: 'genki',
      inviteCode: 'GENKI',
      logoUrl: null,
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
    },
  });

  console.log('✅ Created organization:', genkiOrg.name);

  // Create owner user
  const ownerPassword = await bcrypt.hash('password123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@genki-tcg.com' },
    update: {},
    create: {
      email: 'owner@genki-tcg.com',
      name: 'Shop Owner',
      passwordHash: ownerPassword,
    },
  });

  await prisma.orgMembership.upsert({
    where: {
      userId_orgId: {
        userId: owner.id,
        orgId: genkiOrg.id,
      },
    },
    update: {},
    create: {
      userId: owner.id,
      orgId: genkiOrg.id,
      role: 'OWNER',
    },
  });

  console.log('✅ Created owner:', owner.email);

  // Create staff user
  const staffPassword = await bcrypt.hash('password123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@genki-tcg.com' },
    update: {},
    create: {
      email: 'staff@genki-tcg.com',
      name: 'Staff Member',
      passwordHash: staffPassword,
    },
  });

  await prisma.orgMembership.upsert({
    where: {
      userId_orgId: {
        userId: staff.id,
        orgId: genkiOrg.id,
      },
    },
    update: {},
    create: {
      userId: staff.id,
      orgId: genkiOrg.id,
      role: 'STAFF',
    },
  });

  console.log('✅ Created staff:', staff.email);

  // Create 10 test players
  for (let i = 1; i <= 10; i++) {
    const playerPassword = await bcrypt.hash('password123', 10);
    const player = await prisma.user.upsert({
      where: { email: `player${i}@test.com` },
      update: {},
      create: {
        email: `player${i}@test.com`,
        name: `Player ${i}`,
        passwordHash: playerPassword,
      },
    });

    await prisma.orgMembership.upsert({
      where: {
        userId_orgId: {
          userId: player.id,
          orgId: genkiOrg.id,
        },
      },
      update: {},
      create: {
        userId: player.id,
        orgId: genkiOrg.id,
        role: 'PLAYER',
      },
    });

    // Give each player some initial credits
    await prisma.creditLedgerEntry.create({
      data: {
        orgId: genkiOrg.id,
        userId: player.id,
        amount: 100, // 100 credits
        reasonCode: 'MANUAL_ADD',
        memo: 'Initial welcome credits',
        createdBy: owner.id,
      },
    });

    await prisma.creditBalance.upsert({
      where: {
        orgId_userId: {
          orgId: genkiOrg.id,
          userId: player.id,
        },
      },
      update: {
        balance: 100,
        lastTransactionAt: new Date(),
      },
      create: {
        orgId: genkiOrg.id,
        userId: player.id,
        balance: 100,
        lastTransactionAt: new Date(),
      },
    });
  }

  console.log('✅ Created 10 test players with 100 credits each');

  // Create a sample event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);

  const event = await prisma.event.create({
    data: {
      orgId: genkiOrg.id,
      name: 'Friday Night OPTCG',
      game: 'OPTCG',
      format: 'CONSTRUCTED',
      status: 'SCHEDULED',
      description: 'Weekly Friday night One Piece TCG tournament',
      startAt: tomorrow,
      maxPlayers: 32,
      entryFeeCents: 500, // $5.00
      requiresDecklist: false,
      allowLateRegistration: true,
      createdBy: owner.id,
    },
  });

  console.log('✅ Created sample event:', event.name);

  console.log('🎉 Seeding complete!');
  console.log('\n📝 Test credentials:');
  console.log('Owner: owner@genki-tcg.com / password123');
  console.log('Staff: staff@genki-tcg.com / password123');
  console.log('Players: player1@test.com ... player10@test.com / password123');
  console.log('Invite code: GENKI');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
