# 🌱 Database Seeding Instructions

## Overview
The seed script creates comprehensive mock data for testing the ranking/leaderboard system across all game types.

## What Gets Created

### Users & Organization
- **Organization**: Genki TCG (invite code: `GENKI`)
- **Owner**: owner@genki-tcg.com
- **Staff**: staff@genki-tcg.com
- **10 Players**: player1@test.com through player10@test.com
- **Password for all users**: `password123`

### Rating System Data
- **Active Season**: 2025 Q1 (started last month, ends in 2 months)
- **Game Types**: ONE_PIECE_TCG, AZUKI_TCG, RIFTBOUND
- **Rating Distribution**:
  - Player 1: Elite (~2100 rating)
  - Player 2: Expert (~1950 rating)
  - Player 3: Advanced (~1800 rating)
  - Player 4: Intermediate (~1650 rating)
  - Player 5: Developing (~1550 rating)
  - Player 6: Beginner (~1450 rating)
  - Player 7: Casual (~1350 rating)
  - Player 8: Rookie (~1300 rating)
  - Player 9: Novice (~1250 rating)
  - Player 10: Learning (~1200 rating)

### What's Included Per Player
- ✅ Lifetime ratings for each game type (Glicko-2 system)
- ✅ Seasonal ratings for current season
- ✅ Match history with realistic win/loss records
- ✅ 100 credits each
- ✅ Varying rating deviations (RD) based on experience

## Method 1: Via API Endpoint (Recommended)

### Prerequisites
1. Backend server must be running
2. You must have an OWNER account

### Steps

1. **Start the backend server** (if not already running):
   ```bash
   cd apps/backend
   npm run start:dev
   ```

2. **Login as owner to get auth token**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"email\":\"owner@genki-tcg.com\",\"password\":\"password123\"}"
   ```

3. **Copy the `accessToken` from the response**

4. **Call the seed endpoint**:
   ```bash
   curl -X POST http://localhost:3000/seed \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
   ```

### Expected Output
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "data": {
    "organization": "Genki TCG",
    "owner": "owner@genki-tcg.com",
    "staff": "staff@genki-tcg.com",
    "players": 10,
    "event": "Friday Night One Piece TCG",
    "season": "2025 Q1",
    "ratings": {
      "gameTypes": 3,
      "playersRated": 10,
      "totalRatings": 60
    },
    "credentials": {...},
    "leaderboard": {
      "topPlayer": "Player 1 - ~2100 rating",
      "categories": "ONE_PIECE_TCG, AZUKI_TCG, RIFTBOUND",
      "note": "Check /ratings/lifetime/ONE_PIECE_TCG or /ratings/seasonal/ONE_PIECE_TCG endpoints"
    }
  }
}
```

## Method 2: Direct Prisma Seed Script

```bash
cd apps/backend
npx prisma db seed
```

## Viewing the Leaderboards

### Via API

**Lifetime Leaderboard (One Piece TCG)**:
```bash
curl http://localhost:3000/ratings/lifetime/ONE_PIECE_TCG \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Seasonal Leaderboard (One Piece TCG)**:
```bash
curl http://localhost:3000/ratings/seasonal/ONE_PIECE_TCG \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Current Season**:
```bash
curl http://localhost:3000/ratings/seasons/current \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Player Individual Ranks**:
```bash
curl http://localhost:3000/ratings/players/{playerId}/ranks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Via Admin Web Interface

1. Navigate to http://localhost:3001 (or your admin web port)
2. Login with: owner@genki-tcg.com / password123
3. Go to: Dashboard → Players → Leaderboard
4. Select game type filter to see rankings

### Via Mobile App

1. Open mobile app (Expo)
2. Login with any player account (player1@test.com through player10@test.com)
3. Password: password123
4. Navigate to: More → Leaderboard
5. View your rank and compare with others

## Testing Different Scenarios

### Test Top Player View
- Login as: player1@test.com
- You'll see ~2100 rating, top of leaderboard

### Test Mid-Tier Player View
- Login as: player5@test.com
- You'll see ~1550 rating, middle of pack

### Test Beginner Player View
- Login as: player10@test.com
- You'll see ~1200 rating, learning tier

### Test Across Different Games
Each player has different ratings for:
- ONE_PIECE_TCG
- AZUKI_TCG
- RIFTBOUND

Try switching game types to see different leaderboards!

## Rating Tiers (for UI reference)

Based on the Glicko-2 ratings created:
- **Platinum**: 2000+
- **Gold**: 1800-1999
- **Silver**: 1600-1799
- **Bronze**: 1400-1599
- **Unranked**: <1400

## Notes

- Seed script is **idempotent** - running it multiple times will update existing records
- Only works in **development environment** (blocked in production)
- Rate limited to **1 request per day** when using API endpoint
- All dates are relative to current time (season started last month, matches within last week)

## Troubleshooting

**"Seeding is disabled in production"**
- Make sure `NODE_ENV` is not set to `production`

**"Invalid invite code" when testing signup**
- Use invite code: `GENKI`

**"Unauthorized" when calling endpoints**
- Make sure you're logged in and using a valid auth token
- Token format: `Bearer <token>`

**No data showing in leaderboards**
- Verify the season is ACTIVE: `GET /ratings/seasons/current`
- Check that ratings were created: `GET /ratings/lifetime/ONE_PIECE_TCG`

## What's Next?

After seeding, you can:
1. Create tournaments and generate matches
2. Test the rating update system by processing tournament results
3. View player progression in the leaderboard
4. Test seasonal rating resets
5. Implement tier badges and rewards in the UI

---

*Last Updated: December 1, 2025*
