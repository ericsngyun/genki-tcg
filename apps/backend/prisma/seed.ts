import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Generate a secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

async function main() {
  console.log('🌱 Seeding database...');

  // Get passwords from environment variables
  const ownerPasswordPlain = process.env.OWNER_PASSWORD;
  const staffPasswordPlain = process.env.STAFF_PASSWORD;

  if (!ownerPasswordPlain || !staffPasswordPlain) {
    console.error('❌ ERROR: OWNER_PASSWORD and STAFF_PASSWORD environment variables are required');
    console.log('Please set these in your .env file:');
    console.log('  OWNER_PASSWORD=your_secure_owner_password');
    console.log('  STAFF_PASSWORD=your_secure_staff_password');
    process.exit(1);
  }

  console.log('✅ Using passwords from environment variables\n');

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

  // Create owner user with password from environment
  const ownerPassword = await bcrypt.hash(ownerPasswordPlain, 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@genkitcg.app' },
    update: {},
    create: {
      email: 'owner@genkitcg.app',
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

  // Create staff user with password from environment
  const staffPassword = await bcrypt.hash(staffPasswordPlain, 12);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@genkitcg.app' },
    update: {},
    create: {
      email: 'staff@genkitcg.app',
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

  // Create 10 test players with secure random passwords
  const playerCredentials: Array<{ email: string; password: string }> = [];

  for (let i = 1; i <= 10; i++) {
    const playerPasswordPlain = generateSecurePassword();
    const playerPassword = await bcrypt.hash(playerPasswordPlain, 12);
    const player = await prisma.user.upsert({
      where: { email: `player${i}@test.com` },
      update: {},
      create: {
        email: `player${i}@test.com`,
        name: `Player ${i}`,
        passwordHash: playerPassword,
      },
    });

    playerCredentials.push({
      email: `player${i}@test.com`,
      password: playerPasswordPlain,
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
      name: 'Friday Night One Piece TCG',
      game: 'ONE_PIECE_TCG',
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

  // Create current season
  const currentSeasonStart = new Date();
  currentSeasonStart.setMonth(currentSeasonStart.getMonth() - 1); // Started last month
  const currentSeasonEnd = new Date();
  currentSeasonEnd.setMonth(currentSeasonEnd.getMonth() + 2); // Ends in 2 months

  // Check if season already exists
  let currentSeason = await prisma.season.findFirst({
    where: {
      orgId: genkiOrg.id,
      name: '2025 Q1',
    },
  });

  if (!currentSeason) {
    currentSeason = await prisma.season.create({
      data: {
        orgId: genkiOrg.id,
        name: '2025 Q1',
        startDate: currentSeasonStart,
        endDate: currentSeasonEnd,
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ Created active season:', currentSeason.name);

  // Create rating data for players across different game types
  const gameTypes = ['ONE_PIECE_TCG', 'AZUKI_TCG', 'RIFTBOUND'] as const;

  // Define realistic rating distributions (Top players, mid-tier, beginners)
  const ratingProfiles = [
    { name: 'Elite', rating: 2100, rd: 80, matches: 50, winRate: 0.75 },
    { name: 'Expert', rating: 1950, rd: 100, matches: 40, winRate: 0.68 },
    { name: 'Advanced', rating: 1800, rd: 120, matches: 35, winRate: 0.62 },
    { name: 'Intermediate', rating: 1650, rd: 140, matches: 30, winRate: 0.55 },
    { name: 'Developing', rating: 1550, rd: 160, matches: 25, winRate: 0.50 },
    { name: 'Beginner', rating: 1450, rd: 200, matches: 15, winRate: 0.42 },
    { name: 'Casual', rating: 1350, rd: 250, matches: 10, winRate: 0.35 },
    { name: 'Rookie', rating: 1300, rd: 300, matches: 5, winRate: 0.30 },
    { name: 'Novice', rating: 1250, rd: 320, matches: 8, winRate: 0.33 },
    { name: 'Learning', rating: 1200, rd: 340, matches: 6, winRate: 0.28 },
  ];

  // Get players again to ensure we have them all
  const players = await prisma.user.findMany({
    where: {
      email: {
        in: Array.from({ length: 10 }, (_, i) => `player${i + 1}@test.com`),
      },
    },
    orderBy: { email: 'asc' }, // Ensure consistent order for mapping to profiles
  });

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const profile = ratingProfiles[i];

    if (!profile) continue;

    for (const gameType of gameTypes) {
      // Add some variance per game type
      const variance = Math.random() * 100 - 50; // ±50 rating
      const adjustedRating = profile.rating + variance;
      const wins = Math.floor(profile.matches * profile.winRate);
      const losses = profile.matches - wins;

      // Create lifetime rating
      await prisma.playerCategoryLifetimeRating.upsert({
        where: {
          userId_orgId_category: {
            userId: player.id,
            orgId: genkiOrg.id,
            category: gameType,
          },
        },
        update: {},
        create: {
          userId: player.id,
          orgId: genkiOrg.id,
          category: gameType,
          rating: adjustedRating,
          ratingDeviation: profile.rd,
          volatility: 0.06,
          totalRatedMatches: profile.matches,
          matchWins: wins,
          matchLosses: losses,
          matchDraws: 0,
          lastMatchAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
        },
      });

      // Create seasonal rating (slightly different from lifetime)
      const seasonalVariance = Math.random() * 80 - 40; // ±40 rating
      const seasonalRating = adjustedRating + seasonalVariance;
      const seasonMatches = Math.floor(profile.matches * 0.6); // 60% of matches in current season
      const seasonWins = Math.floor(seasonMatches * profile.winRate);
      const seasonLosses = seasonMatches - seasonWins;

      await prisma.playerCategorySeasonRating.upsert({
        where: {
          userId_orgId_seasonId_category: {
            userId: player.id,
            orgId: genkiOrg.id,
            seasonId: currentSeason.id,
            category: gameType,
          },
        },
        update: {},
        create: {
          userId: player.id,
          orgId: genkiOrg.id,
          seasonId: currentSeason.id,
          category: gameType,
          rating: seasonalRating,
          ratingDeviation: profile.rd + 20, // Slightly higher RD for seasonal
          volatility: 0.06,
          totalRatedMatches: seasonMatches,
          matchWins: seasonWins,
          matchLosses: seasonLosses,
          matchDraws: 0,
          lastMatchAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // Within last 3 days
        },
      });
    }
  }

  console.log('✅ Created rating data for all players across 3 game types');
  console.log('   - Lifetime ratings with realistic Glicko-2 values');
  console.log('   - Seasonal ratings for current season');

  console.log('\n🎉 Seeding complete!');
  console.log('\n' + '='.repeat(80));
  console.log('📝 ADMIN CREDENTIALS');
  console.log('='.repeat(80));
  console.log(`\nOwner Account:\n  Email: owner@genkitcg.app\n  Password: (from OWNER_PASSWORD env)`);
  console.log(`\nStaff Account:\n  Email: staff@genkitcg.app\n  Password: (from STAFF_PASSWORD env)`);
  console.log('\nPlayer Accounts:');
  playerCredentials.forEach((cred, idx) => {
    console.log(`  ${idx + 1}. ${cred.email} / ${cred.password}`);
  });
  console.log(`\nOrganization Invite Code: GENKI`);
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  Player credentials are randomly generated - save them if needed!');
  console.log('='.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
