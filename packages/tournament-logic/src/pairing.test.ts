import { generateSwissPairings } from './pairing';
import { PlayerRecord, PairingInput } from './types';

describe('Swiss Pairing Engine', () => {
  function createPlayer(
    id: string,
    points: number,
    omw: number = 0,
    receivedBye: boolean = false,
    opponents: string[] = []
  ): PlayerRecord {
    return {
      userId: id,
      userName: `Player ${id}`,
      points,
      matchWins: Math.floor(points / 3),
      matchLosses: 0,
      matchDraws: points % 3,
      gameWins: 0,
      gameLosses: 0,
      omwPercent: omw,
      gwPercent: 0,
      ogwPercent: 0,
      receivedBye,
      opponentIds: opponents,
    };
  }

  describe('Basic pairing', () => {
    it('should return empty pairings for empty input', () => {
      const input: PairingInput = {
        players: [],
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toEqual([]);
      expect(result.byePlayerId).toBeNull();
    });

    it('should give bye to single player', () => {
      const player = createPlayer('p1', 0);
      const input: PairingInput = {
        players: [player],
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(1);
      expect(result.pairings[0].playerAId).toBe('p1');
      expect(result.pairings[0].playerBId).toBeNull();
      expect(result.byePlayerId).toBe('p1');
    });

    it('should pair two players', () => {
      const players = [createPlayer('p1', 0), createPlayer('p2', 0)];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(1);
      expect(result.byePlayerId).toBeNull();

      const pairing = result.pairings[0];
      expect([pairing.playerAId, pairing.playerBId].sort()).toEqual([
        'p1',
        'p2',
      ]);
    });

    it('should assign table numbers sequentially', () => {
      const players = [
        createPlayer('p1', 0),
        createPlayer('p2', 0),
        createPlayer('p3', 0),
        createPlayer('p4', 0),
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(2);
      expect(result.pairings[0].tableNumber).toBe(1);
      expect(result.pairings[1].tableNumber).toBe(2);
    });
  });

  describe('Bye assignment', () => {
    it('should assign bye to odd player with lowest points', () => {
      const players = [
        createPlayer('p1', 6), // 2-0
        createPlayer('p2', 6), // 2-0
        createPlayer('p3', 3), // 1-0-1
        createPlayer('p4', 3), // 1-0-1
        createPlayer('p5', 0), // 0-2 <- should get bye
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.byePlayerId).toBe('p5');
      expect(result.pairings).toHaveLength(3); // 2 real pairings + 1 bye
    });

    it('should assign bye to player with lowest OMW% in same point bucket', () => {
      const players = [
        createPlayer('p1', 3, 0.5),
        createPlayer('p2', 3, 0.5),
        createPlayer('p3', 3, 0.4), // Lowest OMW%
        createPlayer('p4', 3, 0.6),
        createPlayer('p5', 3, 0.7),
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.byePlayerId).toBe('p3');
    });

    it('should not assign bye to player who already received one', () => {
      const players = [
        createPlayer('p1', 0, 0.33, false),
        createPlayer('p2', 0, 0.30, true), // Already got bye
        createPlayer('p3', 0, 0.35, false),
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      // Should give bye to p2 (second lowest) since p1 already has bye
      expect(result.byePlayerId).toBe('p1');
      expect(result.byePlayerId).not.toBe('p2');
    });
  });

  describe('Point-based bucketing', () => {
    it('should pair players within same point buckets first', () => {
      const players = [
        createPlayer('p1', 6, 0.5), // 6 points
        createPlayer('p2', 6, 0.5), // 6 points
        createPlayer('p3', 3, 0.4), // 3 points
        createPlayer('p4', 3, 0.4), // 3 points
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(2);

      // Check that 6-point players are paired together
      const pairing1PlayerIds = [
        result.pairings[0].playerAId,
        result.pairings[0].playerBId,
      ].sort();
      const pairing2PlayerIds = [
        result.pairings[1].playerAId,
        result.pairings[1].playerBId,
      ].sort();

      // One pairing should have p1 and p2, other should have p3 and p4
      const allPaired = [...pairing1PlayerIds, ...pairing2PlayerIds].sort();
      expect(allPaired).toEqual(['p1', 'p2', 'p3', 'p4']);

      // Verify 6-point players paired together
      expect(
        (pairing1PlayerIds.includes('p1') &&
          pairing1PlayerIds.includes('p2')) ||
          (pairing2PlayerIds.includes('p1') &&
            pairing2PlayerIds.includes('p2'))
      ).toBe(true);

      // Verify 3-point players paired together
      expect(
        (pairing1PlayerIds.includes('p3') &&
          pairing1PlayerIds.includes('p4')) ||
          (pairing2PlayerIds.includes('p3') &&
            pairing2PlayerIds.includes('p4'))
      ).toBe(true);
    });

    it('should order pairings by points descending (highest first)', () => {
      const players = [
        createPlayer('p1', 6),
        createPlayer('p2', 6),
        createPlayer('p3', 0),
        createPlayer('p4', 0),
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      // First pairing should be from 6-point bucket
      const firstPairingPlayers = [
        result.pairings[0].playerAId,
        result.pairings[0].playerBId,
      ];
      expect(
        firstPairingPlayers.includes('p1') ||
          firstPairingPlayers.includes('p2')
      ).toBe(true);
    });
  });

  describe('Rematch avoidance', () => {
    it('should avoid pairing players who already faced each other', () => {
      // p1 and p2 already played
      // p3 and p4 already played
      // Round 2: p1 should face p3 or p4, p2 should face p3 or p4
      const players = [
        createPlayer('p1', 3, 0.5, false, ['p2']),
        createPlayer('p2', 3, 0.5, false, ['p1']),
        createPlayer('p3', 3, 0.5, false, ['p4']),
        createPlayer('p4', 3, 0.5, false, ['p3']),
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(2);

      for (const pairing of result.pairings) {
        const { playerAId, playerBId } = pairing;
        // Verify no rematches
        expect(
          (playerAId === 'p1' && playerBId === 'p2') ||
            (playerAId === 'p2' && playerBId === 'p1') ||
            (playerAId === 'p3' && playerBId === 'p4') ||
            (playerAId === 'p4' && playerBId === 'p3')
        ).toBe(false);
      }
    });

    it('should allow rematches when avoidRematches is false', () => {
      const players = [
        createPlayer('p1', 3, 0.5, false, ['p2']),
        createPlayer('p2', 3, 0.4, false, ['p1']),
      ];
      const input: PairingInput = {
        players,
        avoidRematches: false,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(1);
      // Should pair even though it's a rematch
      const pairing = result.pairings[0];
      expect([pairing.playerAId, pairing.playerBId].sort()).toEqual([
        'p1',
        'p2',
      ]);
    });
  });

  describe('Float handling', () => {
    it('should float player down if bucket has odd count', () => {
      // 3 players at 6 points, 1 player at 3 points
      // One 6-point player should float down
      const players = [
        createPlayer('p1', 6, 0.7),
        createPlayer('p2', 6, 0.6),
        createPlayer('p3', 6, 0.5), // Lowest OMW in 6-point bucket
        createPlayer('p4', 3, 0.4),
      ];
      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(2);

      // Should have one 6v6 pairing and one 6v3 pairing
      const pointPairs = result.pairings.map((p) => {
        const pA = players.find((pl) => pl.userId === p.playerAId)!;
        const pB = players.find((pl) => pl.userId === p.playerBId)!;
        return [pA.points, pB.points].sort();
      });

      expect(pointPairs).toContainEqual([6, 6]);
      expect(pointPairs).toContainEqual([3, 6]);
    });
  });

  describe('Large tournament', () => {
    it('should handle 32 players', () => {
      const players: PlayerRecord[] = [];
      for (let i = 1; i <= 32; i++) {
        players.push(createPlayer(`p${i}`, 0, 0.33));
      }

      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(16);
      expect(result.byePlayerId).toBeNull();

      // Verify all players are paired exactly once
      const pairedPlayers = new Set<string>();
      for (const pairing of result.pairings) {
        expect(pairedPlayers.has(pairing.playerAId)).toBe(false);
        expect(pairedPlayers.has(pairing.playerBId!)).toBe(false);
        pairedPlayers.add(pairing.playerAId);
        pairedPlayers.add(pairing.playerBId!);
      }
      expect(pairedPlayers.size).toBe(32);
    });

    it('should handle 31 players with bye', () => {
      const players: PlayerRecord[] = [];
      for (let i = 1; i <= 31; i++) {
        players.push(createPlayer(`p${i}`, 0, 0.33));
      }

      const input: PairingInput = {
        players,
        avoidRematches: true,
      };

      const result = generateSwissPairings(input);

      expect(result.pairings).toHaveLength(16); // 15 real pairings + 1 bye
      expect(result.byePlayerId).not.toBeNull();

      // Verify all players are accounted for
      const pairedPlayers = new Set<string>();
      for (const pairing of result.pairings) {
        pairedPlayers.add(pairing.playerAId);
        if (pairing.playerBId) {
          pairedPlayers.add(pairing.playerBId);
        }
      }
      expect(pairedPlayers.size).toBe(31);
    });
  });
});
