import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async seed() {
    this.logger.log('🌱 Seeding database...');

    // Create Genki organization
    const genkiOrg = await this.prisma.organization.upsert({
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

    this.logger.log('✅ Created organization:', genkiOrg.name);

    // Create owner user
    const ownerPassword = await bcrypt.hash('password123', 12);
    const owner = await this.prisma.user.upsert({
      where: { email: 'owner@genki-tcg.com' },
      update: {},
      create: {
        email: 'owner@genki-tcg.com',
        name: 'Shop Owner',
        passwordHash: ownerPassword,
      },
    });

    await this.prisma.orgMembership.upsert({
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

    this.logger.log('✅ Created owner:', owner.email);

    // Create staff user
    const staffPassword = await bcrypt.hash('password123', 12);
    const staff = await this.prisma.user.upsert({
      where: { email: 'staff@genki-tcg.com' },
      update: {},
      create: {
        email: 'staff@genki-tcg.com',
        name: 'Staff Member',
        passwordHash: staffPassword,
      },
    });

    await this.prisma.orgMembership.upsert({
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

    this.logger.log('✅ Created staff:', staff.email);

    // Create 10 test players
    const players = [];
    for (let i = 1; i <= 10; i++) {
      const playerPassword = await bcrypt.hash('password123', 12);
      const player = await this.prisma.user.upsert({
        where: { email: `player${i}@test.com` },
        update: {},
        create: {
          email: `player${i}@test.com`,
          name: `Player ${i}`,
          passwordHash: playerPassword,
        },
      });

      await this.prisma.orgMembership.upsert({
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
      await this.prisma.creditLedgerEntry.create({
        data: {
          orgId: genkiOrg.id,
          userId: player.id,
          amount: 100,
          reasonCode: 'MANUAL_ADD',
          memo: 'Initial welcome credits',
          createdBy: owner.id,
        },
      });

      await this.prisma.creditBalance.upsert({
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

      players.push(player);
    }

    this.logger.log('✅ Created 10 test players with 100 credits each');

    // Create a sample event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const event = await this.prisma.event.create({
      data: {
        orgId: genkiOrg.id,
        name: 'Friday Night One Piece TCG',
        game: 'ONE_PIECE_TCG',
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

    this.logger.log('✅ Created sample event:', event.name);

    // Create current season
    const currentSeasonStart = new Date();
    currentSeasonStart.setMonth(currentSeasonStart.getMonth() - 1); // Started last month
    const currentSeasonEnd = new Date();
    currentSeasonEnd.setMonth(currentSeasonEnd.getMonth() + 2); // Ends in 2 months

    // Check if season already exists
    let currentSeason = await this.prisma.season.findFirst({
      where: {
        orgId: genkiOrg.id,
        name: '2025 Q1',
      },
    });

    if (!currentSeason) {
      currentSeason = await this.prisma.season.create({
        data: {
          orgId: genkiOrg.id,
          name: '2025 Q1',
          startDate: currentSeasonStart,
          endDate: currentSeasonEnd,
          status: 'ACTIVE',
        },
      });
    }

    this.logger.log('✅ Created active season:', currentSeason.name);

    // Create rating data for players across different game types
    const gameTypes: GameType[] = ['ONE_PIECE_TCG', 'AZUKI_TCG', 'RIFTBOUND'];

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

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const profile = ratingProfiles[i];

      for (const gameType of gameTypes) {
        // Add some variance per game type
        const variance = Math.random() * 100 - 50; // ±50 rating
        const adjustedRating = profile.rating + variance;
        const wins = Math.floor(profile.matches * profile.winRate);
        const losses = profile.matches - wins;

        // Create lifetime rating
        await this.prisma.playerCategoryLifetimeRating.upsert({
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

        await this.prisma.playerCategorySeasonRating.upsert({
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

    this.logger.log('✅ Created rating data for all players across 3 game types');
    this.logger.log('   - Lifetime ratings with realistic Glicko-2 values');
    this.logger.log('   - Seasonal ratings for current season');

    this.logger.log('🎉 Seeding complete!');

    return {
      organization: genkiOrg.name,
      owner: owner.email,
      staff: staff.email,
      players: players.length,
      event: event.name,
      season: currentSeason.name,
      ratings: {
        gameTypes: gameTypes.length,
        playersRated: players.length,
        totalRatings: players.length * gameTypes.length * 2, // Lifetime + Seasonal
      },
      credentials: {
        owner: 'owner@genki-tcg.com / password123',
        staff: 'staff@genki-tcg.com / password123',
        players: 'player1@test.com ... player10@test.com / password123',
        inviteCode: 'GENKI',
      },
      leaderboard: {
        topPlayer: `${players[0].name} - ~2100 rating`,
        categories: gameTypes.join(', '),
        note: 'Check /ratings/lifetime/ONE_PIECE_TCG or /ratings/seasonal/ONE_PIECE_TCG endpoints',
      },
    };
  }
}
