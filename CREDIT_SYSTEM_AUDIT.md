# 🎮 Genki TCG - Credit & Player System Audit Report

**Date:** 2025-01-24
**Auditor:** Claude (System Audit)
**Version:** 1.0

---

## Executive Summary

This comprehensive audit analyzes the Genki TCG credit management, player management, and tournament tracking systems. The analysis reveals a **solid technical foundation** with several critical gaps that prevent the system from being truly production-ready and user-friendly.

### Key Findings

| System | Status | Issues Found | Recommendations |
|--------|--------|--------------|-----------------|
| **Credit Backend** | 🟡 Partial | 6 critical, 4 high | Entry fee integration required |
| **Credit Admin UI** | 🟢 Good | 8 missing features | Add bulk operations & filters |
| **Credit Mobile UI** | 🟡 Basic | 5 missing features | Add pagination & filtering |
| **Players Tab** | 🔴 Redundant | Provides no unique value | **Remove entirely** |
| **Tournament Tracking** | 🟢 Excellent | 1 critical gap | Implement standing snapshots |
| **Rating System** | 🔴 Missing | Not implemented | **Implement Glicko-2** |

### Critical Actions Required

1. **Integrate credits with entry fees** - Players cannot currently pay with credits
2. **Remove redundant Players tab** - Confusing navigation, no unique value
3. **Implement new user promo** - Give 10 credits to welcome new players
4. **Build ELO/leaderboard system** - Track player ratings across tournaments
5. **Polish UI/UX** - Add filtering, pagination, bulk operations

---

## 1. Credit Management System Analysis

### 1.1 Backend Architecture

**✅ Strengths:**
- Immutable audit ledger (`CreditLedgerEntry`)
- Derived balance table for O(1) lookups
- Full transaction safety with Prisma transactions
- Proper organization scoping for multi-tenancy
- Comprehensive audit logging

**❌ Critical Issues:**
1. **Entry fees NOT integrated with credits**
   - Events have `entryFeeCents` but it's tracked as USD
   - No automatic credit deduction when players pay
   - No `EVENT_ENTRY` ledger entries created
   - Players can't actually use credits for tournaments!

2. **Race conditions in balance checks**
   - Pre-check then deduct has TOCTOU window
   - Could overspendduring concurrent operations

3. **No idempotency keys**
   - Network timeout could double-charge
   - No duplicate detection for retried requests

**Performance Concerns:**
- `reconcileBalance()` is O(n) - loads entire ledger for single user
- `getAllBalances()` has no index on `(orgId, balance DESC)`
- CSV export loads 10k records in memory

### 1.2 Admin Web UI

**Current Features:**
- User search by name/email
- View individual balance
- Transaction history (20 per page)
- Manual adjustments (add/deduct)
- Quick action buttons (10, 25, 50, 100)
- CSV export

**Missing Features:**
- ❌ Bulk operations (select multiple users)
- ❌ Transaction filtering (date range, reason code)
- ❌ Balance history charts
- ❌ Reconciliation UI
- ❌ Confirmation dialogs for large debits
- ❌ Entry fee management
- ❌ Refund/reversal system
- ❌ Staff attribution in transaction list

**UI/UX Issues:**
- No search debouncing (API spam)
- Full-page spinner blocks interaction
- No empty states with helpful actions
- Quick actions are hardcoded

### 1.3 Mobile Wallet UI

**Current Features:**
- Balance display
- Last 10 transactions
- Pull-to-refresh
- Color-coded amounts

**Missing Features:**
- ❌ Pagination ("load more")
- ❌ Transaction filtering
- ❌ Search functionality
- ❌ Transaction detail modal
- ❌ Balance breakdown (prizes vs manual)
- ❌ Monthly summaries

---

## 2. Players Tab Analysis

### Recommendation: **REMOVE ENTIRELY**

**Rationale:**
The Players tab is **completely redundant** with the Credits tab, which provides:
- ✅ All player information
- ✅ Credit balances
- ✅ Transaction history
- ✅ Adjustment controls
- ✅ Better UX

