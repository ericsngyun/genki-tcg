# Real-Time Updates Implementation for Mobile App

## Overview

The mobile app now has **full real-time update support** via WebSocket connections! Players no longer need to manually refresh to see:
- ✅ New rounds/pairings posted
- ✅ Updated standings
- ✅ Match results
- ✅ Tournament completion
- ✅ Round start/end events

## Architecture

### Backend (Already Implemented)
- **Socket.IO** WebSocket server (`apps/backend/src/realtime/realtime.gateway.ts`)
- Emits events to event-specific rooms
- JWT-authenticated connections

### Mobile App (Newly Implemented)
- **Socket.IO Client** (`apps/mobile/lib/socket.ts`)
- **Socket Context Provider** (`apps/mobile/contexts/SocketContext.tsx`)
- **Event Hook** (`useEventSocket`) for easy integration

## Implementation Details

### 1. Socket Connection

The socket automatically connects when:
- User is authenticated (has access token)
- App mounts with `SocketProvider` in root layout

Connection settings:
- Uses WebSocket transport (required for React Native)
- Falls back to polling if WebSocket fails
- Auto-reconnects on disconnect
- JWT-authenticated

### 2. Event Room System

Players join event-specific rooms to receive updates:
- When viewing standings: `join-event` with `eventId`
- When leaving screen: `leave-event` to stop receiving updates

This ensures:
- Players only get updates for events they're viewing
- Reduced bandwidth usage
- Better battery life

### 3. Available Events

| Event | When Emitted | Use Case |
|-------|-------------|----------|
| `pairings-posted` | New round created | Show notification, refresh pairings screen |
| `standings-updated` | Match results confirmed, standings change | Auto-refresh standings |
| `round-started` | Round marked as ACTIVE | Update UI state |
| `round-ended` | Round marked as COMPLETED | Show round end notification |
| `match-result-reported` | Player reports match result | Update match display |
| `tournament-completed` | Tournament finishes | Show completion alert, final standings |
| `timer-update` | Round timer counts down | Show live timer |
| `announcement` | Staff makes announcement | Show announcement banner |

## Usage Examples

### Example 1: Standings Auto-Update

```typescript
// apps/mobile/app/standings.tsx
import { useEventSocket } from '../contexts/SocketContext';

export default function StandingsScreen() {
  const eventId = 'event-123';
  
  // Automatically joins event room
  const { onStandingsUpdated, onTournamentCompleted } = useEventSocket(eventId);
  
  useEffect(() => {
    // Listen for standings updates
    const unsubscribe = onStandingsUpdated(() => {
      console.log('Standings updated - refreshing');
      loadStandings(); // Refresh your data
    });
    return unsubscribe; // Cleanup on unmount
  }, [onStandingsUpdated]);
  
  // Listen for tournament completion
  useEffect(() => {
    const unsubscribe = onTournamentCompleted(() => {
      Alert.alert('Tournament Complete!', 'Check final standings');
      loadStandings();
    });
    return unsubscribe;
  }, [onTournamentCompleted]);
}
```

### Example 2: Pairings Screen

```typescript
// apps/mobile/app/pairings.tsx
import { useEventSocket } from '../contexts/SocketContext';

export default function PairingsScreen() {
  const eventId = 'event-123';
  const { onPairingsPosted, onRoundStarted } = useEventSocket(eventId);
  
  useEffect(() => {
    // When new pairings are posted
    const unsubscribePairings = onPairingsPosted((data) => {
      console.log(`Round ${data.roundNumber} pairings posted!`);
      loadPairings(); // Refresh pairings
      
      // Show notification
      Alert.alert(
        'New Round!',
        `Round ${data.roundNumber} pairings are ready`,
        [{ text: 'View Pairings' }]
      );
    });
    
    const unsubscribeRoundStart = onRoundStarted((data) => {
      console.log(`Round ${data.roundNumber} started!`);
      // Update timer display, etc.
    });
    
    return () => {
      unsubscribePairings();
      unsubscribeRoundStart();
    };
  }, [onPairingsPosted, onRoundStarted]);
}
```

### Example 3: Match Details Screen

```typescript
// apps/mobile/app/match-details.tsx
import { useEventSocket } from '../contexts/SocketContext';

export default function MatchDetailsScreen() {
  const eventId = 'event-123';
  const { onMatchResultReported } = useEventSocket(eventId);
  
  useEffect(() => {
    // When opponent reports result
    const unsubscribe = onMatchResultReported((data) => {
      if (data.matchId === currentMatchId) {
        console.log('Opponent reported result!');
        loadMatchDetails(); // Refresh to see reported result
      }
    });
    return unsubscribe;
  }, [onMatchResultReported]);
}
```

## Features

### ✅ Automatic Reconnection
- If connection drops, automatically reconnects
- Up to 5 reconnection attempts with exponential backoff
- Maintains event room subscriptions after reconnection

### ✅ Connection Status
- Check connection status with `useSocket()`:
```typescript
const { isConnected, isConnecting, error } = useSocket();
```

### ✅ Error Handling
- Connection errors are caught and logged
- Failed connections don't crash the app
- Graceful degradation (app still works without real-time)

### ✅ Battery Efficient
- Only connects when authenticated
- Automatically leaves event rooms when screen unmounts
- Uses WebSocket (more efficient than polling)

## Testing

To test real-time updates:

1. **Start Tournament:**
   - Create event in admin web
   - Register players
   - Start first round

2. **Open Mobile App:**
   - Login as player
   - Navigate to standings screen
   - Verify socket connects (check console logs)

3. **Trigger Updates:**
   - In admin web: Report match results
   - Mobile app should auto-refresh standings
   - No manual pull-to-refresh needed!

4. **Test Tournament Completion:**
   - Complete final round
   - Mobile app shows completion alert
   - Final standings displayed automatically

## Troubleshooting

### Socket Not Connecting
- Check that user is authenticated (has access token)
- Verify `EXPO_PUBLIC_API_URL` environment variable is set
- Check console logs for connection errors
- Ensure backend WebSocket server is running

### Not Receiving Updates
- Verify event room was joined (check console logs)
- Ensure you're listening to the correct event name
- Check that backend is emitting the event
- Verify you're in the correct organization

### Connection Drops Frequently
- Check network stability
- Verify backend WebSocket server health
- Check for CORS issues in backend logs
- Ensure JWT token hasn't expired

## Future Enhancements

Potential improvements:
- [ ] Push notifications for important events (tournament complete, new round)
- [ ] Offline queue for missed updates
- [ ] Visual indicator showing connection status
- [ ] Retry mechanism for failed API calls triggered by socket events
- [ ] Background connection maintenance

## Files Created/Modified

### New Files
- `apps/mobile/lib/socket.ts` - Socket.IO client setup
- `apps/mobile/contexts/SocketContext.tsx` - React context for socket management

### Modified Files
- `apps/mobile/app/_layout.tsx` - Added SocketProvider wrapper
- `apps/mobile/app/standings.tsx` - Added real-time updates example
- `apps/backend/src/realtime/realtime.gateway.ts` - Added tournament completion event
- `apps/backend/src/rounds/rounds.service.ts` - Emits tournament completion event

---

**Status:** ✅ Fully Implemented and Ready to Use!

Players can now enjoy automatic updates without manually refreshing! 🎉

