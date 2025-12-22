import {
  calculateRecommendedRounds,
  getTournamentStatus,
  areAllMatchesReported,
  getPlayersInContention,
  canPlayerStillWin,
  TournamentState,
} from './tournament';
import type { PlayerStanding } from '@genki-tcg/shared-types';

function createStanding(
  userId: string,
  points: number,
  losses: number = 0,
  isDropped: boolean = false
): PlayerStanding {
  return {
    userId,
    userName: `Player ${userId}`,
    rank: 0,
    points,
    matchWins: Math.floor(points / 3),
    matchLosses: losses,
    matchDraws: points % 3,
    gameWins: 0,
    gameLosses: 0,
    omwPercent: 0.33,
    gwPercent: 0,
    ogwPercent: 0,
    oomwPercent: 0.33,
    receivedBye: false,
    isDropped,
  };
}

describe('calculateRecommendedRounds', () => {
  it('should return 0 for 0 or 1 players', () => {
    expect(calculateRecommendedRounds(0)).toBe(0);
    expect(calculateRecommendedRounds(1)).toBe(0);
  });

  it('should return 1 for 2 players', () => {
    expect(calculateRecommendedRounds(2)).toBe(1);
  });

  it('should return 2 for 3-4 players', () => {
    expect(calculateRecommendedRounds(3)).toBe(2);
    expect(calculateRecommendedRounds(4)).toBe(2);
  });

  it('should return 3 for 5-8 players', () => {
    expect(calculateRecommendedRounds(5)).toBe(3);
    expect(calculateRecommendedRounds(8)).toBe(3);
  });

  it('should return 4 for 9-16 players', () => {
    expect(calculateRecommendedRounds(9)).toBe(4);
    expect(calculateRecommendedRounds(16)).toBe(4);
  });

  it('should return 5 for 17-32 players', () => {
    expect(calculateRecommendedRounds(17)).toBe(5);
    expect(calculateRecommendedRounds(32)).toBe(5);
  });

  it('should return 6 for 33-64 players', () => {
    expect(calculateRecommendedRounds(33)).toBe(6);
    expect(calculateRecommendedRounds(64)).toBe(6);
  });
});

describe('getTournamentStatus', () => {
  it('should detect incomplete tournament', () => {
    const standings = [
      createStanding('p1', 6),
      createStanding('p2', 3),
      createStanding('p3', 3),
      createStanding('p4', 0),
    ];

    const state: TournamentState = {
      playerCount: 4,
      currentRound: 1,
      totalRoundsPlanned: null,
      standings,
      allMatchesReported: true,
    };

    const status = getTournamentStatus(state);

    expect(status.isComplete).toBe(false);
    expect(status.canStartNextRound).toBe(true);
    expect(status.recommendedRounds).toBe(2);
    expect(status.playersRemaining).toBe(4);
  });

  it('should detect complete tournament after all rounds', () => {
    const standings = [
      createStanding('p1', 6),
      createStanding('p2', 3),
      createStanding('p3', 3),
      createStanding('p4', 0),
    ];

    const state: TournamentState = {
      playerCount: 4,
      currentRound: 2, // Final round for 4 players
      totalRoundsPlanned: null,
      standings,
      allMatchesReported: true,
    };

    const status = getTournamentStatus(state);

    expect(status.isComplete).toBe(true);
    expect(status.canStartNextRound).toBe(false);
    expect(status.reason).toContain('2 rounds completed');
  });

  it('should respect totalRoundsPlanned over recommended', () => {
    const standings = [
      createStanding('p1', 9),
      createStanding('p2', 6),
      createStanding('p3', 3),
      createStanding('p4', 0),
    ];

    const state: TournamentState = {
      playerCount: 4,
      currentRound: 3, // Extra round
      totalRoundsPlanned: 3, // Explicitly planned 3 rounds
      standings,
      allMatchesReported: true,
    };

    const status = getTournamentStatus(state);

    expect(status.isComplete).toBe(true);
    expect(status.reason).toContain('3 rounds completed');
  });

  it('should detect insufficient players', () => {
    const standings = [
      createStanding('p1', 6),
      createStanding('p2', 3, 1, true), // dropped
      createStanding('p3', 3, 1, true), // dropped
      createStanding('p4', 0, 2, true), // dropped
    ];

    const state: TournamentState = {
      playerCount: 4,
      currentRound: 1,
      totalRoundsPlanned: null,
      standings,
      allMatchesReported: true,
    };

    const status = getTournamentStatus(state);

    expect(status.isComplete).toBe(true);
    expect(status.playersRemaining).toBe(1);
    expect(status.reason).toContain('Insufficient players');
  });

  it('should not allow next round when matches pending', () => {
    const standings = [
      createStanding('p1', 3),
      createStanding('p2', 0),
    ];

    const state: TournamentState = {
      playerCount: 2,
      currentRound: 0,
      totalRoundsPlanned: null,
      standings,
      allMatchesReported: false,
    };

    const status = getTournamentStatus(state);

    expect(status.isComplete).toBe(false);
    expect(status.canStartNextRound).toBe(false);
  });
});

