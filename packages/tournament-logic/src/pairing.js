"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSwissPairings = generateSwissPairings;
function generateSwissPairings(input) {
    const { players, avoidRematches } = input;
    if (players.length === 0) {
        return { pairings: [], byePlayerId: null };
    }
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
    const buckets = bucketPlayersByPoints(players);
    let byePlayerId = null;
    let remainingPlayers = [...players];
    if (players.length % 2 === 1) {
        const byePlayer = selectByePlayer(buckets);
        byePlayerId = byePlayer.userId;
        remainingPlayers = remainingPlayers.filter((p) => p.userId !== byePlayerId);
    }
    const pairings = pairPlayersByBuckets(remainingPlayers, avoidRematches);
    if (byePlayerId) {
        pairings.push({
            tableNumber: pairings.length + 1,
            playerAId: byePlayerId,
            playerBId: null,
        });
    }
    return { pairings, byePlayerId };
}
function bucketPlayersByPoints(players) {
    const buckets = new Map();
    for (const player of players) {
        const bucket = buckets.get(player.points) || [];
        bucket.push(player);
        buckets.set(player.points, bucket);
    }
    for (const [points, bucket] of buckets.entries()) {
        bucket.sort((a, b) => {
            if (b.omwPercent !== a.omwPercent) {
                return b.omwPercent - a.omwPercent;
            }
            return Math.random() - 0.5;
        });
        buckets.set(points, bucket);
    }
    return buckets;
}
function selectByePlayer(buckets) {
    const pointValues = Array.from(buckets.keys()).sort((a, b) => a - b);
    for (const points of pointValues) {
        const bucket = buckets.get(points);
        const eligiblePlayers = bucket
            .filter((p) => !p.receivedBye)
            .sort((a, b) => a.omwPercent - b.omwPercent);
        if (eligiblePlayers.length > 0) {
            return eligiblePlayers[0];
        }
    }
    for (const points of pointValues) {
        const bucket = buckets.get(points);
        if (bucket.length > 0) {
            return bucket[bucket.length - 1];
        }
    }
    throw new Error('No player available for bye');
}
function pairPlayersByBuckets(players, avoidRematches) {
    const buckets = bucketPlayersByPoints(players);
    const pairings = [];
    let tableNumber = 1;
    const paired = new Set();
    const pointValues = Array.from(buckets.keys()).sort((a, b) => b - a);
    for (const points of pointValues) {
        const bucket = buckets.get(points);
        const unpaired = bucket.filter((p) => !paired.has(p.userId));
        if (unpaired.length === 0)
            continue;
        const bucketPairings = pairWithinBucket(unpaired, avoidRematches);
        for (const pair of bucketPairings) {
            pairings.push({
                tableNumber: tableNumber++,
                playerAId: pair.playerAId,
                playerBId: pair.playerBId,
            });
            paired.add(pair.playerAId);
            if (pair.playerBId)
                paired.add(pair.playerBId);
        }
        const remainingInBucket = unpaired.filter((p) => !paired.has(p.userId));
        if (remainingInBucket.length === 1) {
            const floater = remainingInBucket[0];
            const nextBucketIdx = pointValues.indexOf(points) + 1;
            if (nextBucketIdx < pointValues.length) {
                const nextPoints = pointValues[nextBucketIdx];
                const nextBucket = buckets.get(nextPoints);
                const nextUnpaired = nextBucket.filter((p) => !paired.has(p.userId));
                if (nextUnpaired.length > 0) {
                    const opponent = findBestOpponent(floater, nextUnpaired, avoidRematches);
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
function pairWithinBucket(players, avoidRematches) {
    const pairings = [];
    const unpaired = [...players];
    while (unpaired.length >= 2) {
        const playerA = unpaired.shift();
        const opponent = findBestOpponent(playerA, unpaired, avoidRematches);
        if (opponent) {
            pairings.push({
                playerAId: playerA.userId,
                playerBId: opponent.userId,
            });
            const idx = unpaired.findIndex((p) => p.userId === opponent.userId);
            unpaired.splice(idx, 1);
        }
        else {
            if (unpaired.length > 0) {
                const fallbackOpponent = unpaired.shift();
                pairings.push({
                    playerAId: playerA.userId,
                    playerBId: fallbackOpponent.userId,
                });
            }
        }
    }
    return pairings;
}
function findBestOpponent(player, candidates, avoidRematches) {
    if (candidates.length === 0)
        return null;
    if (avoidRematches) {
        const newOpponent = candidates.find((c) => !player.opponentIds.includes(c.userId));
        if (newOpponent)
            return newOpponent;
    }
    return candidates[0];
}
//# sourceMappingURL=pairing.js.map