**What Players tab shows:**
- Player name, email, role, balance, join date
- That's it. No actions available.

**Why it exists:**
- Historical artifact from early development
- Provides zero unique functionality
- Confuses navigation ("should I go to Players or Credits?")

**Action:** Delete `/dashboard/players/page.tsx` and remove from nav

---

## 3. Tournament Results & ELO System

### 3.1 Current Data Collection

**✅ What's Tracked:**
- All match results with full audit trail
- Games won per match (gamesWonA, gamesWonB)
- Opponent tracking within tournaments
- Swiss tiebreakers (OMW%, GW%, OGW%, OOMW%)
- Drop tracking with round information
- Payment status and timestamps

**❌ What's Missing:**
- Standing snapshots (model exists but never used!)
- Player rating history
- Cross-tournament statistics
- Head-to-head records API
- Player performance trends

### 3.2 ELO System Design

**Recommendation: Implement Glicko-2**

**Why Glicko-2 over standard ELO:**
1. Handles rating uncertainty (perfect for new players)
2. Accounts for inactivity periods
3. Better for small player pools (typical TCG shops)
4. Rating deviation shows confidence
5. Handles draws natively

**Required Database Changes:**
```prisma
model PlayerRating {
  id              String @id @default(cuid())
  userId          String
  orgId           String
  gameType        GameType

  // Glicko-2 components
  rating          Float @default(1500)
  ratingDeviation Float @default(350)
  volatility      Float @default(0.06)

  matchesPlayed   Int @default(0)
  lastUpdatedAt   DateTime @default(now())
  isProvisional   Boolean @default(true)

  @@unique([userId, orgId, gameType])
  @@index([orgId, rating(sort: Desc)])
}

model PlayerRatingHistory {
  id              String @id @default(cuid())
  playerRatingId  String
  eventId         String?
  matchId         String?

  ratingBefore    Float
  ratingAfter     Float
  ratingChange    Float
  opponentId      String
  matchResult     MatchResult
  calculatedAt    DateTime @default(now())

  @@index([playerRatingId, calculatedAt(sort: Desc)])
}
```

**Algorithm Parameters:**
```typescript
const GLICKO2_CONFIG = {
  initialRating: 1500,
  initialRatingDeviation: 350,
  initialVolatility: 0.06,
  tau: 0.5,
  provisionalMatchThreshold: 30,
  ratingPeriodDays: 30,
};
```

---

## 4. New User Promo System Design

### 4.1 Requirements

**Goal:** Give every new user 10 credits as a welcome bonus

**Trigger:** User completes signup/Discord OAuth for first time

**Rules:**
1. Only given once per user (idempotent)
2. Only for PLAYER role (not STAFF/OWNER)
3. Tracked with `PROMO` reason code
4. Includes welcome memo

### 4.2 Implementation Design

**Option A: At Signup** (Recommended)
```typescript
// In auth.service.ts - signup() method
async signup(dto: SignupDto) {
  const user = await this.prisma.$transaction(async (tx) => {
    // Create user + org membership
    const newUser = await tx.user.create({ ... });
    const membership = await tx.orgMembership.create({ ... });

    // Give welcome bonus
    if (membership.role === 'PLAYER') {
      await this.giveWelcomeBonus(tx, newUser.id, org.id);
    }

    return newUser;
  });
}

private async giveWelcomeBonus(tx, userId: string, orgId: string) {
  const WELCOME_BONUS = 10; // 10 credits

  await tx.creditLedgerEntry.create({
    data: {
      orgId,
      userId,
      amount: WELCOME_BONUS,
      reasonCode: 'PROMO',
      memo: 'Welcome bonus! Thanks for joining our community.',
      createdBy: 'system',
    },
  });

  await tx.creditBalance.upsert({
    where: { orgId_userId: { orgId, userId } },
    create: {
      orgId,
      userId,
      balance: WELCOME_BONUS,
      lastTransactionAt: new Date(),
    },
    update: {
      balance: { increment: WELCOME_BONUS },
      lastTransactionAt: new Date(),
    },
  });
}
```

