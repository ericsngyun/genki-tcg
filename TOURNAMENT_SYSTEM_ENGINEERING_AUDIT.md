# Tournament System Engineering Audit
**Date:** November 25, 2025  
**Status:** Comprehensive Review Complete

## Executive Summary

This audit examines the tournament system for buggy edge cases, automation opportunities, and engineering best practices. The system is functionally sound but has **several critical issues** that must be addressed before production use, particularly around match result confirmation, race conditions, and automation.

**Overall Assessment:**
- ✅ Core tournament logic is solid
- ⚠️ **Critical bugs** in match confirmation flow
- ⚠️ **Missing automation** for round completion
- ⚠️ **Race conditions** in concurrent operations
- ⚠️ **Incomplete validation** in several areas

---

## Critical Issues (Must Fix Before Production)

### 1. CRITICAL: Unconfirmed Match Results Included in Standings

**Issue:** When players self-report match results, the standings calculation includes matches that are `reportedBy` but not yet `confirmedBy`. This means standings show incorrect results before matches are confirmed.

**Location:**
- `packages/tournament-logic/src/standings.ts:54` - `calculateStandings()`
- `apps/backend/src/standings/standings.service.ts:45-52` - Matches passed to standings

**Problem:**
```typescript
// Current code processes ALL matches with non-null result
for (const match of matches) {
  if (match.result !== null) {
    // Processes even unconfirmed player-reported matches
    // This is wrong - should only process confirmed/admin-reported matches
  }
}
```

**Impact:** 
- Standings can show incorrect scores/rankings
- Players see misleading standings before confirmation
- Tiebreakers calculated incorrectly

**Fix Required:**
- Standings service must filter out matches where:
  - `result` is null, OR
  - `reportedBy` exists but `confirmedBy` is null (player-reported, not confirmed)
  - `overriddenBy` exists (admin override is fine to include)

**Recommended Solution:**
```typescript
// In StandingsService.calculateCurrentStandings()
const matches = event.rounds.flatMap((r) =>
  r.matches
    .filter((m) => {
      // Include if:
      // 1. Admin override (overriddenBy exists), OR
      // 2. Confirmed player report (reportedBy AND confirmedBy both exist), OR
      // 3. Staff-reported (reportedBy exists but no confirmedBy needed - staff is trusted)
      if (m.overriddenBy) return true; // Admin override
      if (m.result === null) return false; // No result
      if (m.reportedBy && !m.confirmedBy && m.reportedBy !== m.overriddenBy) {
        // Player-reported but not confirmed - exclude from standings
        return false;
      }
      return true;
    })
    .map((m) => ({
      playerAId: m.playerAId,
      playerBId: m.playerBId,
      result: m.result,
      gamesWonA: m.gamesWonA || 0,
      gamesWonB: m.gamesWonB || 0,
    }))
);
```

---

### 2. CRITICAL: Round Completion Logic Ignores Confirmation Status

**Issue:** `areAllMatchesReported()` only checks if `result !== null`, but doesn't verify that player-reported matches are confirmed.

**Location:**
- `packages/tournament-logic/src/tournament.ts:122` - `areAllMatchesReported()`
- `apps/backend/src/rounds/rounds.service.ts:239` - Used in `completeRound()`

**Problem:**
```typescript
// Current logic
export function areAllMatchesReported(
  matches: Array<{ result: string | null; playerBId: string | null }>
): boolean {
  return matches.every((match) => {
    if (match.playerBId === null) return true; // Bye
    return match.result !== null; // ❌ Doesn't check confirmedBy!
  });
}
```

**Impact:**
- Rounds can be completed with unconfirmed player reports
- Tournament can progress incorrectly
- Staff may think all matches are done when players haven't confirmed

**Fix Required:**
Update `areAllMatchesReported()` to accept and check confirmation status:

```typescript
export function areAllMatchesReported(
  matches: Array<{ 
    result: string | null; 
    playerBId: string | null;
    reportedBy?: string | null;
    confirmedBy?: string | null;
    overriddenBy?: string | null;
  }>
): boolean {
  return matches.every((match) => {
    // Bye matches are auto-reported
    if (match.playerBId === null) return true;
    
    // No result = not reported
    if (match.result === null) return false;
    
    // Admin override is always valid
    if (match.overriddenBy) return true;
    
    // Player-reported matches need confirmation
    if (match.reportedBy && !match.confirmedBy) return false;
    
    // Staff-reported matches (no confirmedBy needed) or confirmed matches
    return true;
  });
}
```

**Also update callsites:**
- `rounds.service.ts:239` - Pass confirmation fields to `areAllMatchesReported()`
- `rounds.service.ts:396` - Same update needed

