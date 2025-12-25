import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding 5 mock players...\n');

  // Get the Genki organization
  const genkiOrg = await prisma.organization.findUnique({
    where: { slug: 'genki' },
  });

  if (!genkiOrg) {
    throw new Error('Genki organization not found. Run seed script first.');
  }

  // Get owner user for credit entries
  const owner = await prisma.user.findUnique({
    where: { email: 'owner@genki-tcg.com' },
  });

  if (!owner) {
    throw new Error('Owner user not found. Run seed script first.');
  }

  // Get current season
  const currentSeason = await prisma.season.findFirst({
    where: {
      orgId: genkiOrg.id,
      status: 'ACTIVE',
    },
  });

  const playerNames = [
    'Akira Tanaka',
    'Sakura Yamamoto',
    'Kenji Watanabe',
    'Yuki Sato',
    'Hiro Nakamura',
  ];

  const gameTypes = ['ONE_PIECE_TCG', 'AZUKI_TCG', 'RIFTBOUND'] as const;

  // Rating profiles for variety
  const ratingProfiles = [
    { rating: 1700, rd: 130, matches: 28, winRate: 0.60 },
    { rating: 1600, rd: 150, matches: 22, winRate: 0.54 },
    { rating: 1500, rd: 180, matches: 18, winRate: 0.50 },
    { rating: 1400, rd: 220, matches: 12, winRate: 0.45 },
    { rating: 1550, rd: 170, matches: 20, winRate: 0.52 },
  ];

  const playerCredentials: Array<{ email: string; name: string; password: string }> = [];

  for (let i = 11; i <= 15; i++) {
    const playerIndex = i - 11;
    const playerPasswordPlain = `player${i}pass`; // Simple password for testing
    const playerPassword = await bcrypt.hash(playerPasswordPlain, 12);

    const player = await prisma.user.upsert({
      where: { email: `player${i}@test.com` },
      update: {},
      create: {
        email: `player${i}@test.com`,
        name: playerNames[playerIndex],
        passwordHash: playerPassword,
      },
    });

    playerCredentials.push({
      email: `player${i}@test.com`,
      name: playerNames[playerIndex],
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

    // Give each player 100 initial credits
    const existingLedger = await prisma.creditLedgerEntry.findFirst({
      where: {
        orgId: genkiOrg.id,
        userId: player.id,
        reasonCode: 'MANUAL_ADD',
        memo: 'Initial welcome credits',
      },
    });

    if (!existingLedger) {
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

    // Create ratings for each game type
    const profile = ratingProfiles[playerIndex];
    for (const gameType of gameTypes) {
      const variance = Math.random() * 100 - 50;
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
          lastMatchAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Create seasonal rating if season exists
      if (currentSeason) {
        const seasonalVariance = Math.random() * 80 - 40;
        const seasonalRating = adjustedRating + seasonalVariance;
        const seasonMatches = Math.floor(profile.matches * 0.6);
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
            ratingDeviation: profile.rd + 20,
            volatility: 0.06,
            totalRatedMatches: seasonMatches,
            matchWins: seasonWins,
            matchLosses: seasonLosses,
            matchDraws: 0,
            lastMatchAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    console.log(`✅ Created player: ${playerNames[playerIndex]} (${player.email})`);
  }

  console.log('\n🎉 Successfully added 5 mock players!\n');
  console.log('='.repeat(80));
  console.log('📝 NEW PLAYER CREDENTIALS');
  console.log('='.repeat(80));
  playerCredentials.forEach((cred) => {
    console.log(`  ${cred.name}`);
    console.log(`    Email: ${cred.email}`);
    console.log(`    Password: ${cred.password}\n`);
  });
  console.log('='.repeat(80));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