**Option B: First Login** (Alternative)
- Check if user has any credit history
- If none, give welcome bonus
- More flexible but requires check on every login

### 4.3 Schema Changes

**Add new reason code:**
```prisma
enum CreditReasonCode {
  PRIZE
  REFUND
  PURCHASE
  MANUAL_ADD
  MANUAL_DEDUCT
  EVENT_ENTRY
  EVENT_REFUND
  PROMO           // ← NEW
}
```

**Track promo history:**
```prisma
model PromoRedemption {
  id          String @id @default(cuid())
  userId      String
  orgId       String
  promoCode   String
  amount      Int
  redeemedAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  org Organization @relation(fields: [orgId], references: [id])

  @@unique([userId, orgId, promoCode])
  @@index([userId])
}
```

### 4.4 UI Changes

**Mobile:**
- Show toast notification after signup: "Welcome! You've received 10 credits to get started!"
- Highlight welcome bonus transaction in wallet with special icon

**Admin:**
- Show PROMO transactions with special badge
- Filter by reason code to see all welcome bonuses

---

## 5. Leaderboard System Design

### 5.1 Leaderboard Features

**Main Leaderboard View:**
1. **Global Rankings** - All players in organization
2. **Game-Specific** - Filter by ONE_PIECE_TCG, AZUKI_TCG, RIFTBOUND
3. **Time Period** - All-time, Last 30 days, Last 90 days, This season
4. **Provisional Players** - Badge/indicator for <30 matches

**Player Card Display:**
```
┌─────────────────────────────────────┐
│ #3 🏆 Player Name                   │
│ ⭐ Rating: 1687 (±45)               │
│ 📊 Record: 24-8-2 (75% winrate)     │
│ 🎮 Matches: 34 (provisional)        │
│ 📈 Trend: +67 this month            │
└─────────────────────────────────────┘
```

### 5.2 Player Profile View

**Stats to Show:**
- Current rating + deviation
- Rating trend graph (last 12 months)
- Match record (W-L-D)
- Tournaments participated
- Prize earnings
- Head-to-head vs specific opponents
- Best/worst matchups

### 5.3 UI/UX Design

**Admin Web - New "Rankings" Tab:**
```
/dashboard/rankings
├── Overview (org-wide stats)
├── Leaderboard (sortable table)
├── Player Profiles (click to view)
└── Rating History (export CSV)
```

**Mobile - Enhanced Profile Tab:**
```
/profile
├── My Rating Card (prominent)
├── Rating Graph (last 6 months)
├── Recent Matches (with rating changes)
├── Head-to-Head Records
└── Achievements/Badges
```

**Leaderboard Table Design:**
| Rank | Player | Rating | ± | Record | W% | Matches | Trend |
|------|--------|--------|---|--------|-----|---------|-------|
| 1🥇 | Alice | 1842 | ±32 | 45-12-3 | 75% | 60 | +124↗ |
| 2🥈 | Bob | 1798 | ±28 | 38-15-2 | 71% | 55 | +89↗ |
| 3🥉 | Carol | 1687 | ±45 | 24-8-2 | 75% | 34⚠️ | +67↗ |

⚠️ = Provisional (less than 30 matches)

---

## 6. UI/UX Polish Recommendations

### 6.1 Credit Management Improvements

**Admin Web:**
1. **Add confirmation dialogs**
   ```tsx
   Before deducting >50 credits:
   "Are you sure you want to deduct 100 credits from Alice?"
   [Cancel] [Confirm]
   ```

2. **Bulk operations modal**
   ```tsx
   Select users: [x] Alice [ ] Bob [x] Carol
   Action: [Add Credits ▼]
   Amount: [10]
   Reason: [Manual Add ▼]
   Memo: [Compensation for tournament issue]
   [Cancel] [Apply to 2 users]
   ```

