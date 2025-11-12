// Internal types for tournament logic

export interface PlayerRecord {
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
  opponentIds: string[]; // List of all previous opponent user IDs
}

export interface PairingInput {
  players: PlayerRecord[];
  avoidRematches: boolean;
}

export interface PairingOutput {
  pairings: Array<{
    tableNumber: number;
    playerAId: string;
    playerBId: string | null; // null = bye
  }>;
  byePlayerId: string | null;
}
