"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStandings = calculateStandings;
exports.getPlayerRecordsForPairing = getPlayerRecordsForPairing;
function calculateStandings(input) {
    const { playerIds, playerNames, matches, droppedPlayers = new Set() } = input;
    const playerStatsMap = new Map();
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
    for (const match of matches) {
        const { playerAId, playerBId, result, gamesWonA, gamesWonB } = match;
        if (!playerStatsMap.has(playerAId))
            continue;
        const playerA = playerStatsMap.get(playerAId);
        if (playerBId === null) {
            playerA.points += 3;
            playerA.matchWins += 1;
            playerA.receivedBye = true;
            continue;
        }
        if (!playerStatsMap.has(playerBId))
            continue;
        const playerB = playerStatsMap.get(playerBId);
        playerA.opponentIds.push(playerBId);
        playerB.opponentIds.push(playerAId);
        playerA.gameWins += gamesWonA;
        playerA.gameLosses += gamesWonB;
        playerB.gameWins += gamesWonB;
        playerB.gameLosses += gamesWonA;
        if (result === 'PLAYER_A_WIN') {
            playerA.points += 3;
            playerA.matchWins += 1;
            playerB.matchLosses += 1;
        }
        else if (result === 'PLAYER_B_WIN') {
            playerB.points += 3;
            playerB.matchWins += 1;
            playerA.matchLosses += 1;
        }
        else if (result === 'DRAW' || result === 'INTENTIONAL_DRAW') {
            playerA.points += 1;
            playerB.points += 1;
            playerA.matchDraws += 1;
            playerB.matchDraws += 1;
        }
        else if (result === 'DOUBLE_LOSS') {
            playerA.matchLosses += 1;
            playerB.matchLosses += 1;
        }
        else if (result === 'PLAYER_A_DQ') {
            playerB.points += 3;
            playerB.matchWins += 1;
            playerA.matchLosses += 1;
        }
        else if (result === 'PLAYER_B_DQ') {
            playerA.points += 3;
            playerA.matchWins += 1;
            playerB.matchLosses += 1;
        }
    }
    const standings = [];
    const omwMap = new Map();
    const gwMap = new Map();
    const ogwMap = new Map();
    for (const player of playerStatsMap.values()) {
        omwMap.set(player.userId, calculateOMW(player, playerStatsMap));
        gwMap.set(player.userId, calculateGW(player));
        ogwMap.set(player.userId, calculateOGW(player, playerStatsMap));
    }
    for (const player of playerStatsMap.values()) {
        const omwPercent = omwMap.get(player.userId) || 0;
        const gwPercent = gwMap.get(player.userId) || 0;
        const ogwPercent = ogwMap.get(player.userId) || 0;
        const oomwPercent = calculateOOMW(player, playerStatsMap, omwMap);
        standings.push({
            userId: player.userId,
            userName: player.userName,
            rank: 0,
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
    standings.sort((a, b) => {
        if (b.points !== a.points)
            return b.points - a.points;
        if (Math.abs(b.omwPercent - a.omwPercent) > 0.0001) {
            return b.omwPercent - a.omwPercent;
        }
        if (Math.abs(b.gwPercent - a.gwPercent) > 0.0001) {
            return b.gwPercent - a.gwPercent;
        }
        if (Math.abs(b.ogwPercent - a.ogwPercent) > 0.0001) {
            return b.ogwPercent - a.ogwPercent;
        }
        return b.oomwPercent - a.oomwPercent;
    });
    for (let i = 0; i < standings.length; i++) {
        standings[i].rank = i + 1;
    }
    return standings;
}
function calculateOMW(player, allPlayers) {
    if (player.opponentIds.length === 0)
        return 0.3333;
    let totalOpponentWinRate = 0;
    for (const opponentId of player.opponentIds) {
        const opponent = allPlayers.get(opponentId);
        if (!opponent)
            continue;
        const totalMatches = opponent.matchWins + opponent.matchLosses + opponent.matchDraws;
        if (totalMatches === 0) {
            totalOpponentWinRate += 0.3333;
            continue;
        }
        const winRate = (opponent.matchWins + 0.5 * opponent.matchDraws) / totalMatches;
        totalOpponentWinRate += Math.max(winRate, 0.3333);
    }
    return totalOpponentWinRate / player.opponentIds.length;
}
function calculateGW(player) {
    const totalGames = player.gameWins + player.gameLosses;
    if (totalGames === 0)
        return 0;
    return player.gameWins / totalGames;
}
function calculateOGW(player, allPlayers) {
    if (player.opponentIds.length === 0)
        return 0;
    let totalOpponentGW = 0;
    for (const opponentId of player.opponentIds) {
        const opponent = allPlayers.get(opponentId);
        if (!opponent)
            continue;
        totalOpponentGW += calculateGW(opponent);
    }
    return totalOpponentGW / player.opponentIds.length;
}
function calculateOOMW(player, allPlayers, omwMap) {
    if (player.opponentIds.length === 0)
        return 0.3333;
    let totalOpponentOMW = 0;
    for (const opponentId of player.opponentIds) {
        const opponent = allPlayers.get(opponentId);
        if (!opponent)
            continue;
        const opponentOMW = omwMap.get(opponentId) || 0.3333;
        totalOpponentOMW += opponentOMW;
    }
    return totalOpponentOMW / player.opponentIds.length;
}
function getPlayerRecordsForPairing(input) {
    const standings = calculateStandings(input);
    return standings.map((s) => {
        const playerStats = Array.from(input.matches.reduce((acc, match) => {
            if (match.playerAId === s.userId && match.playerBId) {
                acc.add(match.playerBId);
            }
            else if (match.playerBId === s.userId) {
                acc.add(match.playerAId);
            }
            return acc;
        }, new Set()));
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
//# sourceMappingURL=standings.js.map