3. **Transaction filters**
   ```tsx
   Date: [From: 2025-01-01] [To: 2025-01-24]
   Type: [All Types ▼] [PRIZE, MANUAL_ADD, REFUND...]
   Amount: Min:[0] Max:[1000]
   [Apply Filters] [Clear]
   ```

4. **Balance history chart**
   ```tsx
   ┌─ Alice's Credit Balance ─────┐
   │                               │
   │ 150₵ ▲                        │
   │      │  ╱╲                    │
   │ 100₵ │ ╱  ╲    ╱╲             │
   │      │╱    ╲  ╱  ╲            │
   │  50₵ ┘      ╲╱    ╲           │
   │      └─────────────────→      │
   │      Jan   Feb   Mar          │
   └───────────────────────────────┘
   ```

**Mobile:**
1. **Transaction detail modal**
   ```tsx
   Tap transaction → Show full details:
   ┌─ Transaction Details ─────┐
   │ +50 credits               │
   │ Type: PRIZE               │
   │ Event: Friday Night TCG   │
   │ Placement: 2nd            │
   │ Date: Jan 24, 2025 8:45PM │
   │ Balance after: 127        │
   │ [Close]                   │
   └───────────────────────────┘
   ```

2. **Filter bar**
   ```tsx
   [All ▼] [Date Range ▼] [Search 🔍]
   ```

3. **Monthly summary**
   ```tsx
   ┌─ January 2025 Summary ────┐
   │ Earned:    +250 credits   │
   │ Spent:     -100 credits   │
   │ Net:       +150 credits   │
   └───────────────────────────┘
   ```

### 6.2 Tournament Integration

**Pairings View with Ratings:**
```
┌─ Round 1 Pairings ────────────────────────────┐
│ Table 1: Alice (1842) vs Bob (1798)          │
│          Rated: +15/-15                       │
│                                                │
│ Table 2: Carol (1687⚠️) vs Dave (1543)        │
│          Rated: +8/-22                        │
└────────────────────────────────────────────────┘
```
⚠️ = Provisional rating

**Standings with Ratings:**
```
| Place | Player | Record | Points | Rating | Change |
|-------|--------|--------|--------|--------|--------|
| 1 | Alice | 4-0-0 | 12 | 1842 → 1856 | +14↗ |
| 2 | Bob | 3-1-0 | 9 | 1798 → 1803 | +5↗ |
| 3 | Carol | 3-1-0 | 9 | 1687 → 1695 | +8↗ |
```

---

## 7. Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
- [ ] Add `PROMO` reason code to schema
- [ ] Implement welcome bonus (10 credits on signup)
- [ ] Remove Players tab
- [ ] Fix standing snapshot creation
- [ ] Add idempotency keys to credit operations

### Phase 2: ELO Foundation (Week 2-3)
- [ ] Create PlayerRating table
- [ ] Create PlayerRatingHistory table
- [ ] Implement Glicko-2 algorithm
- [ ] Batch calculate historical ratings
- [ ] Wire into match confirmation flow
- [ ] Create rating APIs

### Phase 3: Leaderboard UI (Week 4)
- [ ] Admin web Rankings tab
- [ ] Leaderboard table with sorting
- [ ] Player profile page with rating graph
- [ ] Mobile profile enhancements
- [ ] Rating badges and trends

### Phase 4: Credit Polish (Week 5)
- [ ] Bulk operations in admin web
- [ ] Transaction filtering
- [ ] Balance history charts
- [ ] Mobile pagination
- [ ] Confirmation dialogs

### Phase 5: Tournament Integration (Week 6)
- [ ] Entry fee credit deduction
- [ ] Refund on player drop
- [ ] Pairings with ratings
- [ ] Standings with rating changes
- [ ] Automatic prize distribution

---

## 8. Performance Optimization Plan

