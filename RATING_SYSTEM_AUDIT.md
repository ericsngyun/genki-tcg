# Rating System Audit & Improvement Plan

**Date:** December 3, 2025
**Purpose:** Compare current implementation with proposed "fast early, steady later" system

---

## Current System Analysis

### ✅ What's Already Implemented

#### **1. Glicko-2 Core Algorithm**
- ✅ Full Glicko-2 implementation with μ, RD (φ), σ
- ✅ Per-game ratings (ONE_PIECE_TCG, AZUKI_TCG, RIFTBOUND)
- ✅ Both lifetime and seasonal ratings
- ✅ Proper Glicko-2 math (conversions, variance, volatility)

**Current Configuration:**
```typescript
initialRating: 1500
initialRD: 350
minRD: 50
initialVolatility: 0.06
tau: 0.5
```

#### **2. Tier System**
- ✅ 7 tiers implemented: SPROUT, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, GENKI
- ✅ Rating-based tier mapping

**Current Thresholds:**
```
SPROUT:   0 - 1299
BRONZE:   1300 - 1449
SILVER:   1450 - 1599
GOLD:     1600 - 1749
PLATINUM: 1750 - 1899
DIAMOND:  1900 - 2099
GENKI:    2100+
```

#### **3. Provisional Player Protection**
- ✅ Provisional status detection
- ✅ Loss caps for provisional players
- ✅ Thresholds: RD > 120 OR < 15 matches

**Current Loss Cap:**
```
matchThreshold: 15 matches
maxLoss: 75 rating points per tournament
```

#### **4. Database Schema**
- ✅ PlayerCategoryLifetimeRating (never resets)
- ✅ PlayerCategorySeasonRating (resets per season)
- ✅ LifetimeRatingHistory (match-by-match tracking)
- ✅ Proper indexes for leaderboards

---

## Proposed System (from Outline)

### **Key Differences**

#### **1. Conservative Rating (r_c) System**
**Proposed:** Use `r_c = μ − 2×RD` for rank determination
**Current:** Direct rating (μ) for tier assignment

**Impact:** More stable promotions, harder to rank up on volatility alone

#### **2. Rank Stability**
**Proposed:**
- Promote when r_c above threshold for 2 completed events
- Demote when r_c below threshold for 2 completed events

**Current:** Immediate tier changes based on rating

**Impact:** Prevents yo-yo effect, rewards consistency

#### **3. RD Floor Management**
**Proposed:**
- Provisional RD floor: 80
- Established RD floor: 60
- Current minRD: 50

**Impact:** Slightly slower late-game progression

#### **4. Loss Caps and Scaling**
**Proposed:**
```typescript
// Per-match soft caps
maxLossVsLowerRated: 35  // vs much lower opponents
maxLossVsHigherRated: 50 // big upsets
drawCap: 12
provisionalScaling: 0.8  // 20% dampener when opponent RD > 140

// High-rank dampeners
diamondMultiplier: 0.9   // after reaching Diamond
genkiMultiplier: 0.8     // after reaching GENKI
```

**Current:**
- Tournament-wide loss cap: 75 per event
- No per-match caps
- No high-rank dampeners

**Impact:** More granular protection, better balance at high ranks

#### **5. Inactivity Handling**
**Proposed:**
- Weekly RD increase: +35 up to max 350

**Current:**
- Need to check if implemented

#### **6. Finals/Top Cut Weight**
**Proposed:** Optional 1.25× weight for finals matches
**Current:** Not implemented

---

## Critical Gaps

### 🔴 High Priority

1. **Conservative Rating (r_c) Not Used**
   - **Impact:** HIGH
   - **Fix:** Calculate `r_c = rating - (2 * ratingDeviation)` for tier assignment
   - **Location:** `rating.types.ts:mapRatingToTier()`

2. **No Rank Stability Mechanism**
   - **Impact:** HIGH - Players can yo-yo between tiers
   - **Fix:** Track consecutive events at new tier threshold
   - **Location:** Add to `PlayerCategorySeasonRating` schema

3. **No Per-Match Loss Caps**
   - **Impact:** MEDIUM - High-rated players can lose too much vs low-rated
   - **Fix:** Implement soft caps in rating calculation
   - **Location:** `ratings.service.ts:calculateNewRating()`

4. **No High-Rank Dampeners**
   - **Impact:** MEDIUM - Top players can fluctuate too much
   - **Fix:** Apply multipliers for Diamond+ players
   - **Location:** `ratings.service.ts:calculateNewRating()`

