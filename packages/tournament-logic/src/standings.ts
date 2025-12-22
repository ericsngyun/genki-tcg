/**
 * Swiss Tournament Standings Calculator
 *
 * Calculates standings with proper tiebreakers:
 * 1. Match Points (Win=3, Draw/ID=1, Loss=0)
 * 2. OMW% (Opponent Match Win %, floor 33.33%)
 * 3. GW% (Game Win %)
 * 4. OGW% (Opponent Game Win %)
 * 5. OOMW% (Opponent's Opponent Match Win %, floor 33.33%)
 */

import type { PlayerStanding } from '@genki-tcg/shared-types';

export interface MatchRecord {
  playerAId: string;
  playerBId: string | null; // null = bye
  result:
    | 'PLAYER_A_WIN'
    | 'PLAYER_B_WIN'
    | 'DRAW'
    | 'INTENTIONAL_DRAW'
    | 'DOUBLE_LOSS'
    | 'PLAYER_A_DQ'
    | 'PLAYER_B_DQ'
    | null;
  gamesWonA: number;
  gamesWonB: number;
}

export interface StandingsInput {
  playerIds: string[];
  playerNames: Map<string, string>;
  matches: MatchRecord[];
  droppedPlayers?: Set<string>;
  /** Total number of completed rounds in the tournament */
  totalCompletedRounds?: number;
  /** Map of playerId -> round number after which they dropped */
  droppedAfterRound?: Map<string, number>;
}

export interface PlayerStats {
  userId: string;
  userName: string;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  opponentIds: string[];
  receivedBye: boolean;
  isDropped: boolean;
}

/**
 * Calculate final standings with tiebreakers
 */