---

### 3. CRITICAL: Race Condition in Match Result Reporting

**Issue:** Multiple concurrent requests can overwrite match results. No transaction or locking mechanism.

**Location:**
- `apps/backend/src/matches/matches.service.ts:267-349` - `playerReportResult()`
- `apps/backend/src/matches/matches.service.ts:354-485` - `confirmMatchResult()`

**Problem:**
```typescript
// Current code - vulnerable to race conditions
const match = await this.prisma.match.findUnique({ ... });

// Between here and update, another request could modify match
const updatedMatch = await this.prisma.match.update({ ... });
```

**Race Condition Scenario:**
1. Player A reports: `PLAYER_A_WIN` at T1
2. Player B reports: `PLAYER_B_WIN` at T2 (before A's request completes)
3. Both updates succeed, last one wins (incorrect behavior)

**Fix Required:**
Use optimistic locking or transactions:

```typescript
async playerReportResult(...) {
  return await this.prisma.$transaction(async (tx) => {
    // Lock the match row
    const match = await tx.match.findUnique({
      where: { id: matchId },
      include: { round: { include: { event: true } } },
    });
    
    // Double-check conditions within transaction
    if (match.confirmedBy) {
      throw new BadRequestException('Match already confirmed');
    }
    
    if (match.round.status !== 'ACTIVE') {
      throw new BadRequestException('Round not active');
    }
    
    // Update atomically
    return await tx.match.update({ ... });
  });
}
```

---

### 4. Missing Backend Validation for Match Results

**Issue:** No validation that `gamesWonA`/`gamesWonB` values are consistent with `result`.

**Location:**
- `apps/backend/src/matches/matches.service.ts` - All result reporting methods

**Problems:**
- No validation that `PLAYER_A_WIN` means `gamesWonA > gamesWonB`
- No validation for Bo3 consistency (e.g., winner must have 2 games)
- No validation that game scores are non-negative
- Frontend validates but backend doesn't (security risk)

**Fix Required:**
Add validation function:

```typescript
function validateMatchResult(
  result: MatchResult,
  gamesWonA: number,
  gamesWonB: number,
  isBo3: boolean = false
): void {
  // Non-negative games
  if (gamesWonA < 0 || gamesWonB < 0) {
    throw new BadRequestException('Game scores cannot be negative');
  }
  
  if (isBo3) {
    // Bo3 validation
    if (gamesWonA > 2 || gamesWonB > 2) {
      throw new BadRequestException('Maximum games in Bo3 is 2');
    }
    if (gamesWonA === 2 && gamesWonB === 2) {
      throw new BadRequestException('Invalid score: both players cannot win 2 games');
    }
    if (result === 'PLAYER_A_WIN' && gamesWonA !== 2) {
      throw new BadRequestException('Winner must have 2 games in Bo3');
    }
    if (result === 'PLAYER_B_WIN' && gamesWonB !== 2) {
      throw new BadRequestException('Winner must have 2 games in Bo3');
    }
  } else {
    // 1v1 validation
    if (result === 'PLAYER_A_WIN' && gamesWonA <= gamesWonB) {
      throw new BadRequestException('Player A win requires gamesWonA > gamesWonB');
    }
    if (result === 'PLAYER_B_WIN' && gamesWonB <= gamesWonA) {
      throw new BadRequestException('Player B win requires gamesWonB > gamesWonA');
    }
    if (result === 'DRAW' && (gamesWonA !== gamesWonB || gamesWonA !== 1)) {
      throw new BadRequestException('Draw in 1v1 should be 1-1');
    }
  }
}
```

---

## High Priority Issues

### 5. No Automatic Round Completion Check

**Issue:** When the last match is confirmed, the round should automatically check if it can be completed. Currently requires manual staff action.

**Location:**
- `apps/backend/src/matches/matches.service.ts:432` - After confirmation

**Impact:** Staff must manually check and complete rounds. Can delay tournaments.

**Fix Required:**
Add automatic check after match confirmation:

```typescript
async confirmMatchResult(...) {
  // ... existing confirmation code ...
  
  // After successful confirmation, check if round can be completed
  const round = await this.prisma.round.findUnique({
    where: { id: match.roundId },
    include: { matches: true, event: true },
  });
  
  const allReported = areAllMatchesReported(
    round.matches.map((m) => ({
      result: m.result,
      playerBId: m.playerBId,
      reportedBy: m.reportedBy,
      confirmedBy: m.confirmedBy,
      overriddenBy: m.overriddenBy,
    }))
  );
  
  if (allReported && round.status === 'ACTIVE') {
    // Emit event that round is ready for completion
    this.realtimeGateway.emitRoundReadyToComplete(
      round.eventId,
      round.id,
      round.roundNumber
    );
    
    // Optional: Auto-complete if configured
    // await this.roundsService.completeRound(round.id, userOrgId);
  }
}
```

---

### 6. Rating Updates Can Fail Silently

**Issue:** Rating updates are wrapped in try-catch and errors are only logged. Match results succeed even if ratings fail.

**Location:**
- `apps/backend/src/matches/matches.service.ts:164-168`

**Impact:** Players' ratings may be out of sync with match results.

**Current Code:**
```typescript
try {
  await this.updatePlayerRatings(...);
} catch (error) {
  console.error('Failed to update player ratings:', error);
  // Match result still returns success
}
```

**Fix Options:**
1. **Make ratings critical** - Fail match result if ratings fail
2. **Retry mechanism** - Queue rating updates for retry
3. **Background job** - Move rating updates to job queue

**Recommended:** Option 3 (background job) to avoid blocking match results, but with monitoring/alerts.

---

### 7. Standings Calculation Includes Game Stats for Unreported Matches

**Issue:** Game wins/losses are tracked even when result is null, leading to incorrect game win percentages.

**Location:**
- `packages/tournament-logic/src/standings.ts:104-107`

**Problem:**
```typescript
// This runs even if result is null!
playerA.gameWins += gamesWonA; // Could be 0 for unreported match
playerA.gameLosses += gamesWonB;
```

**Impact:** Minimal if gamesWon defaults to 0, but still technically incorrect.

**Fix:** Only track game stats when match has a confirmed result (same filtering as points).

---

### 8. Bye Assignment Doesn't Check for Dropped Players

**Issue:** Bye can be assigned to a player who has dropped.

**Location:**
- `packages/tournament-logic/src/pairing.ts:106-134` - `selectByePlayer()`

**Fix Required:**
Filter out dropped players when selecting bye recipient.

---

## Medium Priority Issues

### 9. No Validation for Rematch Avoidance Edge Cases

**Issue:** If rematch avoidance would leave players unpaired, the system falls back to rematch without warning.

**Location:**
- `packages/tournament-logic/src/pairing.ts:256-273` - `findBestOpponent()`

**Impact:** Players may play same opponent twice in smaller tournaments.

**Fix:** Log warning when rematch is unavoidable, or return error forcing manual pairing.

---

### 10. Tournament Completion Logic May Mark Too Early

**Issue:** Condition 3 in `getTournamentStatus()` can mark tournament complete even if more rounds are planned.

**Location:**
- `packages/tournament-logic/src/tournament.ts:91-99`

**Current Logic:**
```typescript
if (currentRound >= recommendedRounds && allMatchesReported) {
  const undefeatedPlayers = standings.filter(...);
  if (undefeatedPlayers.length === 1) {
    isComplete = true; // ❌ Ignores totalRoundsPlanned
  }
}
```

**Fix:** Only auto-complete if also at or past `totalRoundsPlanned`:

```typescript
if (currentRound >= recommendedRounds && 
    currentRound >= targetRounds && 
    allMatchesReported) {
  // ... existing logic
}
```

---

### 11. Transaction Handling Inconsistency

**Issue:** Some operations use transactions, others don't. Inconsistent pattern.

**Locations:**
- ✅ Uses transaction: `rounds.service.ts:111`, `events.service.ts:251`
- ❌ No transaction: `matches.service.ts:267`, `matches.service.ts:354`

**Recommendation:** Standardize on transaction usage for all state-changing operations.

---

### 12. Missing Indexes for Common Queries

**Issue:** Some queries may be slow under load.

**Recommendations:**
```prisma
// In schema.prisma
model Match {
  // Add composite index for round completion checks
  @@index([roundId, result, confirmedBy])
  
  // Add index for player match lookups
  @@index([playerAId, playerBId])
}

model Round {
  // Add index for active round queries
  @@index([eventId, status, roundNumber])
}
```

---

## Automation Opportunities

### 13. Automatic Round Completion (High Value)

**Current:** Staff must manually click "Complete Round" button.

**Proposed:** When all matches are confirmed/reported, automatically:
1. Mark round as COMPLETED
2. Check if tournament should be marked COMPLETED
3. Notify staff that round completed
4. Suggest creating next round

**Implementation:** Add background job that checks every 30 seconds for rounds ready to complete.

---

### 14. Automatic Next Round Generation Suggestion

**Current:** Staff must manually create next round.

**Proposed:** When round completes:
1. Show prominent UI suggestion to create next round
2. Pre-fill pairing generation with one-click confirm
3. Auto-start round timer when pairings are posted

---

### 15. Notification System for Match Reporting

**Current:** Players must refresh to see opponent's reported result.

**Proposed:**
- Push notification when opponent reports result
- In-app notification badge
- Email notification for disputes

---

### 16. Standings Auto-Update with Real-time Sync

**Current:** Standings update on confirmation but may have race conditions.

**Proposed:** 
- Event-driven standings recalculation
- WebSocket push of standings updates
- Optimistic UI updates with rollback on conflict

---

## Best Practices Recommendations

### 17. Add Comprehensive Logging

**Missing:** Detailed logs for:
- Match result changes (who, when, what)
- Round state transitions
- Tournament completion events
- Pairing generation decisions

**Recommended:** Use structured logging (Winston/Pino) with correlation IDs.

---

### 18. Add Metrics/Monitoring

**Missing:**
- Round completion time metrics
- Match reporting latency
- Standings calculation performance
- Error rates by endpoint

**Recommended:** Integrate with monitoring service (Datadog, New Relic, etc.)

---

### 19. Add Integration Tests

**Current:** Only basic E2E test exists.

**Recommended:** Add tests for:
- Concurrent match reporting
- Round completion with various match states
- Standings accuracy with confirmed/unconfirmed matches
- Bye assignment edge cases

---

### 20. Database Constraints for Data Integrity

**Missing:** Some constraints that could prevent bad data:

```prisma
model Match {
  // Prevent invalid game scores
  // (Would require CHECK constraint in migration)
  
  // Ensure confirmedBy is different from reportedBy
  // (Application logic, but could add DB constraint)
}
```

---

## Testing Recommendations

### Critical Test Cases Needed

1. **Match Confirmation Flow:**
   - Player A reports, Player B confirms → standings updated
   - Player A reports, Player B disputes → standings NOT updated
   - Staff override → standings updated immediately

2. **Concurrent Operations:**
   - Two players report simultaneously → only one succeeds
   - Round completion while match being reported → proper locking

3. **Standings Accuracy:**
   - Unconfirmed matches excluded from standings
   - Confirmed matches included in standings
   - Admin overrides included in standings

4. **Round Completion:**
   - All confirmed → round can complete
   - One unconfirmed → round cannot complete
   - All confirmed but one disputed → proper handling

5. **Bye Assignment:**
   - Odd player count → bye assigned correctly
   - Multiple byes needed → each player gets at most one
   - Dropped player → not assigned bye

---

## Implementation Priority

### Phase 1: Critical Fixes (Week 1)
1. Fix standings calculation to exclude unconfirmed matches
2. Fix round completion logic to check confirmation
3. Add race condition protection to match reporting
4. Add backend validation for match results

### Phase 2: High Priority (Week 2)
5. Add automatic round completion check
6. Fix rating update error handling
7. Fix bye assignment for dropped players
8. Add transaction consistency

### Phase 3: Automation (Week 3-4)
9. Implement automatic round completion
10. Add next round generation suggestions
11. Add notification system
12. Real-time standings updates

### Phase 4: Polish (Ongoing)
13. Add comprehensive logging
14. Add monitoring/metrics
15. Expand test coverage
16. Performance optimization

---

## Conclusion

The tournament system has a solid foundation but requires **critical fixes** before production use, particularly around match confirmation handling and race conditions. With these fixes implemented, the system will be production-ready and significantly more automated for shop staff.

**Estimated Effort:** 3-4 weeks for critical + high priority fixes, 2-3 weeks for automation improvements.

**Risk Level:** High (without critical fixes), Medium (with fixes), Low (with full automation).

---

## Appendix: Code Changes Summary

### Files Requiring Changes

1. `packages/tournament-logic/src/tournament.ts` - Update `areAllMatchesReported()`
2. `packages/tournament-logic/src/standings.ts` - Filter unconfirmed matches (or fix caller)
3. `apps/backend/src/standings/standings.service.ts` - Filter matches before calculating
4. `apps/backend/src/matches/matches.service.ts` - Add validation, transactions, auto-completion check
5. `apps/backend/src/rounds/rounds.service.ts` - Update `areAllMatchesReported()` callsites
6. `packages/tournament-logic/src/pairing.ts` - Fix bye assignment

### New Files Needed

1. `apps/backend/src/matches/match-validation.ts` - Validation utilities
2. `apps/backend/src/rounds/round-completion.service.ts` - Auto-completion logic
3. `apps/backend/src/jobs/round-completion-checker.ts` - Background job for auto-completion

