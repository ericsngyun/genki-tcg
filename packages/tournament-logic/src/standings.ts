/**
 * Swiss Tournament Standings Calculator
 *
 * Calculates standings with proper tiebreakers:
 * 1. Match Points (Win=3, Draw/ID=1, Loss=0)
 * 2. OMW% (Opponent Match Win %, floor 33.33%)
 * 3. GW% (Game Win %)
 * 4. OGW% (Opponent Game Win %)
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
  const { playerIds, playerNames, matches, droppedPlayers = new Set() } =
    input;

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

  // Calculate tiebreakers
  const standings: PlayerStanding[] = [];

  for (const player of playerStatsMap.values()) {
    const omwPercent = calculateOMW(player, playerStatsMap);
    const gwPercent = calculateGW(player);
    const ogwPercent = calculateOGW(player, playerStatsMap);

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
      receivedBye: player.receivedBye,
      isDropped: player.isDropped,
      droppedAfterRound: undefined,
    });
  }

  // Sort by tiebreakers
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
    return b.ogwPercent - a.ogwPercent;
  });

  // Assign ranks
  for (let i = 0; i < standings.length; i++) {
    standings[i].rank = i + 1;
  }

  return standings;
}

/**
 * Calculate Opponent Match Win % with 33.33% floor
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
      receivedBye: s.receivedBye,
      opponentIds: playerStats,
    };
  });
}
