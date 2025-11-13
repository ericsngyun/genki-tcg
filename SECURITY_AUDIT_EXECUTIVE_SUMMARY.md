# GENKI TCG API - Security Audit Executive Summary

**Audit Date:** November 13, 2025  
**Scope:** All API controllers in `/apps/backend/src`  
**Controllers Audited:** 8  
**Endpoints Audited:** 28  
**Total Vulnerabilities Found:** 14  

## Overview

This comprehensive security audit of the Genki TCG API has identified **14 distinct vulnerability classes** with **5 CRITICAL severity** issues. The most severe vulnerabilities affect authentication, authorization, financial transaction safety, and data integrity.

**Key Finding:** The system has **multiple CRITICAL level vulnerabilities that could result in:**
- Unauthorized access to competitor organizations' tournament data
- Financial fraud through payment bypass and prize manipulation
- Concurrent payment processing vulnerabilities
- Complete bypass of input validation

## Critical Issues Summary

### 1. **INSECURE DIRECT OBJECT REFERENCE (IDOR)** - Organization Isolation Failure
**Severity:** CRITICAL | **Type:** Access Control  
**Affected:** 11 endpoints across 5 services

**Problem:** Resources are queried by ID only, with no organization validation. A user from Organization A can read/modify events, rounds, matches, and standings from Organization B.

**Examples of Exposure:**
- `GET /events/{id}` - Anyone can read any event details
- `PATCH /events/{id}` - Anyone can modify any event
- `GET /standings/events/{id}` - Anyone can view standings for any event
- `GET /rounds/{id}/pairings` - Anyone can see match pairings

**Business Impact:** Complete data isolation failure between organizations - massive privacy and competitive breach.

---

### 2. **NO RUNTIME INPUT VALIDATION** - False Security Configuration
**Severity:** CRITICAL | **Type:** Input Validation  
**Affected:** All 7 DTOs

**Problem:** All DTOs are TypeScript interfaces (compile-time only), not classes. The configured ValidationPipe cannot validate interfaces, making input validation non-functional despite appearing to be configured.

**What This Allows:**
```javascript
// All of these pass validation (they shouldn't):
POST /events {name: 12345, game: "INVALID"}  // Wrong types
POST /credits/adjust {amount: -999999}        // Negative values
POST /auth/signup {email: "test"}             // Missing required fields
POST /events/prizes {distributions: []}       // Negative amounts
```

**Business Impact:** No input validation means attackers can send malformed data, negative amounts, and wrong types that bypass application logic.

---

### 3. **PAYMENT BYPASS VULNERABILITY** - Financial Control Failure
**Severity:** CRITICAL | **Type:** Business Logic / Financial  
**Endpoint:** `POST /events/entries/{entryId}/mark-paid`

**Problem:** Staff can mark ANY payment amount, including $0, to bypass entry fee requirements.

**Attack:**
```javascript
// Event requires $50 entry fee
POST /events/entries/entry-123/mark-paid {amount: 0}
// Result: Entry marked paid without payment
```

**Business Impact:** Potential loss of entire entry fee revenue for every tournament.

---

### 4. **PRIZE DISTRIBUTION MANIPULATION** - Financial Fraud Risk
**Severity:** CRITICAL | **Type:** Business Logic / Financial  
**Endpoint:** `POST /events/{id}/distribute-prizes`

**Problems:**
- No validation that total distributed amount <= allocated prize pool
- Can distribute to users not in the event
- Can use negative amounts to deduct credits
- No validation of placement numbers

**Attack Example:**
```javascript
// Event has 100,000 credits total prize pool
POST /events/event-123/distribute-prizes {
  distributions: [
    {userId: "accomplice", amount: 500000, placement: 1}  // 5x pool!
  ]
}
// Result: 500K credits issued instead of 100K
```

**Business Impact:** Unlimited fraud potential through prize distribution.

---

### 5. **RACE CONDITION IN PAYMENT MARKING** - Concurrency Vulnerability
**Severity:** CRITICAL | **Type:** Concurrency  
**Endpoint:** `POST /events/entries/{entryId}/mark-paid`

**Problem:** Payment marked with non-atomic check-then-update pattern. Multiple concurrent requests could both succeed when only one should.

**Attack Timeline:**
```
Thread A: Check entry.paidAt is null ✓
Thread B: Check entry.paidAt is null ✓
Thread A: Update entry.paidAt
Thread B: Update entry.paidAt  ✗ (Should fail but doesn't)
Result: Same entry marked paid twice
```

**Business Impact:** Under load, payments processed multiple times, breaking financial records.

---

## High Severity Issues (6)

| # | Issue | Endpoints | Impact |
|---|-------|-----------|--------|
| 6 | Missing Entry Ownership Checks | check-in, mark-paid, drop | Staff can operate on any event's entries |
| 7 | Missing Event Ownership in Rounds | POST /rounds/events/{id}/next | Staff can create rounds in other orgs |
| 8 | Missing Match Ownership | report, override | Staff can modify any match |
| 9 | Unvalidated Search Parameter | GET /orgs/users | Potential injection/DoS |
| 10 | Missing Decklist Ownership | lock, lock-all | Staff can lock decklists in other orgs |
| 11 | Check-in Bypass via Late Add | POST /events/{id}/add-late-player | Auto check-in bypasses payment |

---

## Medium Severity Issues (3)