5. **No Bounty System**
   - **Impact:** MEDIUM - Missing engagement layer
   - **Fix:** Implement bounty logic and rewards
   - **Location:** New service + schema

### 🟡 Medium Priority

6. **No Season Points System**
   - **Impact:** MEDIUM - Missing secondary ladder
   - **Fix:** Track win/draw/loss points per season
   - **Location:** Add to `PlayerCategorySeasonRating` schema

7. **No Inactivity RD Growth**
   - **Impact:** LOW-MEDIUM - Inactive players stay certain
   - **Fix:** Weekly cron job to increase RD
   - **Location:** New cron job

8. **No Finale Weight**
   - **Impact:** LOW - Finals matches same as early rounds
   - **Fix:** Add weight parameter to matches
   - **Location:** `Match` schema + calculations

### 🟢 Low Priority (Nice to Have)

9. **No Casual Boosts**
   - First Night Bonus, Comeback Bonus, etc.
   - Can be added post-MVP

10. **No Participation Raffles**
    - Weekly raffle system
    - Can be added post-MVP

---

## Proposed Database Schema Changes

### **1. Add Rank Stability Tracking**

```prisma
model PlayerCategorySeasonRating {
  // ... existing fields ...

  // Conservative rating for rank calculation
  conservativeRating Float @default(1500) // r_c = rating - (2 * ratingDeviation)

  // Rank stability
  currentTier PlayerTier @default(SPROUT)
  eventsAtTierThreshold Int @default(0) // Consecutive events at promotion/demotion threshold
  provisionalHidden Boolean @default(true) // Hide rank until RD < 140 or 5 matches

  // Season points (secondary ladder)
  seasonPoints Int @default(0)
  bestNEvents Json? // Array of event IDs contributing to season points
}
```

### **2. Add Bounty Tracking**

```prisma
model BountyMatch {
  id String @id @default(cuid())
  matchId String
  eventId String
  bount yPlayerId String // The high-rated player
  hunterPlayerId String // The lower-rated player who won

  ratingGap Int // Difference at match time
  creditReward Int // $2, $5, or $8
  seasonPointReward Int // 1, 2, or 3

  match Match @relation(fields: [matchId], references: [id])
  bountyPlayer User @relation("BountyPlayer", fields: [bountyPlayerId], references: [id])
  hunterPlayer User @relation("HunterPlayer", fields: [hunterPlayerId], references: [id])

  createdAt DateTime @default(now())

  @@unique([matchId])
  @@map("bounty_matches")
}
```

### **3. Add Match Weight**

```prisma
model Match {
  // ... existing fields ...

  ratingWeight Float @default(1.0) // 1.0 normal, 1.25 for finals
  isBountyMatch Boolean @default(false)
}
```

---

## Implementation Priority

### **Phase 1: Critical Fixes (Week 1)** ⚡

**1. Conservative Rating (r_c)**
```typescript
// apps/backend/src/ratings/types/rating.types.ts

export function calculateConservativeRating(
  rating: number,
  ratingDeviation: number
): number {
  return rating - (2 * ratingDeviation);
}

export function mapConservativeRatingToTier(r_c: number): PlayerTier {
  if (r_c < 1300) return 'BRONZE';  // Remove SPROUT, start at BRONZE
  if (r_c < 1500) return 'SILVER';
  if (r_c < 1700) return 'GOLD';
  if (r_c < 1850) return 'PLATINUM';
  if (r_c < 2000) return 'DIAMOND';
  return 'GENKI';
}
```

**2. Rank Stability**
```typescript
// Track promotion/demotion eligibility
interface RankStabilityCheck {
  currentTier: PlayerTier;
  eventsAtThreshold: number;
  shouldPromote: boolean; // true if r_c above next tier for 2+ events
  shouldDemote: boolean; // true if r_c below current tier for 2+ events
}
```

**3. Per-Match Loss Caps**
```typescript
// apps/backend/src/ratings/ratings.service.ts

private applyLossCaps(
  ratingChange: number,
  playerRating: number,
  opponentRating: number,
  playerRD: number,
  opponentRD: number,
  isLoss: boolean
): number {
  if (!isLoss || ratingChange >= 0) return ratingChange;

  const ratingGap = playerRating - opponentRating;

  // Soft cap for losses vs much lower-rated
  if (ratingGap >= 250) {
    return Math.max(ratingChange, -35);
  }

  // General cap for big upsets
  if (Math.abs(ratingChange) > 50) {
    return Math.max(ratingChange, -50);
  }

  // Provisional opponent dampener (20%)
  if (opponentRD > 140) {
    return ratingChange * 0.8;
  }

  return ratingChange;
}
```