export function calculateStandings(
  input: StandingsInput
): PlayerStanding[] {
  const {
    playerIds,
    playerNames,
    matches,
    droppedPlayers = new Set(),
    totalCompletedRounds = 0,
    droppedAfterRound = new Map(),
  } = input;

  // Build player stats
  const playerStatsMap = new Map<string, PlayerStats>();

  for (const playerId of playerIds) {
    playerStatsMap.set(playerId, {
      userId: playerId,
      userName: playerNames.get(playerId) || 'Unknown',
      points: 0,
      matchWins: 0,
      matchLosses: 0,
      matchDraws: 0,
      gameWins: 0,
      gameLosses: 0,
      opponentIds: [],
      receivedBye: false,
      isDropped: droppedPlayers.has(playerId),
    });
  }

  // Process matches
  for (const match of matches) {
    const { playerAId, playerBId, result, gamesWonA, gamesWonB } = match;

    if (!playerStatsMap.has(playerAId)) continue;

    const playerA = playerStatsMap.get(playerAId)!;

    // Handle bye
    if (playerBId === null) {
      playerA.points += 3;
      playerA.matchWins += 1;
      playerA.receivedBye = true;
      continue;
    }

    if (!playerStatsMap.has(playerBId)) continue;

    const playerB = playerStatsMap.get(playerBId)!;

    // Track opponents
    playerA.opponentIds.push(playerBId);
    playerB.opponentIds.push(playerAId);

    // Track games
    playerA.gameWins += gamesWonA;
    playerA.gameLosses += gamesWonB;
    playerB.gameWins += gamesWonB;
    playerB.gameLosses += gamesWonA;

    // Award points based on result
    if (result === 'PLAYER_A_WIN') {
      playerA.points += 3;
      playerA.matchWins += 1;
      playerB.matchLosses += 1;
    } else if (result === 'PLAYER_B_WIN') {
      playerB.points += 3;
      playerB.matchWins += 1;
      playerA.matchLosses += 1;
    } else if (result === 'DRAW' || result === 'INTENTIONAL_DRAW') {
      playerA.points += 1;
      playerB.points += 1;
      playerA.matchDraws += 1;
      playerB.matchDraws += 1;
    } else if (result === 'DOUBLE_LOSS') {
      // Both get loss
      playerA.matchLosses += 1;
      playerB.matchLosses += 1;
    } else if (result === 'PLAYER_A_DQ') {
      // A is DQ'd, B wins
      playerB.points += 3;
      playerB.matchWins += 1;
      playerA.matchLosses += 1;
    } else if (result === 'PLAYER_B_DQ') {
      // B is DQ'd, A wins
      playerA.points += 3;
      playerA.matchWins += 1;
      playerB.matchLosses += 1;
    }
    // null result = not reported yet, no points awarded
  }

  // Add phantom losses for dropped players who missed rounds
  // A player who drops after round X should get losses for rounds X+1 through totalCompletedRounds
  if (totalCompletedRounds > 0) {
    for (const playerId of droppedPlayers) {
      const player = playerStatsMap.get(playerId);
      if (!player) continue;

      const droppedAfter = droppedAfterRound.get(playerId) ?? 0;

      // Calculate how many rounds the player actually played
      // This is the number of matches they have (wins + losses + draws)
      const roundsPlayed = player.matchWins + player.matchLosses + player.matchDraws;

      // Calculate missed rounds: total rounds minus rounds they played
      // Use max of droppedAfter and roundsPlayed to handle edge cases
      const lastRoundPlayed = Math.max(droppedAfter, roundsPlayed);
      const missedRounds = totalCompletedRounds - lastRoundPlayed;

      // Add a loss for each missed round
      if (missedRounds > 0) {
        player.matchLosses += missedRounds;
      }
    }
  }

  // Calculate tiebreakers
  const standings: PlayerStanding[] = [];

  // First pass: Calculate OMW, GW, OGW for all players
  const omwMap = new Map<string, number>();
  const gwMap = new Map<string, number>();
  const ogwMap = new Map<string, number>();

  for (const player of playerStatsMap.values()) {
    omwMap.set(player.userId, calculateOMW(player, playerStatsMap));
    gwMap.set(player.userId, calculateGW(player));
    ogwMap.set(player.userId, calculateOGW(player, playerStatsMap));
  }

  // Second pass: Calculate OOMW and build standings
  for (const player of playerStatsMap.values()) {
    const omwPercent = omwMap.get(player.userId) || 0;
    const gwPercent = gwMap.get(player.userId) || 0;
    const ogwPercent = ogwMap.get(player.userId) || 0;
    const oomwPercent = calculateOOMW(player, playerStatsMap, omwMap);

    standings.push({
      userId: player.userId,
      userName: player.userName,
      rank: 0, // Will be assigned after sorting
      points: player.points,
      matchWins: player.matchWins,
      matchLosses: player.matchLosses,
      matchDraws: player.matchDraws,
      gameWins: player.gameWins,
      gameLosses: player.gameLosses,
      omwPercent,
      gwPercent,
      ogwPercent,
      oomwPercent,
      receivedBye: player.receivedBye,
      isDropped: player.isDropped,
      droppedAfterRound: undefined,
    });
  }

  // Sort by tiebreakers (deterministic ordering)
  standings.sort((a, b) => {
    // Primary: Points
    if (b.points !== a.points) return b.points - a.points;

    // Secondary: OMW%
    if (Math.abs(b.omwPercent - a.omwPercent) > 0.0001) {
      return b.omwPercent - a.omwPercent;
    }

    // Tertiary: GW%
    if (Math.abs(b.gwPercent - a.gwPercent) > 0.0001) {
      return b.gwPercent - a.gwPercent;
    }

    // Quaternary: OGW%
    if (Math.abs(b.ogwPercent - a.ogwPercent) > 0.0001) {
      return b.ogwPercent - a.ogwPercent;
    }

    // Quinary: OOMW%
    if (Math.abs(b.oomwPercent - a.oomwPercent) > 0.0001) {
      return b.oomwPercent - a.oomwPercent;
    }

    // Final deterministic tiebreaker: alphabetical by userId
    // This ensures consistent ordering when all stats are equal
    return a.userId.localeCompare(b.userId);
  });

  // Assign ranks
  for (let i = 0; i < standings.length; i++) {
    standings[i].rank = i + 1;
  }

  return standings;
}

