import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { GameType, MatchResult } from '@prisma/client';

// Glicko-2 constants
const TAU = 0.5; // System constant (volatility constraint)
const EPSILON = 0.000001; // Convergence tolerance

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // Glicko-2 Core Algorithm
  // ============================================================================

  /**
   * Converts Glicko-2 rating to Glicko-1 scale (for display)
   */
  private toGlicko1Rating(rating: number): number {
    return rating * 173.7178 + 1500;
  }

  /**
   * Converts Glicko-1 rating to Glicko-2 scale (for calculations)
   */
  private toGlicko2Rating(rating: number): number {
    return (rating - 1500) / 173.7178;
  }

  /**
   * Converts Glicko-1 RD to Glicko-2 scale
   */
  private toGlicko2RD(rd: number): number {
    return rd / 173.7178;
  }

  /**
   * Converts Glicko-2 RD to Glicko-1 scale
   */
  private toGlicko1RD(rd: number): number {
    return rd * 173.7178;
  }

  /**
   * G function: Reduces impact of high uncertainty opponents
   */
  private g(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  /**
   * E function: Expected score against an opponent
   */
  private E(mu: number, muOpponent: number, phiOpponent: number): number {
    return 1 / (1 + Math.exp(-this.g(phiOpponent) * (mu - muOpponent)));
  }

  /**
   * Calculate variance (v) based on match outcomes
   */
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

  /**
   * Calculate delta: Improvement estimate
   */
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

  /**
   * Determine new volatility using Illinois algorithm
   */
  private determineVolatility(
    v: number,
    delta: number,
    phi: number,
    sigma: number
  ): number {
    const deltaSq = delta * delta;
    const phiSq = phi * phi;
    const tauSq = TAU * TAU;

    // Step 5.2: Initialize
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

    // Step 5.3: Illinois algorithm
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

  /**
   * Illinois algorithm helper function
   */
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
   * Update player rating after matches
   */
  async updateRating(
    userId: string,
    orgId: string,
    gameType: GameType,
    matches: Array<{
      opponentId: string;
      opponentRating: number;
      opponentRD: number;
      result: MatchResult;
      eventId?: string;
      matchId?: string;
    }>
  ) {
    // Get or create player rating
    let playerRating = await this.prisma.playerRating.findUnique({
      where: {
        userId_orgId_gameType: {
          userId,
          orgId,
          gameType,
        },
      },
    });

    if (!playerRating) {
      playerRating = await this.prisma.playerRating.create({
        data: {
          userId,
          orgId,
          gameType,
          rating: 1500,
          ratingDeviation: 350,
          volatility: 0.06,
        },
      });
    }

    // Convert to Glicko-2 scale
    const mu = this.toGlicko2Rating(playerRating.rating);
    const phi = this.toGlicko2RD(playerRating.ratingDeviation);
    const sigma = playerRating.volatility;

    // Convert matches to Glicko-2 scale
    const glicko2Matches = matches.map((match) => ({
      muOpponent: this.toGlicko2Rating(match.opponentRating),
      phiOpponent: this.toGlicko2RD(match.opponentRD),
      score: this.getScore(match.result, userId, match.opponentId),
      opponentId: match.opponentId,
      opponentRating: match.opponentRating,
      result: match.result,
      eventId: match.eventId,
      matchId: match.matchId,
    }));

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
    const newRating = this.toGlicko1Rating(muNew);
    const newRD = this.toGlicko1RD(phiNew);

    // Calculate statistics
    const wins = glicko2Matches.filter((m) => m.score === 1).length;
    const losses = glicko2Matches.filter((m) => m.score === 0).length;
    const draws = glicko2Matches.filter((m) => m.score === 0.5).length;

    // Update player rating
    const updated = await this.prisma.playerRating.update({
      where: { id: playerRating.id },
      data: {
        rating: newRating,
        ratingDeviation: newRD,
        volatility: sigmaNew,
        matchesPlayed: { increment: matches.length },
        matchWins: { increment: wins },
        matchLosses: { increment: losses },
        matchDraws: { increment: draws },
        lastMatchAt: new Date(),
        lastUpdatedAt: new Date(),
        isProvisional: playerRating.matchesPlayed + matches.length < 30,
      },
    });

    // Create history entries
    for (const match of glicko2Matches) {
      await this.prisma.playerRatingHistory.create({
        data: {
          playerRatingId: playerRating.id,
          eventId: match.eventId,
          matchId: match.matchId,
          ratingBefore: playerRating.rating,
          ratingAfter: newRating,
          ratingChange: newRating - playerRating.rating,
          rdBefore: playerRating.ratingDeviation,
          rdAfter: newRD,
          volatilityBefore: sigma,
          volatilityAfter: sigmaNew,
          opponentId: match.opponentId,
          opponentRatingBefore: match.opponentRating,
          matchResult: match.result,
        },
      });
    }

    return updated;
  }

  /**
   * Get score from match result (1 = win, 0.5 = draw, 0 = loss)
   */
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
  // Rating Queries
  // ============================================================================

  /**
   * Get leaderboard for an organization and game type
   */
  async getLeaderboard(
    orgId: string,
    gameType: GameType,
    options?: {
      limit?: number;
      offset?: number;
      includeProvisional?: boolean;
    }
  ) {
    const { limit = 50, offset = 0, includeProvisional = true } = options || {};

    const where = {
      orgId,
      gameType,
      ...(includeProvisional ? {} : { isProvisional: false }),
    };

    const [ratings, total] = await Promise.all([
      this.prisma.playerRating.findMany({
        where,
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
      this.prisma.playerRating.count({ where }),
    ]);

    return {
      ratings: ratings.map((r, index) => ({
        rank: offset + index + 1,
        userId: r.userId,
        userName: r.user.name,
        userAvatar: r.user.avatarUrl,
        rating: Math.round(r.rating),
        ratingDeviation: Math.round(r.ratingDeviation),
        volatility: r.volatility,
        matchesPlayed: r.matchesPlayed,
        matchWins: r.matchWins,
        matchLosses: r.matchLosses,
        matchDraws: r.matchDraws,
        winRate:
          r.matchesPlayed > 0
            ? ((r.matchWins / r.matchesPlayed) * 100).toFixed(1)
            : '0.0',
        isProvisional: r.isProvisional,
        lastMatchAt: r.lastMatchAt,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get player rating history
   */
  async getPlayerHistory(
    userId: string,
    orgId: string,
    gameType: GameType,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const { limit = 50, offset = 0 } = options || {};

    const playerRating = await this.prisma.playerRating.findUnique({
      where: {
        userId_orgId_gameType: {
          userId,
          orgId,
          gameType,
        },
      },
    });

    if (!playerRating) {
      throw new NotFoundException('Player rating not found');
    }

    const [history, total] = await Promise.all([
      this.prisma.playerRatingHistory.findMany({
        where: { playerRatingId: playerRating.id },
        include: {
          opponent: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          event: {
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
      this.prisma.playerRatingHistory.count({
        where: { playerRatingId: playerRating.id },
      }),
    ]);

    return {
      currentRating: {
        rating: Math.round(playerRating.rating),
        ratingDeviation: Math.round(playerRating.ratingDeviation),
        volatility: playerRating.volatility,
        matchesPlayed: playerRating.matchesPlayed,
        isProvisional: playerRating.isProvisional,
      },
      history: history.map((h) => ({
        id: h.id,
        eventName: h.event?.name,
        opponentName: h.opponent.name,
        opponentAvatar: h.opponent.avatarUrl,
        opponentRating: Math.round(h.opponentRatingBefore),
        result: h.matchResult,
        ratingBefore: Math.round(h.ratingBefore),
        ratingAfter: Math.round(h.ratingAfter),
        ratingChange: Math.round(h.ratingChange),
        calculatedAt: h.calculatedAt,
      })),
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get player rating
   */
  async getPlayerRating(userId: string, orgId: string, gameType: GameType) {
    const playerRating = await this.prisma.playerRating.findUnique({
      where: {
        userId_orgId_gameType: {
          userId,
          orgId,
          gameType,
        },
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
    });

    if (!playerRating) {
      throw new NotFoundException('Player rating not found');
    }

    return {
      userId: playerRating.userId,
      userName: playerRating.user.name,
      userAvatar: playerRating.user.avatarUrl,
      rating: Math.round(playerRating.rating),
      ratingDeviation: Math.round(playerRating.ratingDeviation),
      volatility: playerRating.volatility,
      matchesPlayed: playerRating.matchesPlayed,
      matchWins: playerRating.matchWins,
      matchLosses: playerRating.matchLosses,
      matchDraws: playerRating.matchDraws,
      winRate:
        playerRating.matchesPlayed > 0
          ? ((playerRating.matchWins / playerRating.matchesPlayed) * 100).toFixed(1)
          : '0.0',
      isProvisional: playerRating.isProvisional,
      lastMatchAt: playerRating.lastMatchAt,
    };
  }
}
