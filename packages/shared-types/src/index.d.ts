export type OrgRole = 'OWNER' | 'STAFF' | 'PLAYER';
export interface Organization {
    id: string;
    name: string;
    slug: string;
    inviteCode: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface OrgMembership {
    id: string;
    userId: string;
    orgId: string;
    role: OrgRole;
    joinedAt: Date;
}
export type CreditReasonCode = 'PRIZE' | 'REFUND' | 'PURCHASE' | 'MANUAL_ADD' | 'MANUAL_DEDUCT' | 'EVENT_ENTRY' | 'EVENT_REFUND';
export interface CreditLedgerEntry {
    id: string;
    orgId: string;
    userId: string;
    amount: number;
    reasonCode: CreditReasonCode;
    memo?: string;
    relatedEventId?: string;
    createdBy: string;
    createdAt: Date;
}
export interface CreditBalance {
    userId: string;
    orgId: string;
    balance: number;
    lastTransactionAt?: Date;
}
export type GameType = 'ONE_PIECE_TCG' | 'AZUKI_TCG' | 'RIFTBOUND';
export type EventFormat = 'STANDARD' | 'DRAFT' | 'SEALED' | 'CONSTRUCTED' | 'SUPER_PRE_RELEASE' | 'PRE_RELEASE';
export type EventStatus = 'DRAFT' | 'SCHEDULED' | 'REGISTRATION_CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export interface Event {
    id: string;
    orgId: string;
    name: string;
    game: GameType;
    format: EventFormat;
    status: EventStatus;
    description?: string;
    startAt: Date;
    endAt?: Date;
    maxPlayers?: number;
    entryFeeCents?: number;
    requiresDecklist: boolean;
    allowLateRegistration: boolean;
    roundsPlanned?: number;
    currentRound?: number;
    totalPrizeCredits?: number;
    prizesDistributed?: boolean;
    prizesDistributedAt?: Date;
    prizesDistributedBy?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Entry {
    id: string;
    eventId: string;
    userId: string;
    registeredAt: Date;
    checkedInAt?: Date;
    droppedAt?: Date;
    droppedAfterRound?: number;
    decklistId?: string;
}
export interface Decklist {
    id: string;
    entryId: string;
    userId: string;
    deckName?: string;
    mainDeckUrl?: string;
    mainDeckJson?: Record<string, unknown>;
    lockedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type RoundStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export interface Round {
    id: string;
    eventId: string;
    roundNumber: number;
    status: RoundStatus;
    startAt?: Date;
    endAt?: Date;
    timerSeconds?: number;
    createdAt: Date;
    updatedAt: Date;
}
export type MatchResult = 'PLAYER_A_WIN' | 'PLAYER_B_WIN' | 'DRAW' | 'INTENTIONAL_DRAW' | 'DOUBLE_LOSS' | 'PLAYER_A_DQ' | 'PLAYER_B_DQ' | null;
export interface Match {
    id: string;
    roundId: string;
    tableNumber: number;
    playerAId: string;
    playerBId?: string;
    result?: MatchResult;
    gamesWonA?: number;
    gamesWonB?: number;
    reportedBy?: string;
    confirmedBy?: string;
    reportedAt?: Date;
    overriddenBy?: string;
    overriddenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface PlayerStanding {
    userId: string;
    userName: string;
    rank: number;
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
    isDropped: boolean;
    droppedAfterRound?: number;
}
export interface StandingSnapshot {
    id: string;
    eventId: string;
    roundNumber: number;
    standings: PlayerStanding[];
    createdAt: Date;
}
export interface PairingRequest {
    eventId: string;
    roundNumber: number;
    playerIds: string[];
}
export interface Pairing {
    tableNumber: number;
    playerAId: string;
    playerBId?: string;
    playerAName?: string;
    playerBName?: string;
}
export interface PairingResult {
    roundNumber: number;
    pairings: Pairing[];
    byePlayerId?: string;
}
export type NotificationPlatform = 'IOS' | 'ANDROID' | 'WEB';
export interface NotificationToken {
    id: string;
    userId: string;
    platform: NotificationPlatform;
    token: string;
    createdAt: Date;
    updatedAt: Date;
}
export type NotificationType = 'PAIRINGS_POSTED' | 'ROUND_STARTED' | 'ROUND_ENDING_SOON' | 'ROUND_ENDED' | 'EVENT_STARTING_SOON' | 'EVENT_CANCELLED' | 'ANNOUNCEMENT';
export interface PushNotificationPayload {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
}
export type AuditAction = 'CREDIT_ADJUST' | 'MATCH_OVERRIDE' | 'ROUND_REPAIR' | 'BYE_ASSIGN' | 'PLAYER_DROP' | 'PLAYER_LATE_ADD' | 'EVENT_CANCEL' | 'DECKLIST_LOCK' | 'RESULT_OVERRIDE';
export interface AuditLog {
    id: string;
    orgId: string;
    action: AuditAction;
    performedBy: string;
    targetUserId?: string;
    targetEventId?: string;
    targetMatchId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface SignupRequest {
    email: string;
    password: string;
    name: string;
    inviteCode: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface AuthResponse {
    user: User;
    token: string;
    orgMembership: OrgMembership;
}
export interface CreditAdjustRequest {
    userId: string;
    amount: number;
    reasonCode: CreditReasonCode;
    memo?: string;
}
export interface CreditBalanceResponse {
    balance: number;
    recentTransactions: CreditLedgerEntry[];
}
export interface CreateEventRequest {
    name: string;
    game: GameType;
    format: EventFormat;
    startAt: string;
    maxPlayers?: number;
    entryFeeCents?: number;
    requiresDecklist?: boolean;
    description?: string;
    totalPrizeCredits?: number;
}
export interface RegisterForEventRequest {
    eventId: string;
    decklistId?: string;
}
export interface CheckInRequest {
    eventId: string;
    userId: string;
}
export interface StartEventRequest {
    eventId: string;
}
export interface CreateNextRoundRequest {
    eventId: string;
}
export interface ReportMatchResultRequest {
    matchId: string;
    result: MatchResult;
    gamesWonA: number;
    gamesWonB: number;
}
export interface DropPlayerRequest {
    entryId: string;
}
export interface RepairRoundRequest {
    roundId: string;
    reason: string;
}
export interface PrizeDistribution {
    userId: string;
    amount: number;
    placement: number;
}
export interface DistributePrizesRequest {
    eventId: string;
    distributions: PrizeDistribution[];
}
export interface StandingsResponse {
    eventId: string;
    currentRound: number;
    standings: PlayerStanding[];
    updatedAt: Date;
}
//# sourceMappingURL=index.d.ts.map