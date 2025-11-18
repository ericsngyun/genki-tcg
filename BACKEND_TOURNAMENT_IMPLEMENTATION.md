# Tournament Flow Backend Implementation - Summary

This document summarizes the complete backend API implementation for the tournament participation flow.

## Implemented Features

### ✅ Player Match Result Reporting
**Endpoint**: `POST /matches/:matchId/report-result`
**Auth**: Player (must be participant)

Players can self-report their match results, which requires opponent confirmation.

**Features**:
- Validates player is a participant
- Only allows reporting in ACTIVE rounds
- Prevents reporting if match already confirmed
- Sets `reportedBy` field
- Emits real-time event

**Request**:
```json
{
  "result": "PLAYER_A_WIN",
  "gamesWonA": 2,
  "gamesWonB": 0
}
```

---

### ✅ Match Result Confirmation
**Endpoint**: `POST /matches/:matchId/confirm-result`
**Auth**: Player (must be opponent)

Opponents can confirm or dispute reported results.

**Features**:
- Validates opponent (not the reporter)
- Allows confirmation or dispute
- If disputed, allows counter-result submission
- Sets `confirmedBy` on confirmation
- Emits standings update on confirmation

**Request**:
```json
{
  "confirm": true
}
```

Or to dispute:
```json
{
  "confirm": false,
  "counterResult": "PLAYER_B_WIN",
  "counterGamesWonA": 0,
  "counterGamesWonB": 2
}
```

---

### ✅ Get Active Match
**Endpoint**: `GET /events/:eventId/my-active-match`
**Auth**: Player

Returns player's current match in the active round.

**Response**:
```json
{
  "match": {
    "id": "match_123",
    "roundId": "round_456",
    "roundNumber": 3,
    "tableNumber": 5,
    "opponent": {
      "id": "user_789",
      "name": "John Doe"
    },
    "result": null,
    "gamesWonA": 0,
    "gamesWonB": 0,
    "reportedBy": null,
    "confirmedBy": null,
    "iAmPlayerA": true
  }
}
```

---

### ✅ Player Drop/Retire
**Endpoint**: `POST /events/:eventId/drop`
**Auth**: Player

Allows players to drop themselves from a tournament.

**Features**:
- Marks `droppedAt` timestamp
- Records `droppedAfterRound`
- Prevents future pairings
- Existing results remain intact

**Request**:
```json
{
  "currentRound": 3
}
```

---

### ✅ Get Round Matches (Admin)
**Endpoint**: `GET /rounds/:roundId/matches`
**Auth**: OWNER, STAFF

Returns all matches for a round with status indicators.

**Response**:
```json
{
  "round": {
    "id": "round_123",
    "roundNumber": 3,
    "status": "ACTIVE"
  },
  "matches": [
    {
      "id": "match_1",
      "tableNumber": 1,
      "playerA": { "id": "u1", "name": "Alice" },
      "playerB": { "id": "u2", "name": "Bob" },
      "result": "PLAYER_A_WIN",
      "gamesWonA": 2,
      "gamesWonB": 0,
      "reportedBy": "u1",
      "confirmedBy": "u2",
      "status": "confirmed"
    }
  ]
}
```

**Status Values**:
- `pending` - No result reported
- `reported` - One player reported, awaiting confirmation
- `confirmed` - Both players agree
- `admin_override` - Admin manually set result

---

## Database Schema Support

The existing schema already supports all tournament features:

```prisma
model Match {
  reportedBy  String?    // Player who reported result
  confirmedBy String?    // Opponent who confirmed
  overriddenBy String?   // Admin who overrode result
  gamesWonA   Int?       // Supports Bo3
  gamesWonB   Int?       // Supports Bo3
}

model Entry {
  droppedAt         DateTime? // Player dropped
  droppedAfterRound Int?      // Round when dropped
}
```

---

## Real-time Updates

All match operations emit WebSocket events:
- `match:result:reported`
- `match:result:confirmed`
- `standings:updated`

---

## Bo3 (Best of 3) Support

The API supports Best of 3 through `gamesWonA` and `gamesWonB`:

**1v1 Games** (OPTCG, Azuki):
- Win: `{gamesWonA: 1, gamesWonB: 0}`
- Loss: `{gamesWonA: 0, gamesWonB: 1}`

**Bo3 Games** (Riftbound):
- 2-0 Win: `{gamesWonA: 2, gamesWonB: 0}`
- 2-1 Win: `{gamesWonA: 2, gamesWonB: 1}`

Frontend determines input method based on game type.

---

## Error Handling

