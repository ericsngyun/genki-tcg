import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface EventSocketCallbacks {
  onPairingsPosted?: (data: { eventId: string; roundNumber: number }) => void;
  onStandingsUpdated?: (data: { eventId: string }) => void;
  onRoundStarted?: (data: { eventId: string; roundNumber: number }) => void;
  onRoundEnded?: (data: { eventId: string; roundNumber: number }) => void;
  onMatchResultReported?: (data: {
    eventId: string;
    matchId: string;
    tableNumber: number;
  }) => void;
  onTimerUpdate?: (data: {
    eventId: string;
    roundNumber: number;
    secondsRemaining: number;
  }) => void;
  onAnnouncement?: (data: {
    eventId: string;
    title: string;
    message: string;
  }) => void;
  onError?: (error: { message: string }) => void;
}

export function useEventSocket(
  eventId: string | null,
  callbacks: EventSocketCallbacks
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!eventId) return;

    // SECURITY: Get access token for WebSocket authentication
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('No access token found, WebSocket connection will be rejected');
      callbacks.onError?.({ message: 'Authentication required for real-time updates' });
      return;
    }

    // Create socket connection with JWT authentication
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      // Join event room
      socket.emit('join-event', { eventId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Handle authentication errors from backend
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
      callbacks.onError?.(error);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      callbacks.onError?.({ message: error.message });
    });

    // Register event listeners
    if (callbacks.onPairingsPosted) {
      socket.on('pairings-posted', callbacks.onPairingsPosted);
    }

    if (callbacks.onStandingsUpdated) {
      socket.on('standings-updated', callbacks.onStandingsUpdated);
    }

    if (callbacks.onRoundStarted) {
      socket.on('round-started', callbacks.onRoundStarted);
    }

    if (callbacks.onRoundEnded) {
      socket.on('round-ended', callbacks.onRoundEnded);
    }

    if (callbacks.onMatchResultReported) {
      socket.on('match-result-reported', callbacks.onMatchResultReported);
    }

    if (callbacks.onTimerUpdate) {
      socket.on('timer-update', callbacks.onTimerUpdate);
    }

    if (callbacks.onAnnouncement) {
      socket.on('announcement', callbacks.onAnnouncement);
    }

    // Cleanup on unmount
    return () => {
      socket.emit('leave-event', { eventId });
      socket.disconnect();
    };
  }, [eventId, callbacks]);

  return socketRef.current;
}
