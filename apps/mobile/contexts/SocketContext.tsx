import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { createSocket, SOCKET_EVENTS, type PairingsPostedEvent, type StandingsUpdatedEvent, type RoundStartedEvent, type RoundEndedEvent, type MatchResultReportedEvent, type TimerUpdateEvent, type AnnouncementEvent, type TournamentCompletedEvent } from '../lib/socket';
import { secureStorage } from '../lib/secure-storage';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  onPairingsPosted: (callback: (data: PairingsPostedEvent) => void) => () => void;
  onStandingsUpdated: (callback: (data: StandingsUpdatedEvent) => void) => () => void;
  onRoundStarted: (callback: (data: RoundStartedEvent) => void) => () => void;
  onRoundEnded: (callback: (data: RoundEndedEvent) => void) => () => void;
  onMatchResultReported: (callback: (data: MatchResultReportedEvent) => void) => () => void;
  onTimerUpdate: (callback: (data: TimerUpdateEvent) => void) => () => void;
  onAnnouncement: (callback: (data: AnnouncementEvent) => void) => () => void;
  onTournamentCompleted: (callback: (data: TournamentCompletedEvent) => void) => () => void;
  reconnect: () => Promise<void>;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      return; // Already connected
    }

    if (isConnecting) {
      return; // Already connecting
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Check if user is logged in
      const token = await secureStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        setIsConnecting(false);
        return;
      }

      // Create new socket connection
      const newSocket = await createSocket();
      socketRef.current = newSocket;
      setSocket(newSocket);

      // Set up connection handlers
      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        // Don't set error for intentional disconnects
        if (reason === 'io client disconnect' || reason === 'io server disconnect') {
          setError(null);
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setError(err.message);
        setIsConnecting(false);
      });

      newSocket.on('error', (err: { message: string }) => {
        console.error('Socket error:', err.message);
        setError(err.message);
      });
    } catch (err: any) {
      console.error('Failed to create socket:', err);
      setError(err.message || 'Failed to connect to server');
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setError(null);
    }
  }, []);

  const reconnect = useCallback(async () => {
    disconnect();
    await connect();
  }, [connect, disconnect]);

  // Auto-connect when component mounts if user is authenticated
  useEffect(() => {
    secureStorage.getItem('access_token').then((token) => {
      if (token) {
        connect();
      }
    });

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  const joinEvent = useCallback((eventId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_EVENT, { eventId });
      console.log('Joined event room:', eventId);
    } else {
      console.warn('Cannot join event: socket not connected');
    }
  }, []);

  const leaveEvent = useCallback((eventId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_EVENT, { eventId });
      console.log('Left event room:', eventId);
    }
  }, []);

  // Event listener helpers
  const onPairingsPosted = useCallback((callback: (data: PairingsPostedEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.PAIRINGS_POSTED, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.PAIRINGS_POSTED, callback);
    };
  }, []);

  const onStandingsUpdated = useCallback((callback: (data: StandingsUpdatedEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.STANDINGS_UPDATED, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.STANDINGS_UPDATED, callback);
    };
  }, []);

  const onRoundStarted = useCallback((callback: (data: RoundStartedEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.ROUND_STARTED, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.ROUND_STARTED, callback);
    };
  }, []);

  const onRoundEnded = useCallback((callback: (data: RoundEndedEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.ROUND_ENDED, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.ROUND_ENDED, callback);
    };
  }, []);

  const onMatchResultReported = useCallback((callback: (data: MatchResultReportedEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.MATCH_RESULT_REPORTED, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.MATCH_RESULT_REPORTED, callback);
    };
  }, []);

  const onTimerUpdate = useCallback((callback: (data: TimerUpdateEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.TIMER_UPDATE, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.TIMER_UPDATE, callback);
    };
  }, []);

  const onAnnouncement = useCallback((callback: (data: AnnouncementEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.ANNOUNCEMENT, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.ANNOUNCEMENT, callback);
    };
  }, []);

  const onTournamentCompleted = useCallback((callback: (data: TournamentCompletedEvent) => void) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on(SOCKET_EVENTS.TOURNAMENT_COMPLETED, callback);
    return () => {
      socketRef.current?.off(SOCKET_EVENTS.TOURNAMENT_COMPLETED, callback);
    };
  }, []);

  const value: SocketContextValue = {
    socket,
    isConnected,
    isConnecting,
    error,
    joinEvent,
    leaveEvent,
    onPairingsPosted,
    onStandingsUpdated,
    onRoundStarted,
    onRoundEnded,
    onMatchResultReported,
    onTimerUpdate,
    onAnnouncement,
    onTournamentCompleted,
    reconnect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

/**
 * Hook to listen to events for a specific tournament event
 * Automatically joins/leaves the event room
 */
export function useEventSocket(eventId: string | null) {
  const { joinEvent, leaveEvent, onPairingsPosted, onStandingsUpdated, onRoundStarted, onRoundEnded, onMatchResultReported, onTimerUpdate, onAnnouncement, onTournamentCompleted } = useSocket();

  useEffect(() => {
    if (!eventId) return;

    // Join event room when eventId is provided
    joinEvent(eventId);

    // Leave event room on cleanup
    return () => {
      leaveEvent(eventId);
    };
  }, [eventId, joinEvent, leaveEvent]);

  return {
    onPairingsPosted,
    onStandingsUpdated,
    onRoundStarted,
    onRoundEnded,
    onMatchResultReported,
    onTimerUpdate,
    onAnnouncement,
    onTournamentCompleted,
  };
}

