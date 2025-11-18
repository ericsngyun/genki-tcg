# Tournament Flow API Documentation

This document outlines the complete API for the tournament participation flow, including player self-reporting and admin management.

## Tournament Player Statuses

The tournament flow follows these states:
1. **Applied** - Player has registered (`Entry.registeredAt` is set)
2. **Successful/Checked In** - Player has checked in (`Entry.checkedInAt` is set)
3. **Participating** - Event status is `IN_PROGRESS` and player is checked in
4. **Dropped** - Player has retired (`Entry.droppedAt` is set)

## API Endpoints

### Player Endpoints

#### 1. Get My Active Match
```
GET /events/:eventId/my-active-match
Auth: Required (Player)
```

Returns the player's current active match for the ongoing round.

**Response:**
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
    "result": null | "PLAYER_A_WIN" | "PLAYER_B_WIN" | "DRAW",
    "gamesWonA": 0,
    "gamesWonB": 0,
    "reportedBy": null | "user_id",
    "confirmedBy": null | "user_id",
    "iAmPlayerA": true
  }
}
```

**Use Case:** Display active match card with opponent info and result reporting UI

---

#### 2. Report Match Result (Player Self-Report)
```
POST /matches/:matchId/report-result
Auth: Required (Player - must be participant in match)
```

Allows a player to report their match result. Requires confirmation from opponent.

**Request Body:**
```json
{
  "result": "PLAYER_A_WIN" | "PLAYER_B_WIN" | "DRAW",
  "gamesWonA": 2,
  "gamesWonB": 0
}
```

**Response:**
```json
{
  "match": {
    "id": "match_123",
    "result": "PLAYER_A_WIN",
    "gamesWonA": 2,
    "gamesWonB": 0,
    "reportedBy": "user_123",
    "confirmedBy": null,
    "requiresConfirmation": true
  }
}
```

**Business Logic:**
- Player must be either playerA or playerB in the match
- Match must be in an ACTIVE round
- Sets `reportedBy` to current user
- Does NOT set `confirmedBy` yet (awaits opponent confirmation)
- Stores result but marks as "pending confirmation"

---

#### 3. Confirm Match Result (Opponent Verification)
```
POST /matches/:matchId/confirm-result
Auth: Required (Player - must be opponent)
```

Allows the opponent to confirm or dispute a reported match result.

**Request Body:**
```json
{
  "confirm": true,
  "counterResult": "PLAYER_B_WIN" | null,  // Only if confirm = false
  "counterGamesWonA": 0 | null,
  "counterGamesWonB": 2 | null
}
```

**Response:**
```json
{
  "match": {
    "id": "match_123",
    "result": "PLAYER_A_WIN",
    "confirmedBy": "user_456",
    "status": "confirmed" | "disputed"
  }
}
```

**Business Logic:**
- Player must be the opponent (NOT the reporter)
- If `confirm: true`, sets `confirmedBy` and finalizes result
- If `confirm: false`, flags match as disputed and notifies admin
- Disputed matches require admin override

---

#### 4. Drop from Tournament (Player Retire)
```
POST /events/:eventId/drop
Auth: Required (Player)
```

Allows a player to drop themselves from the tournament.

**Request Body:**
```json
{
  "currentRound": 3  // Optional: specify round after which they're dropping
}
```

**Response:**
```json
{
  "entry": {
    "id": "entry_123",
    "droppedAt": "2025-01-15T10:30:00Z",
    "droppedAfterRound": 3
  },
  "message": "Successfully dropped from tournament"
}
```

**Business Logic:**
- Marks `Entry.droppedAt` with current timestamp
- Sets `droppedAfterRound` to current round number
- Player won't be paired in future rounds
- Existing match results remain intact

---

### Admin Endpoints

#### 5. Get All Matches for Round
```
GET /rounds/:roundId/matches
Auth: Required (OWNER, STAFF)
```

Returns all matches/pairings for a specific round with current status.

**Response:**
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
    },
    {
      "id": "match_2",
      "tableNumber": 2,
      "playerA": { "id": "u3", "name": "Charlie" },
      "playerB": { "id": "u4", "name": "Diana" },
      "result": null,
      "status": "pending"
    }
  ]
}
```

**Use Case:** Admin dashboard to view all pairings and their statuses

---

#### 6. Override Match Result (Admin)
```
POST /matches/:matchId/override
Auth: Required (OWNER, STAFF)
```

*Already exists* - Allows admin to manually set/override match results.

**Request Body:**
```json
{
  "result": "PLAYER_A_WIN",
  "gamesWonA": 2,
  "gamesWonB": 1
}
```

---

#### 7. Drop Player (Admin)
```
POST /entries/:entryId/drop
Auth: Required (OWNER, STAFF)
```

*Already exists* - Allows admin to drop a player.

---

## Match Status States

A match can be in one of these states:

1. **Pending** - No result reported yet
   - `result: null`, `reportedBy: null`, `confirmedBy: null`

2. **Reported (Awaiting Confirmation)** - One player reported, waiting for opponent
   - `result: "PLAYER_A_WIN"`, `reportedBy: "user_123"`, `confirmedBy: null`

3. **Confirmed** - Both players agree on result
   - `result: "PLAYER_A_WIN"`, `reportedBy: "user_123"`, `confirmedBy: "user_456"`

4. **Disputed** - Players disagree on result (needs admin)
   - Tracked via metadata or flag

5. **Admin Override** - Admin manually set result
   - `overriddenBy: "staff_123"`, `overriddenAt: timestamp`

## Best of 3 (Bo3) Support

For games like Riftbound that require Bo3:

**Database:** Already supported via `gamesWonA` and `gamesWonB` fields

**UI Considerations:**
- 1v1 games (OPTCG, Azuki): Simple Win/Loss buttons (auto-set games to 1-0 or 0-1)
- Bo3 games (Riftbound): Show game-by-game entry (e.g., 2-1, 2-0)

**API Consistency:**
- All endpoints use `gamesWonA` and `gamesWonB`
- Frontend determines if user enters games or if it's auto-calculated from win/loss

## Environment Variables

Required for all deployments:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/genki_tcg

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d

# App
PORT=3001
NODE_ENV=development
```

## Real-time Updates

All match result changes emit WebSocket events:
- `match:result:reported` - When player reports
- `match:result:confirmed` - When opponent confirms
- `match:result:disputed` - When opponent disputes
- `standings:updated` - When standings recalculate

Frontend clients should subscribe to these events for live updates.
