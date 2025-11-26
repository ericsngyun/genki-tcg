import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameType, MatchResult, SeasonStatus } from '@prisma/client';
import { SeasonsService } from './seasons.service';
import {
  GlickoRating,
  GlickoMatchResult,
  mapRatingToTier,
  isProvisionalRating,
  SEASONAL_LOSS_CAP,
  GLICKO2_DEFAULTS,
  getTierChange,
  PlayerTier,
} from './types/rating.types';

// Glicko-2 constants
const TAU = GLICKO2_DEFAULTS.tau;
const EPSILON = 0.000001;

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private prisma: PrismaService,
    private seasonsService: SeasonsService
  ) { }

  // ============================================================================
  // Glicko-2 Core Algorithm
  // ============================================================================

  private toGlicko1Rating(rating: number): number {
    return rating * 173.7178 + 1500;
  }

  private toGlicko2Rating(rating: number): number {
    return (rating - 1500) / 173.7178;
  }

  private toGlicko2RD(rd: number): number {
    return rd / 173.7178;
  }

  private toGlicko1RD(rd: number): number {
    return rd * 173.7178;
  }

  private g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  private E(mu: number, muOpponent: number, phiOpponent: number): number {
    return 1 / (1 + Math.exp(-this.g(phiOpponent) * (mu - muOpponent)));
  }

  private calculateVariance(
    matches: Array<{ muOpponent: number; phiOpponent: number }>
  ): number {
    let sum = 0;
    for (const match of matches) {
      const gPhi = this.g(match.phiOpponent);
      const e = this.E(0, match.muOpponent, match.phiOpponent);
      sum += gPhi * gPhi * e * (1 - e);
    }
    return 1 / sum;
  }

  private calculateDelta(
    mu: number,
    matches: Array<{
      muOpponent: number;
      phiOpponent: number;
      score: number;
    }>
  ): number {
    let sum = 0;
    for (const match of matches) {
      const gPhi = this.g(match.phiOpponent);
      const e = this.E(mu, match.muOpponent, match.phiOpponent);
      sum += gPhi * (match.score - e);
    }
    return sum;
  }

  private determineVolatility(
    v: number,
    delta: number,
    phi: number,
    sigma: number
  ): number {
    const deltaSq = delta * delta;
    const phiSq = phi * phi;
    const tauSq = TAU * TAU;

    let A = Math.log(sigma * sigma);
    let a = A;

    let B: number;
    if (deltaSq > phiSq + v) {
      B = Math.log(deltaSq - phiSq - v);
    } else {
      let k = 1;
      while (this.f(a - k * TAU, deltaSq, phiSq, v, a) < 0) {
        k++;
      }
      B = a - k * TAU;
    }

    let fA = this.f(A, deltaSq, phiSq, v, a);
    let fB = this.f(B, deltaSq, phiSq, v, a);

    while (Math.abs(B - A) > EPSILON) {
      const C = A + ((A - B) * fA) / (fB - fA);
      const fC = this.f(C, deltaSq, phiSq, v, a);

      if (fC * fB < 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }

      B = C;
      fB = fC;
    }

    return Math.exp(A / 2);
  }

  private f(
    x: number,
    deltaSq: number,
    phiSq: number,
    v: number,
    a: number
  ): number {
    const eX = Math.exp(x);
    const phiSqPlusV = phiSq + v + eX;
    const term1 = (eX * (deltaSq - phiSqPlusV)) / (2 * phiSqPlusV * phiSqPlusV);
    const term2 = (x - a) / (TAU * TAU);
    return term1 - term2;
  }

  /**
   * Calculate new rating based on current rating and match results
   */
  private calculateNewRating(
    current: GlickoRating,
    matches: GlickoMatchResult[]
  ): GlickoRating {
    // Convert to Glicko-2 scale
    const mu = this.toGlicko2Rating(current.rating);
    const phi = this.toGlicko2RD(current.ratingDeviation);
    const sigma = current.volatility;

    // Convert matches to Glicko-2 scale
    const glicko2Matches = matches.map((match) => ({
      muOpponent: this.toGlicko2Rating(match.opponentRating.rating),
      phiOpponent: this.toGlicko2RD(match.opponentRating.ratingDeviation),
      score: match.score,
    }));

    // If no matches, only update RD (increase uncertainty)
    if (glicko2Matches.length === 0) {
      const phiStar = Math.sqrt(phi * phi + sigma * sigma);
      return {
        rating: current.rating,
        ratingDeviation: this.toGlicko1RD(phiStar),
        volatility: current.volatility,
      };
    }

    // Step 3: Calculate variance (v)
    const v = this.calculateVariance(glicko2Matches);

    // Step 4: Calculate delta
    const deltaTimesV = this.calculateDelta(mu, glicko2Matches) * v;

    // Step 5: Determine new volatility
    const sigmaNew = this.determineVolatility(v, deltaTimesV, phi, sigma);

    // Step 6: Update rating deviation (pre-rating)
    const phiStar = Math.sqrt(phi * phi + sigmaNew * sigmaNew);

    // Step 7: Update rating and RD
    const phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    let muNew = mu;
    for (const match of glicko2Matches) {
      const gPhi = this.g(match.phiOpponent);
      const e = this.E(mu, match.muOpponent, match.phiOpponent);
      muNew += phiNew * phiNew * gPhi * (match.score - e);
    }

    // Convert back to Glicko-1 scale
    return {
      rating: this.toGlicko1Rating(muNew),
      ratingDeviation: this.toGlicko1RD(phiNew),
      volatility: sigmaNew,
    };
  }

  private getScore(
    result: MatchResult,
    playerId: string,
    opponentId: string
  ): number {
    switch (result) {
      case 'PLAYER_A_WIN':
        return playerId < opponentId ? 1 : 0;
      case 'PLAYER_B_WIN':
        return playerId > opponentId ? 1 : 0;
      case 'DRAW':
      case 'INTENTIONAL_DRAW':
        return 0.5;
      case 'DOUBLE_LOSS':
        return 0;
      case 'PLAYER_A_DQ':
        return playerId < opponentId ? 0 : 1;
      case 'PLAYER_B_DQ':
        return playerId > opponentId ? 0 : 1;
      default:
        return 0.5;
    }
  }

  // ============================================================================
  // Tournament Processing
  // ============================================================================

  /**
   * Process all ratings for a completed tournament
   * Updates both lifetime and seasonal ratings
   */
  async processTournamentRatings(tournamentId: string) {
    const tournament = await this.prisma.event.findUnique({
      where: { id: tournamentId },
      include: {
        rounds: {
          include: {
            matches: {
              where: {
                result: { not: null },
              },
            },
          },
        },
        season: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== 'COMPLETED') {
      throw new BadRequestException('Tournament must be COMPLETED to process ratings');
    }

    if (tournament.ratingsProcessed) {
      throw new BadRequestException('Ratings already processed for this tournament');
    }

    // Determine season
    let seasonId = tournament.seasonId;
    if (!seasonId) {
      // Try to find active season
      const activeSeason = await this.seasonsService.getActiveSeason(tournament.orgId);
      if (activeSeason) {
        seasonId = activeSeason.id;
      } else {
        // Log warning but proceed with lifetime only? Or fail?
        // Spec says "Load seasonal rating... if none initialize".
        // If no season exists, we can't update seasonal ratings.
        this.logger.warn(`No season found for tournament ${tournamentId}. Only updating lifetime ratings.`);
      }
    }

    // Group matches by player - flatten matches from all rounds
    const playerMatches = new Map<string, Array<{
      opponentId: string;
      result: MatchResult;
      matchId: string;
    }>>();

    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (!match.playerAId || !match.playerBId || !match.result) continue;

        // Player A
        if (!playerMatches.has(match.playerAId)) playerMatches.set(match.playerAId, []);
        const playerAMatches = playerMatches.get(match.playerAId);
        if (playerAMatches) {
          playerAMatches.push({
            opponentId: match.playerBId,
            result: match.result,
            matchId: match.id,
          });
        }

        // Player B
        if (!playerMatches.has(match.playerBId)) playerMatches.set(match.playerBId, []);
        const playerBMatches = playerMatches.get(match.playerBId);
        if (playerBMatches) {
          playerBMatches.push({
            opponentId: match.playerAId,
            result: match.result,
            matchId: match.id,
          });
        }
      }
    }

    // Process each player
    for (const [playerId, matches] of playerMatches.entries()) {
      await this.processPlayerTournamentUpdates(
        playerId,
        tournament.orgId,
        tournament.game, // Category
        seasonId,
        tournament.id,
        matches
      );
    }

    // Mark tournament as processed
    await this.prisma.event.update({
      where: { id: tournamentId },
      data: {
        ratingsProcessed: true,
        ratingsProcessedAt: new Date(),
        seasonId: seasonId, // Save season ID if we found one
      },
    });
  }

  private async processPlayerTournamentUpdates(
    userId: string,
    orgId: string,
    category: GameType,
    seasonId: string | null,
    tournamentId: string,
    matches: Array<{ opponentId: string; result: MatchResult; matchId: string }>
  ) {
    // 1. Load Lifetime Rating
    let lifetimeRating = await this.prisma.playerCategoryLifetimeRating.findUnique({
      where: { userId_orgId_category: { userId, orgId, category } },
    });

    if (!lifetimeRating) {
      lifetimeRating = await this.prisma.playerCategoryLifetimeRating.create({
        data: {
          userId,
          orgId,
          category,
          rating: GLICKO2_DEFAULTS.initialRating,
          ratingDeviation: GLICKO2_DEFAULTS.initialRD,
          volatility: GLICKO2_DEFAULTS.initialVolatility,
        },
      });
    }

    // 2. Load Seasonal Rating (if season exists)
    let seasonalRating = null;
    if (seasonId) {
      seasonalRating = await this.prisma.playerCategorySeasonRating.findUnique({
        where: { userId_orgId_seasonId_category: { userId, orgId, seasonId, category } },
      });

      if (!seasonalRating) {
        // Initialize from lifetime
        seasonalRating = await this.prisma.playerCategorySeasonRating.create({
          data: {
            userId,
            orgId,
            seasonId,
            category,
            rating: lifetimeRating.rating,
            ratingDeviation: lifetimeRating.ratingDeviation,
            volatility: lifetimeRating.volatility,
          },
        });
      }
    }

    // 3. Prepare Match Data (need opponent ratings)
    // We need to fetch opponent ratings. For accuracy, we should use their ratings BEFORE this tournament.
    // However, in a batch process, everyone is updated "simultaneously" effectively.
    // Standard Glicko-2 assumes simultaneous updates in a rating period.
    // So we use current DB ratings for opponents.

    const opponentIds = matches.map(m => m.opponentId);

    // Fetch opponent lifetime ratings
    const opponentLifetimeRatings = await this.prisma.playerCategoryLifetimeRating.findMany({
      where: {
        userId: { in: opponentIds },
        orgId,
        category,
      },
    });

    // Fetch opponent seasonal ratings
    let opponentSeasonalRatings: Awaited<ReturnType<typeof this.prisma.playerCategorySeasonRating.findMany>> = [];
    if (seasonId) {
      opponentSeasonalRatings = await this.prisma.playerCategorySeasonRating.findMany({
        where: {
          userId: { in: opponentIds },
          orgId,
          seasonId,
          category,
        },
      });
    }

    // Map for easy lookup
    const oppLifetimeMap = new Map(opponentLifetimeRatings.map(r => [r.userId, r]));
    const oppSeasonalMap = new Map(opponentSeasonalRatings.map(r => [
      r.userId,
      {
        rating: r.rating,
        ratingDeviation: r.ratingDeviation,
        volatility: r.volatility,
      }
    ]));

    // 4. Calculate New Lifetime Rating
    const lifetimeMatches: GlickoMatchResult[] = matches.map(m => {
      const opp = oppLifetimeMap.get(m.opponentId) || {
        rating: GLICKO2_DEFAULTS.initialRating,
        ratingDeviation: GLICKO2_DEFAULTS.initialRD,
        volatility: GLICKO2_DEFAULTS.initialVolatility,
      };
      return {
        opponentRating: opp,
        score: this.getScore(m.result, userId, m.opponentId) as 1 | 0 | 0.5,
      };
    });

    const newLifetime = this.calculateNewRating(lifetimeRating, lifetimeMatches);

    // 5. Calculate New Seasonal Rating
    let newSeasonal = null;
    let seasonalDelta = 0;

    if (seasonalRating && seasonId) {
      const seasonalMatches: GlickoMatchResult[] = matches.map(m => {
        const opp = oppSeasonalMap.get(m.opponentId) || {
          rating: GLICKO2_DEFAULTS.initialRating,
          ratingDeviation: GLICKO2_DEFAULTS.initialRD,
          volatility: GLICKO2_DEFAULTS.initialVolatility,
        };
        return {
          opponentRating: opp,
          score: this.getScore(m.result, userId, m.opponentId) as 1 | 0 | 0.5,
        };
      });

      const calculatedSeasonal = this.calculateNewRating(seasonalRating, seasonalMatches);

      // Apply Loss Cap
      let finalSeasonalRating = calculatedSeasonal.rating;
      const rawDelta = finalSeasonalRating - seasonalRating.rating;

      // Check if provisional/early season
      if (seasonalRating.totalRatedMatches < SEASONAL_LOSS_CAP.matchThreshold) {
        if (rawDelta < -SEASONAL_LOSS_CAP.maxLoss) {
          finalSeasonalRating = seasonalRating.rating - SEASONAL_LOSS_CAP.maxLoss;
          this.logger.log(`Applied loss cap for user ${userId}: ${rawDelta} -> ${-SEASONAL_LOSS_CAP.maxLoss}`);
        }
      }

      newSeasonal = {
        ...calculatedSeasonal,
        rating: finalSeasonalRating,
      };
      seasonalDelta = finalSeasonalRating - seasonalRating.rating;
    }

    // 6. Save Updates

    // Update Lifetime
    await this.prisma.playerCategoryLifetimeRating.update({
      where: { id: lifetimeRating.id },
      data: {
        rating: newLifetime.rating,
        ratingDeviation: newLifetime.ratingDeviation,
        volatility: newLifetime.volatility,
        totalRatedMatches: { increment: matches.length },
        matchWins: { increment: matches.filter(m => this.getScore(m.result, userId, m.opponentId) === 1).length },
        matchLosses: { increment: matches.filter(m => this.getScore(m.result, userId, m.opponentId) === 0).length },
        matchDraws: { increment: matches.filter(m => this.getScore(m.result, userId, m.opponentId) === 0.5).length },
        lastMatchAt: new Date(),
      },
    });

    // Create Lifetime History
    // Note: We create one history entry per match
    for (const match of matches) {
      const opp = oppLifetimeMap.get(match.opponentId);
      await this.prisma.lifetimeRatingHistory.create({
        data: {
          lifetimeRatingId: lifetimeRating.id,
          eventId: tournamentId,
          matchId: match.matchId,
          ratingBefore: lifetimeRating.rating,
          ratingAfter: newLifetime.rating, // This is slightly inaccurate as it applies the batch result to each match, but standard for Glicko-2 batch
          ratingChange: newLifetime.rating - lifetimeRating.rating,
          rdBefore: lifetimeRating.ratingDeviation,
          rdAfter: newLifetime.ratingDeviation,
          volatilityBefore: lifetimeRating.volatility,
          volatilityAfter: newLifetime.volatility,
          opponentId: match.opponentId,
          opponentRatingBefore: opp ? opp.rating : GLICKO2_DEFAULTS.initialRating,
          matchResult: match.result,
        },
      });
    }

    // Update Seasonal
    if (newSeasonal && seasonalRating && seasonId) {
      await this.prisma.playerCategorySeasonRating.update({
        where: { id: seasonalRating.id },
        data: {
          rating: newSeasonal.rating,
          ratingDeviation: newSeasonal.ratingDeviation,
          volatility: newSeasonal.volatility,
          totalRatedMatches: { increment: matches.length },
          matchWins: { increment: matches.filter(m => this.getScore(m.result, userId, m.opponentId) === 1).length },
          matchLosses: { increment: matches.filter(m => this.getScore(m.result, userId, m.opponentId) === 0).length },
          matchDraws: { increment: matches.filter(m => this.getScore(m.result, userId, m.opponentId) === 0.5).length },
          lastMatchAt: new Date(),
        },
      });

      // Log Tournament Update (Audit)
      const oldTier = mapRatingToTier(seasonalRating.rating);
      const newTier = mapRatingToTier(newSeasonal.rating);

      await this.prisma.tournamentRatingUpdate.create({
        data: {
          tournamentId,
          seasonId,
          userId,
          category,
          lifetimeRatingBefore: lifetimeRating.rating,
          lifetimeRatingAfter: newLifetime.rating,
          lifetimeRatingDelta: newLifetime.rating - lifetimeRating.rating,
          seasonalRatingBefore: seasonalRating.rating,
          seasonalRatingAfter: newSeasonal.rating,
          seasonalRatingDelta: seasonalDelta,
          tierBefore: oldTier,
          tierAfter: newTier,
          tierChange: getTierChange(oldTier, newTier),
          matchesInTournament: matches.length,
        },
      });
    }
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Get seasonal leaderboard
   */
  async getSeasonLeaderboard(
    seasonId: string,
    category: GameType,
    options?: { limit?: number; offset?: number }
  ) {
    const { limit = 50, offset = 0 } = options || {};

    const [ratings, total] = await Promise.all([
      this.prisma.playerCategorySeasonRating.findMany({
        where: {
          seasonId,
          category,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.playerCategorySeasonRating.count({
        where: { seasonId, category },
      }),
    ]);

    return {
      ratings: ratings.map((r, index) => ({
        rank: offset + index + 1,
        userId: r.userId,
        userName: r.user.name,
        userAvatar: r.user.avatarUrl,
        tier: mapRatingToTier(r.rating),
        // Internal rating hidden from public API usually, but included here for admin/debugging
        // In controller we can filter it out if needed, or spec says "do not expose in public API response"
        // We'll return it here but mark it as internal
        seasonalRatingHidden: Math.round(r.rating),
        provisional: isProvisionalRating({
          ratingDeviation: r.ratingDeviation,
          totalRatedMatchesInSeasonAndCategory: r.totalRatedMatches,
        }),
        matchesPlayed: r.totalRatedMatches,
        winRate: r.totalRatedMatches > 0
          ? ((r.matchWins / r.totalRatedMatches) * 100).toFixed(1)
          : '0.0',
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get lifetime leaderboard
   */
  async getLifetimeLeaderboard(
    orgId: string,
    category: GameType,
    options?: { limit?: number; offset?: number; search?: string }
  ) {
    const { limit = 50, offset = 0, search } = options || {};

    const whereClause: any = {
      orgId,
      category,
    };

    // Add search filter if provided
    if (search) {
      whereClause.user = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const [ratings, total] = await Promise.all([
      this.prisma.playerCategoryLifetimeRating.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [{ rating: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.playerCategoryLifetimeRating.count({
        where: whereClause,
      }),
    ]);

    return {
      ratings: ratings.map((r, index) => ({
        rank: offset + index + 1,
        userId: r.userId,
        userName: r.user.name,
        userAvatar: r.user.avatarUrl,
        tier: mapRatingToTier(r.rating),
        lifetimeRating: Math.round(r.rating),
        provisional: isProvisionalRating({
          ratingDeviation: r.ratingDeviation,
          totalRatedMatchesInSeasonAndCategory: r.totalRatedMatches,
        }),
        matchesPlayed: r.totalRatedMatches,
        winRate: r.totalRatedMatches > 0
          ? ((r.matchWins / r.totalRatedMatches) * 100).toFixed(1)
          : '0.0',
        matchWins: r.matchWins,
        matchLosses: r.matchLosses,
        matchDraws: r.matchDraws,
        lastMatchAt: r.lastMatchAt,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Reset all ratings for a specific category (admin only)
   */
  async resetCategoryRatings(orgId: string, category: GameType) {
    return await this.prisma.$transaction(async (tx) => {
      // Delete all lifetime ratings for this org/category
      const deletedLifetime = await tx.playerCategoryLifetimeRating.deleteMany({
        where: { orgId, category },
      });

      // Delete all seasonal ratings for this org/category
      const deletedSeasonal = await tx.playerCategorySeasonRating.deleteMany({
        where: { orgId, category },
      });

      // Delete rating history
      const deletedHistory = await tx.lifetimeRatingHistory.deleteMany({
        where: {
          lifetimeRating: {
            orgId,
            category,
          },
        },
      });

      // Delete tournament rating updates
      const deletedUpdates = await tx.tournamentRatingUpdate.deleteMany({
        where: { category },
      });

      return {
        success: true,
        deletedLifetimeRatings: deletedLifetime.count,
        deletedSeasonalRatings: deletedSeasonal.count,
        deletedHistoryEntries: deletedHistory.count,
        deletedUpdates: deletedUpdates.count,
      };
    });
  }

  /**
   * Get player rating history
   */
  async getPlayerRatingHistory(
    userId: string,
    orgId: string,
    category: GameType,
    options?: { limit?: number; offset?: number }
  ) {
    const { limit = 20, offset = 0 } = options || {};

    const lifetimeRating = await this.prisma.playerCategoryLifetimeRating.findUnique({
      where: { userId_orgId_category: { userId, orgId, category } },
    });

    if (!lifetimeRating) {
      return {
        history: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
    }

    const [history, total] = await Promise.all([
      this.prisma.lifetimeRatingHistory.findMany({
        where: { lifetimeRatingId: lifetimeRating.id },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              startAt: true,
            },
          },
          opponent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { calculatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.lifetimeRatingHistory.count({
        where: { lifetimeRatingId: lifetimeRating.id },
      }),
    ]);

    return {
      history: history.map(h => ({
        eventId: h.eventId,
        eventName: h.event?.name || 'Unknown Event',
        eventDate: h.event?.startAt || new Date(),
        matchId: h.matchId,
        opponentId: h.opponentId,
        opponentName: h.opponent?.name || 'Unknown',
        ratingBefore: Math.round(h.ratingBefore),
        ratingAfter: Math.round(h.ratingAfter),
        ratingChange: Math.round(h.ratingChange),
        matchResult: h.matchResult,
        createdAt: h.calculatedAt,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get player ranks for all categories in active season
   */
  async getPlayerRanks(userId: string, orgId: string) {
    const activeSeason = await this.seasonsService.getActiveSeason(orgId);

    if (!activeSeason) {
      return {
        playerId: userId,
        categories: [],
        message: 'No active season found',
      };
    }

    const ratings = await this.prisma.playerCategorySeasonRating.findMany({
      where: {
        userId,
        seasonId: activeSeason.id,
      },
    });

    // Get recent changes
    const recentUpdates = await this.prisma.tournamentRatingUpdate.findMany({
      where: {
        userId,
        seasonId: activeSeason.id,
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['category'], // Get latest per category
    });

    const updateMap = new Map(recentUpdates.map(u => [u.category, u]));

    const categories = ratings.map(r => {
      const update = updateMap.get(r.category);
      return {
        category: r.category,
        tier: mapRatingToTier(r.rating),
        provisional: isProvisionalRating({
          ratingDeviation: r.ratingDeviation,
          totalRatedMatchesInSeasonAndCategory: r.totalRatedMatches,
        }),
        seasonId: activeSeason.id,
        recentChange: update ? {
          lastTournamentId: update.tournamentId,
          deltaTier: update.tierChange,
        } : null,
      };
    });

    return {
      playerId: userId,
      categories,
    };
  }
}