### Database Indexes
```sql
-- Leaderboard queries
CREATE INDEX idx_player_rating_org_game_rating
  ON PlayerRating(orgId, gameType, rating DESC);

-- Player history
CREATE INDEX idx_rating_history_user_date
  ON PlayerRatingHistory(playerRatingId, calculatedAt DESC);

-- Head-to-head lookups
CREATE INDEX idx_match_both_players
  ON Match(playerAId, playerBId);

-- Credit balance sorting
CREATE INDEX idx_credit_balance_org_balance
  ON CreditBalance(orgId, balance DESC);
```

### Caching Strategy
```typescript
// Cache leaderboard for 5 minutes
@Cacheable({ ttl: 300 })
async getLeaderboard(orgId: string, gameType: GameType) {
  return prisma.playerRating.findMany({
    where: { orgId, gameType },
    orderBy: { rating: 'desc' },
    take: 100,
  });
}

// Cache player rating for 1 minute
@Cacheable({ ttl: 60 })
async getPlayerRating(userId: string) {
  return prisma.playerRating.findUnique({
    where: { id: userId }
  });
}
```

### Async Processing
```typescript
// Don't block match confirmation on rating calculation
async confirmMatch(matchId: string) {
  await updateMatch(matchId);

  // Queue rating update
  await jobQueue.enqueue('updateRatings', { matchId });
}
```

---

## 9. Budget & Timeline Estimate

| Phase | Tasks | Complexity | Estimated Time |
|-------|-------|------------|----------------|
| **Phase 1** | Critical fixes | Low | 1 week |
| **Phase 2** | ELO foundation | High | 2-3 weeks |
| **Phase 3** | Leaderboard UI | Medium | 1 week |
| **Phase 4** | Credit polish | Medium | 1 week |
| **Phase 5** | Tournament integration | High | 1 week |
| **Total** | - | - | **6-7 weeks** |

**Priority Order:**
1. Phase 1 (critical fixes) - **DO FIRST**
2. Phase 2 (ELO system) - **CORE VALUE**
3. Phase 3 (Leaderboard) - **USER ENGAGEMENT**
4. Phase 4 (Polish) - **USER EXPERIENCE**
5. Phase 5 (Integration) - **COMPLETE FEATURES**

---

## 10. Success Metrics

### Technical Metrics
- [ ] All credit operations under 200ms (p99)
- [ ] Leaderboard queries under 100ms (p99)
- [ ] Rating calculations complete within 30s of match confirmation
- [ ] Zero race conditions in credit adjustments
- [ ] 100% idempotency for all financial operations

### User Experience Metrics
- [ ] 90% of new users receive welcome bonus within 1 second
- [ ] Credits page loads in <500ms
- [ ] Leaderboard updates within 1 minute of match result
- [ ] Mobile wallet transactions load in <300ms
- [ ] Zero user-reported credit discrepancies

### Business Metrics
- [ ] Welcome bonus increases user retention by 20%
- [ ] Leaderboard increases tournament participation by 15%
- [ ] Credit usage for entry fees at 80%+ adoption
- [ ] Admin time for credit management reduced by 50%

---

## Conclusion

The Genki TCG credit and player management system has a **strong technical foundation** but needs significant enhancements to be truly production-ready and engaging:

### Must-Have (Before Launch):
1. ✅ Welcome bonus promo system
2. ✅ Remove redundant Players tab
3. ✅ Fix standing snapshots
4. ⚠️ Entry fee credit integration

### Should-Have (Launch Month 2):
1. ✅ ELO/rating system
2. ✅ Leaderboard
3. ✅ Transaction filtering
4. ✅ Mobile pagination

### Nice-to-Have (Month 3+):
1. Balance history charts
2. Bulk operations
3. Automatic prize distribution
4. Advanced analytics

**Recommendation:** Start with Phase 1 (critical fixes including promo system and players tab removal), then immediately move to Phase 2 (ELO system) as it provides the most unique value to your platform.
