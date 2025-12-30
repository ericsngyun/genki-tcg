import { GameType } from '@prisma/client';

/**
 * Category alias for external API consistency
 * Internally maps to GameType enum from Prisma
 */
export type Category = GameType;

/**
 * Player tiers based on seasonal rating
 * Players only see tiers, never numeric ratings
 *
 * SPROUT tier removed - all players start and stay at BRONZE minimum
 */
export type PlayerTier =
    | 'BRONZE'
    | 'SILVER'
    | 'GOLD'
    | 'PLATINUM'
    | 'DIAMOND'
    | 'GENKI';

/**
 * Tier thresholds configuration
 * Based on seasonal rating (Glicko-2 scale)
 *
 * Updated for better achievability:
 * - Lowered tier thresholds to make higher ranks achievable
 * - SPROUT tier removed - all players start at BRONZE (1200)
 * - Rating floor enforced at 1200 to prevent severe drops
 * - Designed so undefeated players can reach GOLD-PLATINUM
 */
export const TIER_THRESHOLDS = {
    BRONZE: { min: 1200, max: 1349 },
    SILVER: { min: 1350, max: 1549 },
    GOLD: { min: 1550, max: 1749 },
    PLATINUM: { min: 1750, max: 1949 },
    DIAMOND: { min: 1950, max: 2149 },
    GENKI: { min: 2150, max: Infinity },
} as const;

/**
 * Map a Glicko-2 rating to its corresponding tier
 * @param rating - Player's seasonal rating
 * @returns The tier the player belongs to
 *
 * Note: Minimum tier is BRONZE (1200) - ratings below 1200 are still shown as BRONZE
 */
export function mapRatingToTier(rating: number): PlayerTier {
    if (rating < 1350) return 'BRONZE'; // Floor at BRONZE, no SPROUT tier
    if (rating < 1550) return 'SILVER';
    if (rating < 1750) return 'GOLD';
    if (rating < 1950) return 'PLATINUM';
    if (rating < 2150) return 'DIAMOND';
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
 * Updated thresholds:
 * - Match threshold: 20 (up from 15) - Requires ~4 tournaments to establish rating
 * - Ensures tier represents consistent performance over time
 *
 * @param input - Rating deviation and match count
 * @returns true if provisional, false otherwise
 */
export function isProvisionalRating(input: ProvisionalCheckInput): boolean {
    const PROVISIONAL_RD_THRESHOLD = 120;
    const PROVISIONAL_MATCH_THRESHOLD = 20;

    return (
        input.ratingDeviation > PROVISIONAL_RD_THRESHOLD ||
        input.totalRatedMatchesInSeasonAndCategory < PROVISIONAL_MATCH_THRESHOLD
    );
}

/**
 * Seasonal loss cap configuration
 * Protects new/provisional players from large rating drops early in season
 *
 * Updated to match provisional threshold for consistency
 */
export const SEASONAL_LOSS_CAP = {
    matchThreshold: 20, // Apply cap if player has fewer than this many matches this season
    maxLoss: 75, // Maximum rating points that can be lost per tournament
} as const;

/**
 * Glicko-2 system constants
 *
 * Updated for better rank achievability:
 * - initialRating: 1300 - Players start in upper BRONZE tier
 * - initialRD: 300 - Higher volatility allows larger rating gains for new players
 * - minimumRating: 1200 - Floor to prevent severe rating drops
 * - Balanced to reward performance while maintaining fairness
 *
 * Expected progression:
 * - 5-0 tournament: ~+400 points (BRONZE → GOLD/PLATINUM)
 * - 4-1 tournament: ~+200-250 points (BRONZE → SILVER)
 * - 3-0 tournament: ~+300 points (BRONZE → GOLD)
 */
export const GLICKO2_DEFAULTS = {
    initialRating: 1300,
    initialRD: 300,
    minRD: 50,
    minimumRating: 1200, // Rating floor - players cannot drop below BRONZE
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
        BRONZE: 0,
        SILVER: 1,
        GOLD: 2,
        PLATINUM: 3,
        DIAMOND: 4,
        GENKI: 5,
    };

    const oldRank = tierRank[oldTier];
    const newRank = tierRank[newTier];

    if (newRank > oldRank) return 'UP';
    if (newRank < oldRank) return 'DOWN';
    return 'SAME';
}
