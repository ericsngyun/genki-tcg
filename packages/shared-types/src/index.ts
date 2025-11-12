// Shared types for Genki TCG platform

// ============================================================================
// Organization & Users
// ============================================================================

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

// ============================================================================
// Credits
// ============================================================================

export type CreditReasonCode =
  | 'PRIZE'
  | 'REFUND'
  | 'PURCHASE'
  | 'MANUAL_ADD'
  | 'MANUAL_DEDUCT'
  | 'EVENT_ENTRY'
  | 'EVENT_REFUND';

export interface CreditLedgerEntry {
  id: string;
  orgId: string;
  userId: string;
  amount: number; // Signed: positive = credit, negative = debit
  reasonCode: CreditReasonCode;
  memo?: string;
  relatedEventId?: string;
  createdBy: string; // User ID of staff who made the adjustment
  createdAt: Date;
}

export interface CreditBalance {
  userId: string;
  orgId: string;
  balance: number;
  lastTransactionAt?: Date;
}

// ============================================================================
// Events & Tournaments
// ============================================================================

export type GameType = 'ONE_PIECE_TCG' | 'AZUKI_TCG' | 'RIFTBOUND';

export type EventFormat =
  | 'STANDARD'
  | 'DRAFT'
  | 'SEALED'
  | 'CONSTRUCTED'
  | 'SUPER_PRE_RELEASE'
  | 'PRE_RELEASE';

export type EventStatus =
  | 'DRAFT' // Being created
  | 'SCHEDULED' // Published, accepting registrations
  | 'REGISTRATION_CLOSED' // No more registrations
  | 'IN_PROGRESS' // Event started
  | 'COMPLETED' // Event finished
  | 'CANCELLED';

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
  roundsPlanned?: number; // Auto-calculated based on player count
  currentRound?: number;
  totalPrizeCredits?: number;
  prizesDistributed?: boolean;
  prizesDistributedAt?: Date;
  prizesDistributedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Entries & Registration
// ============================================================================

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

// ============================================================================
// Rounds & Matches
// ============================================================================

export type RoundStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Round {
  id: string;
  eventId: string;
  roundNumber: number;
  status: RoundStatus;
  startAt?: Date;
  endAt?: Date;
  timerSeconds?: number; // Round time limit
  createdAt: Date;
  updatedAt: Date;
}

export type MatchResult =
  | 'PLAYER_A_WIN'
  | 'PLAYER_B_WIN'
  | 'DRAW'
  | 'INTENTIONAL_DRAW'
  | 'DOUBLE_LOSS'
  | 'PLAYER_A_DQ'
  | 'PLAYER_B_DQ'
  | null;

export interface Match {
  id: string;
  roundId: string;
  tableNumber: number;
  playerAId: string;
  playerBId?: string; // Null for bye
  result?: MatchResult;
  gamesWonA?: number;
  gamesWonB?: number;
  reportedBy?: string; // User ID who reported
  confirmedBy?: string; // User ID who confirmed (for player self-report)
  reportedAt?: Date;
  overriddenBy?: string; // Staff who overrode result
  overriddenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Standings & Statistics
// ============================================================================

export interface PlayerStanding {
  userId: string;
  userName: string;
  rank: number;
  points: number; // Match points: W=3, D/ID=1, L=0
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  omwPercent: number; // Opponent Match Win % (floor 33.33%)
  gwPercent: number; // Game Win %
  ogwPercent: number; // Opponent Game Win %
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

// ============================================================================
// Pairing Types
// ============================================================================

export interface PairingRequest {
  eventId: string;
  roundNumber: number;
  playerIds: string[]; // Active players (checked in, not dropped)
}

export interface Pairing {
  tableNumber: number;
  playerAId: string;
  playerBId?: string; // Null = bye
  playerAName?: string;
  playerBName?: string;
}

export interface PairingResult {
  roundNumber: number;
  pairings: Pairing[];
  byePlayerId?: string;
}

// ============================================================================
// Notifications
// ============================================================================

export type NotificationPlatform = 'IOS' | 'ANDROID' | 'WEB';

export interface NotificationToken {
  id: string;
  userId: string;
  platform: NotificationPlatform;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType =
  | 'PAIRINGS_POSTED'
  | 'ROUND_STARTED'
  | 'ROUND_ENDING_SOON'
  | 'ROUND_ENDED'
  | 'EVENT_STARTING_SOON'
  | 'EVENT_CANCELLED'
  | 'ANNOUNCEMENT';

export interface PushNotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Audit Log
// ============================================================================

export type AuditAction =
  | 'CREDIT_ADJUST'
  | 'MATCH_OVERRIDE'
  | 'ROUND_REPAIR'
  | 'BYE_ASSIGN'
  | 'PLAYER_DROP'
  | 'PLAYER_LATE_ADD'
  | 'EVENT_CANCEL'
  | 'DECKLIST_LOCK'
  | 'RESULT_OVERRIDE';

export interface AuditLog {
  id: string;
  orgId: string;
  action: AuditAction;
  performedBy: string; // User ID
  targetUserId?: string;
  targetEventId?: string;
  targetMatchId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

// Auth
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

// Credits
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

// Events
export interface CreateEventRequest {
  name: string;
  game: GameType;
  format: EventFormat;
  startAt: string; // ISO date
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

// Rounds & Matches
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

// Standings
export interface StandingsResponse {
  eventId: string;
  currentRound: number;
  standings: PlayerStanding[];
  updatedAt: Date;
}