/**
 * Calculate Opponent Match Win % with 33.33% floor
 * Dropped players are counted at the minimum floor (33.33%) regardless of their record
 * to negatively impact the OMW of players who faced them
 */
function calculateOMW(
  player: PlayerStats,
  allPlayers: Map<string, PlayerStats>
): number {
  if (player.opponentIds.length === 0) return 0.3333;

  let totalOpponentWinRate = 0;

  for (const opponentId of player.opponentIds) {
    const opponent = allPlayers.get(opponentId);
    if (!opponent) continue;

    // Dropped players always count at minimum floor for OMW purposes
    // This negatively impacts players who faced opponents that later dropped
    if (opponent.isDropped) {
      totalOpponentWinRate += 0.3333;
      continue;
    }

    const totalMatches =
      opponent.matchWins + opponent.matchLosses + opponent.matchDraws;
    if (totalMatches === 0) {
      totalOpponentWinRate += 0.3333; // Floor
      continue;
    }

    // Win rate = (wins + 0.5 * draws) / total
    const winRate =
      (opponent.matchWins + 0.5 * opponent.matchDraws) / totalMatches;

    // Apply 33.33% floor
    totalOpponentWinRate += Math.max(winRate, 0.3333);
  }

  return totalOpponentWinRate / player.opponentIds.length;
}

/**
 * Calculate Game Win %
 */
function calculateGW(player: PlayerStats): number {
  const totalGames = player.gameWins + player.gameLosses;
  if (totalGames === 0) return 0;

  return player.gameWins / totalGames;
}

/**
 * Calculate Opponent Game Win %
 */
function calculateOGW(
  player: PlayerStats,
  allPlayers: Map<string, PlayerStats>
): number {
  if (player.opponentIds.length === 0) return 0;

  let totalOpponentGW = 0;

  for (const opponentId of player.opponentIds) {
    const opponent = allPlayers.get(opponentId);
    if (!opponent) continue;

    totalOpponentGW += calculateGW(opponent);
  }

  return totalOpponentGW / player.opponentIds.length;
}

/**
 * Calculate Opponent's Opponent Match Win % (OOMW%)
 * This is the average OMW% of all the player's opponents
 */
function calculateOOMW(
  player: PlayerStats,
  allPlayers: Map<string, PlayerStats>,
  omwMap: Map<string, number>
): number {
  if (player.opponentIds.length === 0) return 0.3333;

  let totalOpponentOMW = 0;

  for (const opponentId of player.opponentIds) {
    const opponent = allPlayers.get(opponentId);
    if (!opponent) continue;

    const opponentOMW = omwMap.get(opponentId) || 0.3333;
    totalOpponentOMW += opponentOMW;
  }

  return totalOpponentOMW / player.opponentIds.length;
}

/**
 * Get player record for pairing purposes
 */
export function getPlayerRecordsForPairing(
  input: StandingsInput
): Array<{
  userId: string;
  userName: string;
  points: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  omwPercent: number;
  gwPercent: number;
  ogwPercent: number;
  oomwPercent: number;
  receivedBye: boolean;
  opponentIds: string[];
}> {
  const standings = calculateStandings(input);

  return standings.map((s) => {
    const playerStats = Array.from(
      input.matches.reduce((acc, match) => {
        if (match.playerAId === s.userId && match.playerBId) {
          acc.add(match.playerBId);
        } else if (match.playerBId === s.userId) {
          acc.add(match.playerAId);
        }
        return acc;
      }, new Set<string>())
    );

    return {
      userId: s.userId,
      userName: s.userName,
      points: s.points,
      matchWins: s.matchWins,
      matchLosses: s.matchLosses,
      matchDraws: s.matchDraws,
      gameWins: s.gameWins,
      gameLosses: s.gameLosses,
      omwPercent: s.omwPercent,
      gwPercent: s.gwPercent,
      ogwPercent: s.ogwPercent,
      oomwPercent: s.oomwPercent,
      receivedBye: s.receivedBye,
      opponentIds: playerStats,
    };
  });
}
