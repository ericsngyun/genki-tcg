/**
 * Swiss Tournament Utilities
 *
 * Provides core tournament management functions:
 * - Recommended rounds calculation
 * - Tournament completion detection
 * - Round completion checks
 */

import type { PlayerStanding } from '@genki-tcg/shared-types';

export interface TournamentState {
  playerCount: number;
  currentRound: number;
  totalRoundsPlanned: number | null; // null = use recommended
  standings: PlayerStanding[];
  allMatchesReported: boolean;
}

export interface TournamentStatus {
  isComplete: boolean;
  canStartNextRound: boolean;
  recommendedRounds: number;
  currentRound: number;
  playersRemaining: number;
  reason?: string;
}

/**
 * Calculate recommended number of Swiss rounds based on player count
 *
 * Swiss tournaments typically run ceil(log2(n)) rounds to determine a clear winner.
 * This ensures that an undefeated player can exist mathematically.
 *
 * Common values:
 * - 2-4 players: 2 rounds
 * - 5-8 players: 3 rounds
 * - 9-16 players: 4 rounds
 * - 17-32 players: 5 rounds
 * - 33-64 players: 6 rounds
 * - 65-128 players: 7 rounds
 * - 129-256 players: 8 rounds
 */
export function calculateRecommendedRounds(playerCount: number): number {
  if (playerCount <= 1) return 0;
  if (playerCount === 2) return 1;

  // ceil(log2(n)) for Swiss tournaments
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Determine tournament status and whether it should be considered complete
 *
 * A Swiss tournament is complete when:
 * 1. All planned rounds have been played, OR
 * 2. The recommended number of rounds has been reached, OR
 * 3. Only 1 active player remains (others dropped)
 *
 * EDGE CASES HANDLED:
 * - Round 0 (before first round): Tournament hasn't started, can't be complete
 * - All players dropped: Tournament ends due to insufficient players
 * - Single player tournament: Automatically complete (no opponents)
 */
export function getTournamentStatus(state: TournamentState): TournamentStatus {
  const {
    playerCount,
    currentRound,
    totalRoundsPlanned,
    standings,
    allMatchesReported,
  } = state;

  const recommendedRounds = calculateRecommendedRounds(playerCount);
  const targetRounds = totalRoundsPlanned ?? recommendedRounds;

  // Count non-dropped players
  const playersRemaining = standings.filter((s) => !s.isDropped).length;

  // Check completion conditions
  let isComplete = false;
  let reason: string | undefined;

  // Edge case: Round 0 means tournament hasn't started yet
  // Can't be complete, but may be able to start first round
  if (currentRound === 0) {
    // Tournament not started yet - check if we can start
    // Must have at least 2 players AND all matches must be reported (if any exist)
    const canStart = playersRemaining >= 2 && allMatchesReported;
    return {
      isComplete: false,
      canStartNextRound: canStart,
      recommendedRounds,
      currentRound: 0,
      playersRemaining,
      reason: canStart ? undefined :
        (playersRemaining < 2 ? 'Need at least 2 players to start' : 'Pending matches must be reported'),
    };
  }

  // Condition 1: All planned/recommended rounds completed
  if (currentRound >= targetRounds && allMatchesReported) {
    isComplete = true;
    reason = `All ${targetRounds} rounds completed`;
  }

  // Condition 2: Only 1 player remaining (or 0 if all dropped)
  if (playersRemaining <= 1) {
    isComplete = true;
    if (playersRemaining === 0) {
      reason = 'All players dropped';
    } else {
      reason = 'Insufficient players remaining';
    }
  }

  // Condition 3: Clear winner (optional - undefeated player in final round)
  // Only check if we've played at least the recommended rounds
  if (currentRound >= recommendedRounds && allMatchesReported && !isComplete) {
    const undefeatedPlayers = standings.filter(
      (s) => !s.isDropped && s.matchLosses === 0
    );
    if (undefeatedPlayers.length === 1) {
      isComplete = true;
      reason = `Undefeated champion: ${undefeatedPlayers[0].userName}`;
    }
  }

  // Can start next round if:
  // - Tournament not complete
  // - All matches in current round reported
  // - More than 1 player remaining
  const canStartNextRound =
    !isComplete && allMatchesReported && playersRemaining > 1;

  return {
    isComplete,
    canStartNextRound,
    recommendedRounds,
    currentRound,
    playersRemaining,
    reason,
  };
}

/**
 * Check if all matches in a round have been reported
 * For player-reported matches, requires confirmation before considering them "reported"
 */
export function areAllMatchesReported(
  matches: Array<{ 
    result: string | null; 
    playerBId: string | null;
    reportedBy?: string | null;
    confirmedBy?: string | null;
    overriddenBy?: string | null;
  }>
): boolean {
  return matches.every((match) => {
    // Bye matches are auto-reported
    if (match.playerBId === null) return true;
    
    // No result = not reported
    if (match.result === null) return false;
    
    // Admin override is always valid
    if (match.overriddenBy) return true;
    
    // Player-reported matches need confirmation
    // If reportedBy exists but confirmedBy doesn't, match is not complete
    if (match.reportedBy && !match.confirmedBy) {
      return false; // Waiting for opponent confirmation
    }
    
    // Staff-reported (no confirmedBy needed) or confirmed matches
    return true;
  });
}

/**
 * Get the minimum number of Swiss rounds needed to guarantee
 * mathematical possibility of a unique winner
 */
export function getMinimumRoundsForClearWinner(playerCount: number): number {
  return calculateRecommendedRounds(playerCount);
}

/**
 * Calculate maximum points possible after N rounds
 * Each win = 3 points, so max = rounds * 3
 */
export function getMaxPointsAfterRounds(rounds: number): number {
  return rounds * 3;
}

/**
 * Check if a player can mathematically still win the tournament
 * Returns true if the player's potential max points >= current leader
 */
export function canPlayerStillWin(
  playerPoints: number,
  leaderPoints: number,
  roundsRemaining: number
): boolean {
  const maxPossiblePoints = playerPoints + roundsRemaining * 3;
  return maxPossiblePoints >= leaderPoints;
}

/**
 * Get players who are still in contention for the win
 */
export function getPlayersInContention(
  standings: PlayerStanding[],
  roundsRemaining: number
): PlayerStanding[] {
  if (standings.length === 0) return [];

  const activeStandings = standings.filter((s) => !s.isDropped);
  if (activeStandings.length === 0) return [];

  const leaderPoints = activeStandings[0].points;

  return activeStandings.filter((player) =>
    canPlayerStillWin(player.points, leaderPoints, roundsRemaining)
  );
}

/**
 * Determine if we should offer intentional draw (ID)
 * Typically offered in final round when both players are locked for prizes
 */
export function shouldOfferIntentionalDraw(
  player1Standing: PlayerStanding,
  player2Standing: PlayerStanding,
  roundsRemaining: number,
  topCutSize: number = 8
): boolean {
  // Only offer ID in final round
  if (roundsRemaining > 1) return false;

  // Both players must be in top cut range
  const isPlayer1InCut = player1Standing.rank <= topCutSize;
  const isPlayer2InCut = player2Standing.rank <= topCutSize;

  // Both must be locked into prizes even with a draw
  // (their rank wouldn't drop them out of prizes)
  return isPlayer1InCut && isPlayer2InCut;
}
