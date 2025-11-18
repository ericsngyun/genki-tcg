import type { PlayerStanding } from '@genki-tcg/shared-types';
export interface MatchRecord {
    playerAId: string;
    playerBId: string | null;
    result: 'PLAYER_A_WIN' | 'PLAYER_B_WIN' | 'DRAW' | 'INTENTIONAL_DRAW' | 'DOUBLE_LOSS' | 'PLAYER_A_DQ' | 'PLAYER_B_DQ' | null;
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
export declare function calculateStandings(input: StandingsInput): PlayerStanding[];
export declare function getPlayerRecordsForPairing(input: StandingsInput): Array<{
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
}>;
//# sourceMappingURL=standings.d.ts.map