import { calculateStandings, MatchRecord, StandingsInput } from './standings';

describe('Standings Calculator', () => {
  it('should calculate basic standings with wins and losses', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
      ['p3', 'Player 3'],
      ['p4', 'Player 4'],
    ]);

    const matches: MatchRecord[] = [
      // Round 1
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 0,
      },
      {
        playerAId: 'p3',
        playerBId: 'p4',
        result: 'PLAYER_B_WIN',
        gamesWonA: 1,
        gamesWonB: 2,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2', 'p3', 'p4'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    expect(standings).toHaveLength(4);

    // p1 and p4 should have 3 points (1 win)
    const p1 = standings.find((s) => s.userId === 'p1')!;
    const p4 = standings.find((s) => s.userId === 'p4')!;
    expect(p1.points).toBe(3);
    expect(p4.points).toBe(3);
    expect(p1.matchWins).toBe(1);
    expect(p4.matchWins).toBe(1);

    // p2 and p3 should have 0 points (1 loss)
    const p2 = standings.find((s) => s.userId === 'p2')!;
    const p3 = standings.find((s) => s.userId === 'p3')!;
    expect(p2.points).toBe(0);
    expect(p3.points).toBe(0);
    expect(p2.matchLosses).toBe(1);
    expect(p3.matchLosses).toBe(1);
  });

  it('should calculate draws correctly', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
    ]);

    const matches: MatchRecord[] = [
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'DRAW',
        gamesWonA: 1,
        gamesWonB: 1,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    const p1 = standings.find((s) => s.userId === 'p1')!;
    const p2 = standings.find((s) => s.userId === 'p2')!;

    expect(p1.points).toBe(1);
    expect(p2.points).toBe(1);
    expect(p1.matchDraws).toBe(1);
    expect(p2.matchDraws).toBe(1);
  });

  it('should handle bye correctly', () => {
    const playerNames = new Map([['p1', 'Player 1']]);

    const matches: MatchRecord[] = [
      {
        playerAId: 'p1',
        playerBId: null, // Bye
        result: null,
        gamesWonA: 0,
        gamesWonB: 0,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    const p1 = standings[0];
    expect(p1.points).toBe(3);
    expect(p1.matchWins).toBe(1);
    expect(p1.receivedBye).toBe(true);
  });

  it('should calculate OMW% with 33.33% floor', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
      ['p3', 'Player 3'],
      ['p4', 'Player 4'],
    ]);

    // p1 beats p2, p3 beats p4
    // p1 beats p3
    // p1 is 2-0, opponents are p2 (0-1) and p3 (1-1)
    const matches: MatchRecord[] = [
      // Round 1
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 0,
      },
      {
        playerAId: 'p3',
        playerBId: 'p4',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 1,
      },
      // Round 2
      {
        playerAId: 'p1',
        playerBId: 'p3',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 1,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2', 'p3', 'p4'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    const p1 = standings.find((s) => s.userId === 'p1')!;

    // p1's opponents: p2 (0-1 = 0%, floored to 33.33%) and p3 (1-1 = 50%)
    // OMW% = (0.3333 + 0.5) / 2 = 0.4167
    expect(p1.omwPercent).toBeCloseTo(0.4167, 2);
  });

  it('should calculate GW% correctly', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
    ]);

    const matches: MatchRecord[] = [
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 1,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    const p1 = standings.find((s) => s.userId === 'p1')!;
    const p2 = standings.find((s) => s.userId === 'p2')!;

    // p1: 2 wins, 1 loss = 2/3 = 0.6667
    expect(p1.gwPercent).toBeCloseTo(0.6667, 2);

    // p2: 1 win, 2 losses = 1/3 = 0.3333
    expect(p2.gwPercent).toBeCloseTo(0.3333, 2);
  });

  it('should sort by points first', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
      ['p3', 'Player 3'],
    ]);

    const matches: MatchRecord[] = [
      // p1 beats p2
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 0,
      },
      // p1 beats p3
      {
        playerAId: 'p1',
        playerBId: 'p3',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 0,
      },
      // p2 beats p3
      {
        playerAId: 'p2',
        playerBId: 'p3',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 1,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2', 'p3'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    expect(standings[0].userId).toBe('p1'); // 6 points (2-0)
    expect(standings[1].userId).toBe('p2'); // 3 points (1-1)
    expect(standings[2].userId).toBe('p3'); // 0 points (0-2)

    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(2);
    expect(standings[2].rank).toBe(3);
  });

  it('should use OMW% as tiebreaker when points are equal', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
      ['p3', 'Player 3'],
      ['p4', 'Player 4'],
    ]);

    // All players 1-1, but different OMW%
    // p1 beats p3 (who goes 0-2) - OMW = 33.33%
    // p2 beats p4 (who goes 0-2) - OMW = 33.33%
    // p3 loses to p1, p4
    // p4 loses to p2, p3
    const matches: MatchRecord[] = [
      // Round 1
      {
        playerAId: 'p1',
        playerBId: 'p3',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 0,
      },
      {
        playerAId: 'p2',
        playerBId: 'p4',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 0,
      },
      // Round 2
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'PLAYER_B_WIN',
        gamesWonA: 1,
        gamesWonB: 2,
      },
      {
        playerAId: 'p3',
        playerBId: 'p4',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 1,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2', 'p3', 'p4'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    // All should have either 3 or 6 points
    // p2: 2-0 = 6 points (beat p4 and p1)
    const p2 = standings.find((s) => s.userId === 'p2')!;
    expect(p2.points).toBe(6);
    expect(p2.rank).toBe(1);

    // p1 and p3: both 1-1 = 3 points
    const p1 = standings.find((s) => s.userId === 'p1')!;
    const p3 = standings.find((s) => s.userId === 'p3')!;
    expect(p1.points).toBe(3);
    expect(p3.points).toBe(3);

    // p1 opponents: p3 (1-1=50%), p2 (2-0=100%) -> OMW = 75%
    // p3 opponents: p1 (1-1=50%), p4 (0-2=33.33%) -> OMW = 41.67%
    expect(p1.omwPercent).toBeGreaterThan(p3.omwPercent);

    // p1 should rank higher than p3
    expect(p1.rank).toBeLessThan(p3.rank);
  });

  it('should handle DQ results', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
    ]);

    const matches: MatchRecord[] = [
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'PLAYER_A_DQ',
        gamesWonA: 0,
        gamesWonB: 0,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    const p1 = standings.find((s) => s.userId === 'p1')!;
    const p2 = standings.find((s) => s.userId === 'p2')!;

    // p1 is DQ'd, p2 wins
    expect(p1.points).toBe(0);
    expect(p1.matchLosses).toBe(1);
    expect(p2.points).toBe(3);
    expect(p2.matchWins).toBe(1);
  });

  it('should handle unreported matches', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
    ]);

    const matches: MatchRecord[] = [
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: null, // Not reported
        gamesWonA: 0,
        gamesWonB: 0,
      },
    ];

    const input: StandingsInput = {
      playerIds: ['p1', 'p2'],
      playerNames,
      matches,
    };

    const standings = calculateStandings(input);

    const p1 = standings.find((s) => s.userId === 'p1')!;
    const p2 = standings.find((s) => s.userId === 'p2')!;

    // No points awarded
    expect(p1.points).toBe(0);
    expect(p2.points).toBe(0);
  });

  it('should mark dropped players', () => {
    const playerNames = new Map([
      ['p1', 'Player 1'],
      ['p2', 'Player 2'],
    ]);

    const matches: MatchRecord[] = [
      {
        playerAId: 'p1',
        playerBId: 'p2',
        result: 'PLAYER_A_WIN',
        gamesWonA: 2,
        gamesWonB: 0,
      },
    ];

    const droppedPlayers = new Set(['p2']);

    const input: StandingsInput = {
      playerIds: ['p1', 'p2'],
      playerNames,
      matches,
      droppedPlayers,
    };

    const standings = calculateStandings(input);

    const p1 = standings.find((s) => s.userId === 'p1')!;
    const p2 = standings.find((s) => s.userId === 'p2')!;

    expect(p1.isDropped).toBe(false);
    expect(p2.isDropped).toBe(true);
  });
});
