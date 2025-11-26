import { io, Socket } from 'socket.io-client';
import { secureStorage } from './secure-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
// Extract WebSocket URL from API URL (same host, different protocol)
// Handle both http:// and https://, convert to ws:// and wss://
const WS_URL = API_URL.replace(/^https?/, (match) => match === 'https' ? 'wss' : 'ws');

/**
 * Create a Socket.IO connection with authentication
 * Must use 'websocket' transport for React Native
 */
export async function createSocket(): Promise<Socket> {
  const token = await secureStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No access token found. Please log in first.');
  }

  const socket = io(WS_URL, {
    transports: ['websocket', 'polling'], // WebSocket first, fallback to polling
    auth: {
      token,
    },
    // Add Authorization header as fallback
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
    // Auto-reconnect settings
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Update auth token if it changes (e.g., after refresh)
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('error', (error: { message: string }) => {
    console.error('Socket error:', error.message);
  });

  return socket;
}

/**
 * Event types emitted by the backend
 */
export interface PairingsPostedEvent {
  eventId: string;
  roundNumber: number;
  timestamp: Date;
}

export interface StandingsUpdatedEvent {
  eventId: string;
  timestamp: Date;
}

export interface RoundStartedEvent {
  eventId: string;
  roundNumber: number;
  timestamp: Date;
}

export interface RoundEndedEvent {
  eventId: string;
  roundNumber: number;
  timestamp: Date;
}

export interface MatchResultReportedEvent {
  eventId: string;
  matchId: string;
  tableNumber: number;
  timestamp: Date;
}

export interface TournamentCompletedEvent {
  eventId: string;
  timestamp: Date;
}

export interface TimerUpdateEvent {
  eventId: string;
  roundNumber: number;
  secondsRemaining: number;
}

export interface AnnouncementEvent {
  eventId: string;
  title: string;
  message: string;
  timestamp: Date;
}

/**
 * Socket event names (must match backend)
 */
export const SOCKET_EVENTS = {
  PAIRINGS_POSTED: 'pairings-posted',
  STANDINGS_UPDATED: 'standings-updated',
  ROUND_STARTED: 'round-started',
  ROUND_ENDED: 'round-ended',
  MATCH_RESULT_REPORTED: 'match-result-reported',
  TOURNAMENT_COMPLETED: 'tournament-completed',
  TIMER_UPDATE: 'timer-update',
  ANNOUNCEMENT: 'announcement',
  JOIN_EVENT: 'join-event',
  LEAVE_EVENT: 'leave-event',
} as const;

