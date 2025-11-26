import { useEffect, useRef, useCallback } from 'react';
import { useEventSocket } from '../contexts/SocketContext';

/**
 * Optimized hook for real-time updates
 * - Uses refs to avoid re-subscriptions
 * - Debounces updates to prevent excessive refreshes
 * - Single effect for all subscriptions (better performance)
 */

interface UseRealtimeUpdatesOptions {
  eventId: string | null;
  onStandingsUpdated?: () => void;
  onPairingsPosted?: (roundNumber: number) => void;
  onRoundStarted?: (roundNumber: number) => void;
  onRoundEnded?: (roundNumber: number) => void;
  onMatchResultReported?: (matchId: string, tableNumber: number) => void;
  onTournamentCompleted?: () => void;
  debounceDelay?: number; // Default 300ms
}

/**
 * Performance-optimized real-time updates hook
 * Uses refs and single effect for better performance than multiple useEffects
 */
export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions) {
  const {
    eventId,
    onStandingsUpdated,
    onPairingsPosted,
    onRoundStarted,
    onRoundEnded,
    onMatchResultReported,
    onTournamentCompleted,
    debounceDelay = 300,
  } = options;

  const socketHooks = useEventSocket(eventId);

  // Store callbacks in ref to avoid re-subscription
  const callbacksRef = useRef({
    onStandingsUpdated,
    onPairingsPosted,
    onRoundStarted,
    onRoundEnded,
    onMatchResultReported,
    onTournamentCompleted,
  });

  // Update ref when callbacks change (without re-subscribing)
  useEffect(() => {
    callbacksRef.current = {
      onStandingsUpdated,
      onPairingsPosted,
      onRoundStarted,
      onRoundEnded,
      onMatchResultReported,
      onTournamentCompleted,
    };
  }, [
    onStandingsUpdated,
    onPairingsPosted,
    onRoundStarted,
    onRoundEnded,
    onMatchResultReported,
    onTournamentCompleted,
  ]);

  // Debounce timeouts ref
  const debounceTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper to create debounced callback
  const debounce = useCallback(
    (key: string, fn: () => void) => {
      const existing = debounceTimeoutsRef.current.get(key);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        fn();
        debounceTimeoutsRef.current.delete(key);
      }, debounceDelay);

      debounceTimeoutsRef.current.set(key, timeout);
    },
    [debounceDelay]
  );

  // Single effect for all subscriptions
  useEffect(() => {
    if (!eventId) return;

    const unsubscribers: Array<() => void> = [];

    // Standings updates
    if (callbacksRef.current.onStandingsUpdated) {
      const unsubscribe = socketHooks.onStandingsUpdated(() => {
        debounce('standings', () => callbacksRef.current.onStandingsUpdated?.());
      });
      unsubscribers.push(unsubscribe);
    }

    // Pairings posted
    if (callbacksRef.current.onPairingsPosted) {
      const unsubscribe = socketHooks.onPairingsPosted((data) => {
        debounce('pairings', () =>
          callbacksRef.current.onPairingsPosted?.(data.roundNumber)
        );
      });
      unsubscribers.push(unsubscribe);
    }

    // Round started
    if (callbacksRef.current.onRoundStarted) {
      const unsubscribe = socketHooks.onRoundStarted((data) => {
        debounce(`round-start-${data.roundNumber}`, () =>
          callbacksRef.current.onRoundStarted?.(data.roundNumber)
        );
      });
      unsubscribers.push(unsubscribe);
    }

    // Round ended
    if (callbacksRef.current.onRoundEnded) {
      const unsubscribe = socketHooks.onRoundEnded((data) => {
        debounce(`round-end-${data.roundNumber}`, () =>
          callbacksRef.current.onRoundEnded?.(data.roundNumber)
        );
      });
      unsubscribers.push(unsubscribe);
    }

    // Match result reported (NO debounce - immediate for match confirmation)
    if (callbacksRef.current.onMatchResultReported) {
      const unsubscribe = socketHooks.onMatchResultReported((data) => {
        // Immediate callback - players need instant feedback when opponent reports
        callbacksRef.current.onMatchResultReported?.(data.matchId, data.tableNumber);
      });
      unsubscribers.push(unsubscribe);
    }

    // Tournament completed
    if (callbacksRef.current.onTournamentCompleted) {
      const unsubscribe = socketHooks.onTournamentCompleted(() => {
        debounce('tournament-complete', () =>
          callbacksRef.current.onTournamentCompleted?.()
        );
      });
      unsubscribers.push(unsubscribe);
    }

    // Cleanup
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      debounceTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      debounceTimeoutsRef.current.clear();
    };
    // Only re-run if eventId or socket hooks change
    // Callbacks are in ref so they won't trigger re-subscription
  }, [eventId, debounce, socketHooks.onStandingsUpdated, socketHooks.onPairingsPosted, socketHooks.onRoundStarted, socketHooks.onRoundEnded, socketHooks.onMatchResultReported, socketHooks.onTournamentCompleted]);
}
