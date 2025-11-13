/**
 * Swiss Pairing Engine for Genki TCG
 *
 * Implements Swiss-system tournament pairing with:
 * - Point-based bucketing
 * - OMW% tiebreaker within buckets
 * - Rematch avoidance
 * - Bye assignment to lowest-ranked player who hasn't received one
 * - Float handling for odd-sized buckets
 */

import { PlayerRecord, PairingInput, PairingOutput } from './types';

/**
 * Main pairing function
 */
export function generateSwissPairings(
  input: PairingInput
): PairingOutput {
  const { players, avoidRematches } = input;

  if (players.length === 0) {
    return { pairings: [], byePlayerId: null };
  }

  // Handle single player (automatic bye)
  if (players.length === 1) {
    return {
      pairings: [
        {
          tableNumber: 1,
          playerAId: players[0].userId,
          playerBId: null,
        },
      ],
      byePlayerId: players[0].userId,
    };
  }

  // Separate players into buckets by points
  const buckets = bucketPlayersByPoints(players);

  // Assign bye if odd number of players
  let byePlayerId: string | null = null;
  let remainingPlayers = [...players];

  if (players.length % 2 === 1) {
    const byePlayer = selectByePlayer(buckets);
    byePlayerId = byePlayer.userId;
    remainingPlayers = remainingPlayers.filter(
      (p) => p.userId !== byePlayerId
    );
  }

  // Generate pairings
  const pairings = pairPlayersByBuckets(
    remainingPlayers,
    avoidRematches
  );

  // Add bye pairing if exists
  if (byePlayerId) {
    pairings.push({
      tableNumber: pairings.length + 1,
      playerAId: byePlayerId,
      playerBId: null,
    });
  }

  return { pairings, byePlayerId };
}

/**
 * Bucket players by match points (descending)
 */
function bucketPlayersByPoints(
  players: PlayerRecord[]
): Map<number, PlayerRecord[]> {
  const buckets = new Map<number, PlayerRecord[]>();

  for (const player of players) {
    const bucket = buckets.get(player.points) || [];
    bucket.push(player);
    buckets.set(player.points, bucket);
  }

  // Sort each bucket by OMW%, then randomize
  for (const [points, bucket] of buckets.entries()) {
    bucket.sort((a, b) => {
      // Primary: OMW% descending
      if (b.omwPercent !== a.omwPercent) {
        return b.omwPercent - a.omwPercent;
      }
      // Secondary: Random
      return Math.random() - 0.5;
    });
    buckets.set(points, bucket);
  }

  return buckets;
}

/**
 * Select bye player: lowest points, then lowest OMW%, who hasn't received bye
 */
function selectByePlayer(
  buckets: Map<number, PlayerRecord[]>
): PlayerRecord {
  // Get point buckets in ascending order
  const pointValues = Array.from(buckets.keys()).sort((a, b) => a - b);

  for (const points of pointValues) {
    const bucket = buckets.get(points)!;

    // Find players who haven't received a bye, sorted by OMW% ascending
    const eligiblePlayers = bucket
      .filter((p) => !p.receivedBye)
      .sort((a, b) => a.omwPercent - b.omwPercent);

    if (eligiblePlayers.length > 0) {
      return eligiblePlayers[0];
    }
  }

  // Fallback: if all players have received bye, give to lowest-ranked
  for (const points of pointValues) {
    const bucket = buckets.get(points)!;
    if (bucket.length > 0) {
      return bucket[bucket.length - 1];
    }
  }

  throw new Error('No player available for bye');
}

/**
 * Pair players using bucket-based approach with rematch avoidance
 */
function pairPlayersByBuckets(
  players: PlayerRecord[],
  avoidRematches: boolean
): Array<{
  tableNumber: number;
  playerAId: string;
  playerBId: string | null;
}> {
  const buckets = bucketPlayersByPoints(players);
  const pairings: Array<{
    tableNumber: number;
    playerAId: string;
    playerBId: string | null;
  }> = [];

  let tableNumber = 1;
  const paired = new Set<string>();

  // Get buckets in descending point order
  const pointValues = Array.from(buckets.keys()).sort((a, b) => b - a);

  for (const points of pointValues) {
    const bucket = buckets.get(points)!;
    const unpaired = bucket.filter((p) => !paired.has(p.userId));

    if (unpaired.length === 0) continue;

    // Pair within bucket
    const bucketPairings = pairWithinBucket(unpaired, avoidRematches);

    for (const pair of bucketPairings) {
      pairings.push({
        tableNumber: tableNumber++,
        playerAId: pair.playerAId,
        playerBId: pair.playerBId,
      });
      paired.add(pair.playerAId);
      if (pair.playerBId) paired.add(pair.playerBId);
    }

    // If odd player remains, try to float down to next bucket
    const remainingInBucket = unpaired.filter((p) => !paired.has(p.userId));
    if (remainingInBucket.length === 1) {
      const floater = remainingInBucket[0];

      // Try to find opponent in next lower bucket
      const nextBucketIdx = pointValues.indexOf(points) + 1;
      if (nextBucketIdx < pointValues.length) {
        const nextPoints = pointValues[nextBucketIdx];
        const nextBucket = buckets.get(nextPoints)!;
        const nextUnpaired = nextBucket.filter((p) => !paired.has(p.userId));

        if (nextUnpaired.length > 0) {
          const opponent = findBestOpponent(
            floater,
            nextUnpaired,
            avoidRematches
          );

          if (opponent) {
            pairings.push({
              tableNumber: tableNumber++,
              playerAId: floater.userId,
              playerBId: opponent.userId,
            });
            paired.add(floater.userId);
            paired.add(opponent.userId);
          }
        }
      }
    }
  }

  return pairings;
}

/**
 * Pair players within a single bucket, avoiding rematches if possible
 */
function pairWithinBucket(
  players: PlayerRecord[],
  avoidRematches: boolean
): Array<{ playerAId: string; playerBId: string }> {
  const pairings: Array<{ playerAId: string; playerBId: string }> = [];
  const unpaired = [...players];

  while (unpaired.length >= 2) {
    const playerA = unpaired.shift()!;
    const opponent = findBestOpponent(playerA, unpaired, avoidRematches);

    if (opponent) {
      pairings.push({
        playerAId: playerA.userId,
        playerBId: opponent.userId,
      });
      // Remove opponent from unpaired
      const idx = unpaired.findIndex((p) => p.userId === opponent.userId);
      unpaired.splice(idx, 1);
    } else {
      // No valid opponent found (shouldn't happen in well-formed input)
      // Pair with next player anyway
      if (unpaired.length > 0) {
        const fallbackOpponent = unpaired.shift()!;
        pairings.push({
          playerAId: playerA.userId,
          playerBId: fallbackOpponent.userId,
        });
      }
    }
  }

  return pairings;
}

/**
 * Find best opponent for a player, avoiding rematches if requested
 */
function findBestOpponent(
  player: PlayerRecord,
  candidates: PlayerRecord[],
  avoidRematches: boolean
): PlayerRecord | null {
  if (candidates.length === 0) return null;

  if (avoidRematches) {
    // Try to find opponent player hasn't faced
    const newOpponent = candidates.find(
      (c) => !player.opponentIds.includes(c.userId)
    );
    if (newOpponent) return newOpponent;
  }

  // Fallback: return first candidate (already sorted by OMW%)
  return candidates[0];
}
