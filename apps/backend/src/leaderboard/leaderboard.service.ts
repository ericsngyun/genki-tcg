import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameType } from '@prisma/client';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLifetimeLeaderboard(
    gameType: GameType,
    limit: number = 100,
    offset: number = 0,
  ) {
    this.logger.log(`Querying lifetime ratings for ${gameType}`);

    // Get ratings ordered by rating descending (highest first)
    const ratings = await this.prisma.playerCategoryLifetimeRating.findMany({
      where: {
        category: gameType,
        // Only include players with at least one rated match
        totalRatedMatches: {
          gte: 1,
        },
      },
      orderBy: {
        rating: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            discordUsername: true,
          },
        },
      },
    });

    // Transform the data for client consumption
    return ratings.map((entry) => ({
      userId: entry.userId,
      userName: entry.user.name || entry.user.discordUsername || 'Unknown Player',
      avatarUrl: entry.user.avatarUrl,
      lifetimeRating: entry.rating,
      ratingDeviation: entry.ratingDeviation,
      matchesPlayed: entry.totalRatedMatches,
      matchWins: entry.matchWins,
      matchLosses: entry.matchLosses,
      matchDraws: entry.matchDraws,
      lastMatchAt: entry.lastMatchAt,
    }));
  }
}