**4. High-Rank Dampeners**
```typescript
private applyHighRankDampener(
  ratingChange: number,
  currentTier: PlayerTier
): number {
  if (currentTier === 'GENKI') {
    return ratingChange * 0.8;
  }
  if (currentTier === 'DIAMOND') {
    return ratingChange * 0.9;
  }
  return ratingChange;
}
```

### **Phase 2: Enhanced Features (Week 2)** 🎯

**5. Bounty System**
- Identify top 10% by r_c at event start
- Track bounty matches
- Award credits and season points for upsets
- Limits: max 2 claims per player per event

**6. Season Points**
- Win = 3, Draw = 1, Loss = 0
- Top 2 = +2, Top 4 = +1
- Best-N counting (12 for OPTCG/Azuki, 8 for Riftbound)

**7. Inactivity Handling**
- Weekly cron: `RD += 35` if no matches, cap at 350
- Per game basis

### **Phase 3: Polish (Week 3)** ✨

**8. Casual Boosts**
- First Night Bonus: +2 SP
- Comeback Bonus: +1 SP after 21 days idle
- Positive Record Credit: $3 for X-1 or better

**9. Finals Weight**
- Add `ratingWeight` field to Match
- Multiply rating change by weight

**10. UX Improvements**
- Progress bars: "38 r_c to Gold"
- Bounty indicators on pairings
- Rank stability visualization

---

## Recommended Changes to Current Thresholds

### **Updated Tier Thresholds (using r_c)**

```typescript
export const TIER_THRESHOLDS_RC = {
  BRONZE:   { min: 0,    max: 1299, color: '#CD7F32' },
  SILVER:   { min: 1300, max: 1499, color: '#C0C0C0' },
  GOLD:     { min: 1500, max: 1699, color: '#FFD700' },
  PLATINUM: { min: 1700, max: 1849, color: '#E5E4E2' },
  DIAMOND:  { min: 1850, max: 1999, color: '#B9F2FF' },
  GENKI:    { min: 2000, max: Infinity, color: '#DC2626' }, // Brand red
} as const;
```

**Note:** Removed SPROUT tier as per outline (Bronze is starting tier)

### **Updated RD Floors**

```typescript
export const RD_FLOORS = {
  provisional: 80,  // First 5 matches
  established: 60,  // After 5 matches
  minimum: 60,      // Absolute floor
} as const;
```

### **Updated Provisional Thresholds**

```typescript
export const PROVISIONAL_THRESHOLDS = {
  rdThreshold: 140,      // Hide rank if RD > 140
  matchThreshold: 5,     // Show rank after 5 matches (even if RD > 140)
} as const;
```

---

## Migration Plan

### **Step 1: Database Migration**

```prisma
// migration: add_conservative_rating_and_stability.prisma

-- Add new fields to PlayerCategorySeasonRating
ALTER TABLE player_category_season_rating
ADD COLUMN conservative_rating FLOAT DEFAULT 1500,
ADD COLUMN current_tier TEXT DEFAULT 'BRONZE',
ADD COLUMN events_at_tier_threshold INTEGER DEFAULT 0,
ADD COLUMN provisional_hidden BOOLEAN DEFAULT TRUE,
ADD COLUMN season_points INTEGER DEFAULT 0,
ADD COLUMN best_n_events JSONB;

-- Calculate conservative rating for existing players
UPDATE player_category_season_rating
SET conservative_rating = rating - (2 * rating_deviation);

-- Set current tier based on conservative rating
UPDATE player_category_season_rating
SET current_tier = CASE
  WHEN conservative_rating < 1300 THEN 'BRONZE'
  WHEN conservative_rating < 1500 THEN 'SILVER'
  WHEN conservative_rating < 1700 THEN 'GOLD'
  WHEN conservative_rating < 1850 THEN 'PLATINUM'
  WHEN conservative_rating < 2000 THEN 'DIAMOND'
  ELSE 'GENKI'
END;

-- Add match weight field
ALTER TABLE matches ADD COLUMN rating_weight FLOAT DEFAULT 1.0;
```

### **Step 2: Code Updates**

1. Update `rating.types.ts` with new constants and functions
2. Update `ratings.service.ts` with loss caps and dampeners
3. Update tier calculation logic to use r_c
4. Add rank stability tracking
5. Update mobile app to show r_c progress

### **Step 3: Testing**