All endpoints include comprehensive validation:
- ✅ Organization access control
- ✅ Match participant validation
- ✅ Round status checks
- ✅ Duplicate action prevention
- ✅ Descriptive error messages

---

## Security

- ✅ JWT authentication required
- ✅ Organization-level data isolation
- ✅ Role-based access control (Player vs Admin)
- ✅ Participant-only match reporting
- ✅ Opponent-only confirmation

---

## Files Modified/Created

### New Documentation
- `TOURNAMENT_FLOW_API.md` - Complete API documentation
- `SETUP.md` - Development environment setup guide
- `BACKEND_TOURNAMENT_IMPLEMENTATION.md` - This file

### Backend Code
- `apps/backend/src/matches/matches.service.ts` - Added player reporting methods
- `apps/backend/src/matches/matches.controller.ts` - Added player endpoints
- `apps/backend/src/events/events.service.ts` - Added playerDrop and getMyActiveMatch
- `apps/backend/src/events/events.controller.ts` - Added player endpoints
- `apps/backend/src/rounds/rounds.service.ts` - Added getMatches for admin
- `apps/backend/src/rounds/rounds.controller.ts` - Added GET /rounds/:id/matches

### Mobile App
- `apps/mobile/lib/api.ts` - Added new API client methods

### Configuration
- `.env.example` - Added REFRESH_TOKEN_SECRET

---

## Next Steps

### Backend
- [ ] Add unit tests for new endpoints
- [ ] Add E2E tests for tournament flow
- [ ] Add rate limiting for result reporting
- [ ] Add notifications for match reporting
- [ ] Implement dispute resolution workflow

### Mobile App UI
- [ ] Build active match card component
- [ ] Build match result reporting UI (Win/Loss buttons)
- [ ] Build match confirmation UI
- [ ] Build drop/retire dialog
- [ ] Update standings view for live updates
- [ ] Add Bo3 game entry UI for Riftbound

### Admin Web UI
- [ ] Build round management dashboard
- [ ] Build pairing results table
- [ ] Add Swiss bracket visualization
- [ ] Add bulk result entry
- [ ] Add dispute resolution UI

---

## Testing Checklist

### Player Flow
- [ ] Player can view active match
- [ ] Player can report match result
- [ ] Opponent receives notification
- [ ] Opponent can confirm result
- [ ] Opponent can dispute result
- [ ] Standings update after confirmation
- [ ] Player can drop from tournament
- [ ] Dropped players don't get paired

### Admin Flow
- [ ] Admin can view all round pairings
- [ ] Admin can see match statuses
- [ ] Admin can override results
- [ ] Admin can manually pair rounds
- [ ] Admin can drop players

### Edge Cases
- [ ] Can't report twice
- [ ] Can't confirm own report
- [ ] Can't report in non-active rounds
- [ ] Can't drop twice
- [ ] Proper handling of byes
- [ ] Proper handling of draws

---

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/matches/:id/report-result` | POST | Player | Report match result |
| `/matches/:id/confirm-result` | POST | Player | Confirm/dispute result |
| `/events/:id/my-active-match` | GET | Player | Get current match |
| `/events/:id/drop` | POST | Player | Drop from tournament |
| `/rounds/:id/matches` | GET | Admin | View all round matches |
| `/matches/:id/override` | POST | Admin | Override result |

---

## Match Status Flow

```
┌─────────┐
│ Pending │ (No result reported)
└────┬────┘
     │
     │ Player A reports
     ▼
┌──────────┐
│ Reported │ (Awaiting confirmation)
└────┬─────┘
     │
     ├──────► Player B confirms
     │        ▼
     │    ┌───────────┐
     │    │ Confirmed │ (Final)
     │    └───────────┘
     │
     └──────► Player B disputes
              ▼
          ┌──────────┐
          │ Disputed │ (Back to Reported with new values)
          └──────────┘

Admin can override at any time
              ▼
          ┌────────────────┐
          │ Admin Override │ (Final)
          └────────────────┘
```

---

## Environment Setup

Ensure `.env` contains:

```env
JWT_SECRET="<generated-secret>"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="<different-generated-secret>"
REFRESH_TOKEN_EXPIRES_IN="7d"
DATABASE_URL="postgresql://..."
```

Generate secrets:
```bash
openssl rand -base64 64
```

---

## Conclusion

The backend API for tournament participation is now complete and ready for frontend integration. All core features are implemented with proper security, validation, and real-time updates.

The architecture supports:
- Player self-reporting with confirmation
- Admin oversight and override capabilities
- Bo3 and 1v1 game formats
- Real-time updates via WebSockets
- Secure, organization-scoped access

Next phase: Build the mobile and admin UIs to consume these APIs.
