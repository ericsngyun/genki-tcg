#!/usr/bin/env node
/**
 * Seed Railway Database
 *
 * This script connects to the Railway database and seeds it with initial data.
 * Make sure DATABASE_URL environment variable is set.
 *
 * Usage:
 *   1. Set DATABASE_URL from Railway: railway variables --service backend
 *   2. Copy the DATABASE_URL value
 *   3. Run: DATABASE_URL="your-url" node scripts/seed-railway.js
 *
 * Or use Railway CLI:
 *   railway run --service backend node scripts/seed-railway.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Railway database...\n');

  // Check if we're connected to Railway
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.error('\nPlease set it using one of these methods:');
    console.error('  1. Railway CLI: railway run --service backend node scripts/seed-railway.js');
    console.error('  2. Manual: DATABASE_URL="your-url" node scripts/seed-railway.js');
    process.exit(1);
  }

  if (dbUrl.includes('railway.internal')) {
    console.log('✅ Connected to Railway database\n');
  } else if (dbUrl.includes('localhost')) {
    console.warn('⚠️  Warning: Connected to LOCAL database, not Railway!\n');
  }

  try {
    // Create Genki organization
    console.log('📍 Creating organization...');
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
    console.log(`✅ Organization: ${genkiOrg.name} (invite code: ${genkiOrg.inviteCode})\n`);

    // Create owner user
    console.log('👤 Creating owner user...');
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
    console.log(`✅ Owner: ${owner.email}\n`);

    // Create staff user
    console.log('👤 Creating staff user...');
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
    console.log(`✅ Staff: ${staff.email}\n`);

    // Create test players
    console.log('👥 Creating test players...');
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

      // Give initial credits
      await prisma.creditLedgerEntry.create({
        data: {
          orgId: genkiOrg.id,
          userId: player.id,
          amount: 100,
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
    console.log('✅ Created 10 test players with 100 credits each\n');

    // Create sample event
    console.log('📅 Creating sample event...');
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
        entryFeeCents: 500,
        requiresDecklist: false,
        allowLateRegistration: true,
        createdBy: owner.id,
      },
    });
    console.log(`✅ Sample event: ${event.name}\n`);

    console.log('🎉 Seeding complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Owner:  owner@genki-tcg.com / password123');
    console.log('Staff:  staff@genki-tcg.com / password123');
    console.log('Players: player1@test.com ... player10@test.com / password123');
    console.log('Invite Code: GENKI');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
