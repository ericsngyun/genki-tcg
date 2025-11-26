import { GameType } from '@prisma/client';

/**
 * Category alias for external API consistency
 * Internally maps to GameType enum from Prisma
 */
export type Category = GameType;

/**
 * Player tiers based on seasonal rating
 * Players only see tiers, never numeric ratings
 */
export type PlayerTier =
    | 'SPROUT'
    | 'BRONZE'
    | 'SILVER'
    | 'GOLD'
    | 'PLATINUM'
    | 'DIAMOND'
    | 'GENKI';

/**
 * Tier thresholds configuration
 * Based on seasonal rating (Glicko-2 scale)
 */
export const TIER_THRESHOLDS = {
    SPROUT: { min: 0, max: 1299 },
    BRONZE: { min: 1300, max: 1449 },
    SILVER: { min: 1450, max: 1599 },
    GOLD: { min: 1600, max: 1749 },
    PLATINUM: { min: 1750, max: 1899 },
    DIAMOND: { min: 1900, max: 2099 },
    GENKI: { min: 2100, max: Infinity },
} as const;

/**
 * Map a Glicko-2 rating to its corresponding tier
 * @param rating - Player's seasonal rating
 * @returns The tier the player belongs to
 */
export function mapRatingToTier(rating: number): PlayerTier {
    if (rating < 1300) return 'SPROUT';
    if (rating < 1450) return 'BRONZE';
    if (rating < 1600) return 'SILVER';
    if (rating < 1750) return 'GOLD';
    if (rating < 1900) return 'PLATINUM';
    if (rating < 2100) return 'DIAMOND';
    return 'GENKI';
}

/**
 * Glicko-2 internal rating representation
 * Reference: http://www.glicko.net/glicko/glicko2.pdf
 */
export interface GlickoRating {
    rating: number; // μ (mu) - player's rating
    ratingDeviation: number; // φ (phi) - rating reliability/uncertainty
    volatility: number; // σ (sigma) - rating consistency
}

/**
 * Match result for Glicko-2 calculations
 */
export interface GlickoMatchResult {
    opponentRating: GlickoRating;
    score: 1 | 0 | 0.5; // win=1, loss=0, draw=0.5
}

/**
 * Input for determining provisional rating status
 */
export interface ProvisionalCheckInput {
    ratingDeviation: number;
    totalRatedMatchesInSeasonAndCategory: number;
}

/**
 * Determine if a rating should be considered provisional
 * Provisional players receive special protection (loss caps)
 *
 * @param input - Rating deviation and match count
 * @returns true if provisional, false otherwise
 */
export function isProvisionalRating(input: ProvisionalCheckInput): boolean {
    const PROVISIONAL_RD_THRESHOLD = 120;
    const PROVISIONAL_MATCH_THRESHOLD = 15;

    return (
        input.ratingDeviation > PROVISIONAL_RD_THRESHOLD ||
        input.totalRatedMatchesInSeasonAndCategory < PROVISIONAL_MATCH_THRESHOLD
    );
}

/**
 * Seasonal loss cap configuration
 * Protects new/provisional players from large rating drops early in season
 */
export const SEASONAL_LOSS_CAP = {
    matchThreshold: 15, // Apply cap if player has fewer than this many matches this season
    maxLoss: 75, // Maximum rating points that can be lost per tournament
} as const;

/**
 * Glicko-2 system constants
 */
export const GLICKO2_DEFAULTS = {
    initialRating: 1500,
    initialRD: 350,
    minRD: 50,
    initialVolatility: 0.06,
    tau: 0.5, // System volatility constraint
} as const;

/**
 * Tier change direction
 */
export type TierChangeDirection = 'UP' | 'DOWN' | 'SAME';

/**
 * Calculate tier change direction
 */
export function getTierChange(
    oldTier: PlayerTier,
    newTier: PlayerTier
): TierChangeDirection {
    const tierRank: Record<PlayerTier, number> = {
        SPROUT: 0,
        BRONZE: 1,
        SILVER: 2,
        GOLD: 3,
        PLATINUM: 4,
        DIAMOND: 5,
        GENKI: 6,
    };

    const oldRank = tierRank[oldTier];
    const newRank = tierRank[newTier];

    if (newRank > oldRank) return 'UP';
    if (newRank < oldRank) return 'DOWN';
    return 'SAME';
}