| # | Issue | Impact |
|---|-------|--------|
| 12 | Untyped DTOs in Specific Endpoints | Inline objects not validated |
| 13 | Sensitive Data in CSV Export | PII exported without org validation |
| 14 | Weak Match Result Validation | Game counts not bounded |

---

## Statistics

**Endpoint Coverage:**
- Total endpoints: 28
- Endpoints with Critical/High severity: 17 (61%)
- Endpoints with authorization issues: 11 (39%)

**Vulnerability Breakdown:**
- Critical: 5 issues (9 distinct problem types across multiple endpoints)
- High: 6 issues
- Medium: 3 issues
- **Total: 14 vulnerability types**

**Files Most Affected:**
1. `events.service.ts` - 7 issues (4 critical + 3 high)
2. `events.controller.ts` - 5 issues (2 critical + 3 high)
3. `auth.service.ts` - 1 critical (affects auth for entire system)
4. `matches.service.ts` - 2 issues (1 critical + 1 high)
5. `rounds.service.ts` - 2 issues (1 critical + 1 high)

---

## Risk Assessment

### Likelihood: HIGH
- API is production-ready code
- Multiple security mechanisms are bypassed
- No apparent security testing in place

### Impact: CRITICAL
- **Financial:** Direct fraud potential in payments and prizes
- **Data Privacy:** Cross-org data access (IDOR)
- **Data Integrity:** Race conditions in financial operations
- **Business Operations:** Tournament management compromise

### Overall Risk: **CRITICAL** 🔴

**Recommendation:** Do not deploy to production until all CRITICAL issues are resolved.

---

## Immediate Action Items (Must Fix Before Deployment)

### Phase 1: Foundation (1-2 days)
1. **Convert all DTOs to classes** with validation decorators
   - auth.service.ts: SignupDto, LoginDto
   - events.service.ts: CreateEventDto, UpdateEventDto
   - credits.service.ts: CreditAdjustDto
   - decklists.service.ts: SubmitDecklistDto
   - matches.service.ts: ReportMatchResultDto

2. **Add orgId parameter** to all service methods
   - Pass user.orgId from controller to service
   - Filter all queries by orgId
   - Throw ForbiddenException if resource not in org

### Phase 2: Financial Security (1-2 days)
3. **Fix payment marking** (`events.service.ts:112`)
   - Validate amount === entry.event.entryFeeCents
   - Use database transaction for atomic operation
   - Add unique constraint or pessimistic locking

4. **Fix prize distribution** (`events.service.ts:140`)
   - Validate total amount <= event.totalPrizeCredits
   - Validate all users are in event
   - Validate all amounts are positive
   - Add orgId validation

### Phase 3: Access Control (1-2 days)
5. **Add entry ownership validation**
   - checkIn, markAsPaid, dropPlayer need entry.event.orgId check
   
6. **Remove auto check-in** from late add
   - Don't set checkedInAt in addLatePlayer
   - Require explicit check-in after late add

7. **Remove IDOR vulnerabilities**
   - All endpoints reading/modifying resources need orgId filter

---

## Testing Recommendations

After fixes, test these scenarios:

**IDOR Prevention:**
```javascript
// Create events in Org A and Org B
// User from Org A should NOT access Org B's events
GET /events/org-b-event-id  // Should 404
PATCH /events/org-b-event-id  // Should 403
```

**Payment Security:**
```javascript
// Mark payment with $0
POST /events/entries/{id}/mark-paid {amount: 0}  // Should reject
// Concurrent payment marking
// Both requests should not succeed
```

**Prize Distribution:**
```javascript
// Try to distribute more than allocated
POST /events/{id}/distribute-prizes {
  distributions: [{amount: 999999}]
}
// Should reject: exceeds pool

// Try to distribute to non-participant
POST /events/{id}/distribute-prizes {
  distributions: [{userId: "non-participant", amount: 100}]
}
// Should reject: user not in event
```

---

## Detailed Audit Reports

Three detailed reports have been generated:

1. **SECURITY_AUDIT.md** - Complete vulnerability analysis with code examples and fixes
2. **VULNERABILITY_MATRIX.txt** - Quick reference matrix of all issues
3. **FILE_BY_FILE_AUDIT.txt** - Line-by-line security review of each controller

---

## Remediation Effort Estimate

| Task | Effort | Priority |
|------|--------|----------|
| Convert DTOs to classes | 4-6 hours | Critical |
| Add orgId validation to all services | 4-6 hours | Critical |
| Fix payment/prize vulnerabilities | 4-6 hours | Critical |
| Add entry ownership checks | 2-3 hours | High |
| Fix race conditions | 2-3 hours | Critical |
| Add input validation for search/query params | 1-2 hours | High |
| **Total** | **17-26 hours** | **Before Deploy** |

---

## Conclusion

The Genki TCG API has serious security vulnerabilities affecting core business logic (payments, prizes) and data isolation between organizations. The system is **NOT SAFE FOR PRODUCTION** in its current state.

**Recommended Actions:**
1. ✋ **STOP:** Do not deploy to production
2. 🔧 **FIX:** Address critical vulnerabilities immediately
3. ✅ **VERIFY:** Comprehensive security testing before deployment
4. 📋 **ESTABLISH:** Security review process for future PRs

**Next Steps:**
- Review detailed reports
- Create tickets for each vulnerability
- Assign fixes to development team
- Schedule security-focused testing
- Consider external security audit before public launch

---

**Report Generated:** November 13, 2025  
**Audited By:** Claude Code Security Audit  
**Scope:** Comprehensive - All backend controllers in `/apps/backend/src`