describe('areAllMatchesReported', () => {
  it('should return true for empty matches', () => {
    expect(areAllMatchesReported([])).toBe(true);
  });

  it('should return true when all matches have results', () => {
    const matches = [
      { result: 'PLAYER_A_WIN', playerBId: 'p2' },
      { result: 'PLAYER_B_WIN', playerBId: 'p4' },
    ];
    expect(areAllMatchesReported(matches)).toBe(true);
  });

  it('should return false when some matches are pending', () => {
    const matches = [
      { result: 'PLAYER_A_WIN', playerBId: 'p2' },
      { result: null, playerBId: 'p4' },
    ];
    expect(areAllMatchesReported(matches)).toBe(false);
  });

  it('should treat bye matches as auto-reported', () => {
    const matches = [
      { result: 'PLAYER_A_WIN', playerBId: 'p2' },
      { result: null, playerBId: null }, // Bye
    ];
    expect(areAllMatchesReported(matches)).toBe(true);
  });
});

describe('canPlayerStillWin', () => {
  it('should return true if player can catch leader', () => {
    // Player has 3 points, leader has 6, 1 round remaining (max 3 points)
    // Player could reach 6, tie with leader
    expect(canPlayerStillWin(3, 6, 1)).toBe(true);
  });

  it('should return true if player is the leader', () => {
    expect(canPlayerStillWin(6, 6, 1)).toBe(true);
  });

  it('should return false if player cannot catch leader', () => {
    // Player has 0 points, leader has 6, 1 round remaining
    // Max player can reach is 3, leader has 6
    expect(canPlayerStillWin(0, 6, 1)).toBe(false);
  });

  it('should return true with multiple rounds remaining', () => {
    // Player has 0 points, leader has 6, 3 rounds remaining
    // Player could reach 9 points
    expect(canPlayerStillWin(0, 6, 3)).toBe(true);
  });
});

describe('getPlayersInContention', () => {
  it('should return all players if all can win', () => {
    const standings = [
      createStanding('p1', 6),
      createStanding('p2', 3),
      createStanding('p3', 3),
      createStanding('p4', 0),
    ];
    // Assign ranks
    standings.forEach((s, i) => (s.rank = i + 1));

    const inContention = getPlayersInContention(standings, 2);

    // All can reach or exceed 6 with 2 rounds remaining
    expect(inContention).toHaveLength(4);
  });

  it('should exclude players who cannot catch leader', () => {
    const standings = [
      createStanding('p1', 9), // 3-0
      createStanding('p2', 6), // 2-1
      createStanding('p3', 3), // 1-2
      createStanding('p4', 0), // 0-3
    ];
    standings.forEach((s, i) => (s.rank = i + 1));

    // 1 round remaining: max points = current + 3
    const inContention = getPlayersInContention(standings, 1);

    // p1: 9+3=12, p2: 6+3=9, p3: 3+3=6, p4: 0+3=3
    // Only p1 and p2 can tie or beat leader
    expect(inContention).toHaveLength(2);
    expect(inContention.map((p) => p.userId)).toEqual(['p1', 'p2']);
  });

  it('should exclude dropped players', () => {
    const standings = [
      createStanding('p1', 6),
      createStanding('p2', 6, 0, true), // dropped
      createStanding('p3', 3),
    ];
    standings.forEach((s, i) => (s.rank = i + 1));

    const inContention = getPlayersInContention(standings, 1);

    expect(inContention.map((p) => p.userId)).not.toContain('p2');
  });

  it('should handle empty standings', () => {
    expect(getPlayersInContention([], 1)).toEqual([]);
  });
});