```typescript
// Test scenarios
describe('Conservative Rating System', () => {
  it('should prevent volatile promotions', () => {
    // Player with high RD shouldn't promote easily
  });

  it('should require 2 events for promotion', () => {
    // Rank stability check
  });

  it('should cap losses vs lower-rated opponents', () => {
    // Diamond loses to Bronze: max -35
  });

  it('should dampen Diamond/GENKI changes', () => {
    // 0.9× and 0.8× multipliers
  });
});
```

---

## Mobile App UX Changes

### **Profile Screen Updates**

```typescript
// Current display
Rating: 1723
Tier: GOLD

// Proposed display
Rating: 1723 (RD: 68)
Conservative Rating: 1587  // r_c = 1723 - (2×68)
Tier: GOLD
Progress to Platinum: +113 r_c needed
  [=========>    ] 64%
Estimated: 3-4 wins vs similar opponents

Rank Stability: 1/2 events at threshold
  Next tournament: Eligible for promotion if maintained
```

### **Match History**

```typescript
// Show rating change breakdown
vs. PlayerName (Gold) - WIN
  Rating: 1723 → 1735 (+12)
  r_c: 1587 → 1603 (+16)
  RD: 68 → 67 (-1)
```

---

## API Changes Needed

### **New Endpoints**

```typescript
// GET /ratings/me/rank-progress
{
  currentTier: 'GOLD',
  conservativeRating: 1587,
  nextTier: 'PLATINUM',
  nextTierThreshold: 1700,
  pointsNeeded: 113,
  eventsAtThreshold: 1,
  eventsNeededForPromotion: 1,
  estimatedWinsNeeded: 3-4,
  isProvisional: false
}

// GET /events/:id/bounties
{
  bountyPlayers: [
    {
      userId: 'xxx',
      name: 'PlayerName',
      conservativeRating: 1850,
      tier: 'PLATINUM'
    }
  ]
}
```

---

## Testing & Rollout Strategy

### **Phase 1: Shadow Mode (Week 1)**
- Calculate r_c and new tiers alongside current system
- Log differences, don't show to users
- Analyze impact on current player distribution

### **Phase 2: Beta Group (Week 2)**
- Enable for test organization
- Gather feedback on rank stability
- Tune loss caps if needed

### **Phase 3: Full Rollout (Week 3)**
- Migrate all players
- Announcement: "New rank stability system"
- Monitor for issues

---

## Expected Player Impact

### **New Players**
- ✅ Still fast progression (high RD)
- ✅ More protection from losses
- ✅ Clear path to rank up

### **Mid-Tier Players (Silver/Gold)**
- ✅ More stable ranks
- ✅ Less yo-yo effect
- ⚠️ Slightly slower promotion (but fairer)

### **High-Tier Players (Platinum/Diamond)**
- ✅ Protected from big losses vs lower-rated
- ✅ More stable at top
- ⚠️ Dampeners mean slower movement (intentional)

### **GENKI Players**
- ✅ Strong protection from upsets (0.8× dampener)
- ✅ Meaningful when they do move
- ✅ Aspirational tier preserved

---

## Success Metrics

Track these after rollout:

1. **Rank Stability**
   - Measure: % of players changing tiers per event
   - Target: < 15% (down from current)

2. **Provisional Duration**
   - Measure: Average events to reach established status
   - Target: 3-5 events

3. **Player Satisfaction**
   - Survey: "Ranks feel fair and stable"
   - Target: > 80% agreement

4. **Engagement**
   - Measure: Events played per month
   - Target: No decrease (ideally increase with bounties)

---

## Conclusion

### **Current System Grade: B+**
✅ Solid Glicko-2 foundation
✅ Per-game ratings
✅ Lifetime & seasonal tracking
⚠️ Missing rank stability
⚠️ No granular loss protection
⚠️ Missing engagement layer (bounties)

### **With Proposed Changes: A**
✅ Everything above
✅ Conservative rating for stability
✅ Rank stability (2-event requirement)
✅ Granular loss caps
✅ High-rank dampeners
✅ Bounty system for engagement
✅ Season points secondary ladder

### **Recommendation**

**Implement Phase 1 (Critical Fixes) immediately:**
1. Conservative rating (r_c)
2. Rank stability
3. Per-match loss caps
4. High-rank dampeners

**Time Estimate:** 16-24 hours of development

These changes will make the system significantly more player-friendly while maintaining competitive integrity.

---

**Next Steps:**
1. Review this audit with team
2. Prioritize Phase 1 changes
3. Create detailed implementation tickets
4. Begin development

Would you like me to start implementing Phase 1 changes?
