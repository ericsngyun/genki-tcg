# Production Readiness Roadmap

**Last Updated:** December 8, 2025  
**Current Status:** Beta (~70% complete)  
**Target:** App Store submission ready

---

## Executive Summary

This roadmap prioritizes the critical path to production and App Store approval. Tasks are ordered by **blocking dependencies** and **risk to users**.

| Phase | Duration | Focus |
|-------|----------|-------|
| **Phase 1** | Week 1-2 | Security fixes (CRITICAL blockers) |
| **Phase 2** | Week 3 | Testing infrastructure |
| **Phase 3** | Week 4 | Missing mobile features |
| **Phase 4** | Week 5 | App Store preparation |

---

## Phase 1: Security Fixes (CRITICAL)

> [!CAUTION]
> These vulnerabilities allow cross-organization data access and financial manipulation. **Do not deploy to production until fixed.**

### P0-1: IDOR Vulnerability Fixes (8-10 hours)

**Problem:** Users can access any organization's events, matches, and standings by ID.

**Files to modify:**

| File | Change Required |
|------|-----------------|
| `events.controller.ts` | Pass `user.orgId` to all service methods |
| `events.service.ts` | Add `orgId` filter to all queries |
| `rounds.controller.ts` | Pass `user.orgId` to service methods |
| `rounds.service.ts` | Validate event belongs to org |
| `matches.controller.ts` | Pass `user.orgId` to service methods |
| `matches.service.ts` | Validate match's event belongs to org |
| `standings.controller.ts` | Pass `user.orgId` to service |
| `standings.service.ts` | Add `orgId` validation |
| `decklists.controller.ts` | Pass `user.orgId` to service |
| `decklists.service.ts` | Validate entry's event belongs to org |

**Pattern to apply:**
```typescript
// Controller - pass orgId
async getEvent(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
  return this.eventsService.getEvent(id, user.orgId);
}

// Service - validate ownership
async getEvent(eventId: string, userOrgId: string) {
  const event = await this.prisma.event.findFirst({
    where: { id: eventId, orgId: userOrgId }
  });
  if (!event) throw new ForbiddenException('Event not found');
  return event;
}
```

---

### P0-2: DTO Class Conversion (6-8 hours)

**Problem:** All DTOs are TypeScript interfaces. ValidationPipe has no effect.

**Files to create/modify:**

| DTO | Location | Decorators Needed |
|-----|----------|-------------------|
| `CreateEventDto` | `events/dto/create-event.dto.ts` | `@IsString`, `@IsEnum`, `@IsDate`, `@IsOptional`, `@Min` |
| `UpdateEventDto` | `events/dto/update-event.dto.ts` | `@IsOptional` + all above |
| `SignupDto` | `auth/dto/signup.dto.ts` | `@IsEmail`, `@IsString`, `@MinLength` |
| `LoginDto` | `auth/dto/login.dto.ts` | `@IsEmail`, `@IsString` |
| `ReportMatchResultDto` | `matches/dto/report-match.dto.ts` | `@IsEnum`, `@IsNumber`, `@Min` |
| `CreditAdjustDto` | `credits/dto/credit-adjust.dto.ts` | `@IsNumber`, `@IsEnum`, `@IsOptional` |
| `SubmitDecklistDto` | `decklists/dto/submit-decklist.dto.ts` | `@IsString`, `@IsOptional`, `@IsUrl` |
| `DistributePrizesDto` | `events/dto/distribute-prizes.dto.ts` | `@ValidateNested`, `@IsArray` |

**Example conversion:**
```typescript
// Before (interface - NO validation)
export interface CreateEventDto {
  name: string;
  game: GameType;
}

// After (class - VALIDATES at runtime)
import { IsString, IsEnum, IsOptional, Min } from 'class-validator';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsEnum(GameType)
  game: GameType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFeeCents?: number;
}
```

---

### P0-3: Payment Validation (3-4 hours)

**Problem:** Staff can mark any payment amount, bypassing entry fees.

**File:** `events.service.ts`

**Changes:**
1. Validate `amount >= 0`
2. Validate `amount === event.entryFeeCents` (or allow explicit discount with audit)
3. Use database transaction to prevent race conditions

```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number, orgId: string) {
  return this.prisma.$transaction(async (tx) => {
    const entry = await tx.entry.findFirst({
      where: { id: entryId, event: { orgId } },
      include: { event: true }
    });
    
    if (!entry) throw new ForbiddenException('Entry not found');
    if (entry.paidAt) throw new BadRequestException('Already paid');
    
    const paidAmount = amount ?? entry.event.entryFeeCents ?? 0;
    if (paidAmount < 0) throw new BadRequestException('Invalid amount');
    
    return tx.entry.update({
      where: { id: entryId },
      data: { paidAt: new Date(), paidAmount, paidBy: confirmedBy }
    });
  });
}
```

---

### P0-4: Prize Distribution Validation (3-4 hours)

**Problem:** Staff can distribute unlimited prizes to anyone.

**File:** `events.service.ts`

**Validations to add:**
1. Total distributed ≤ `event.totalPrizeCredits`
2. All recipients are registered in the event
3. All amounts are positive
4. No duplicate placements
5. Event belongs to user's org

---

### P0-5: Rate Limiting & Security Headers (2-3 hours)

**Files:** `main.ts`, add `@nestjs/throttler`

**Changes:**
1. Install `@nestjs/throttler`
2. Configure 100 requests/minute per IP
3. Stricter limits on auth endpoints (10/minute)
4. Add Helmet for security headers

```typescript
// main.ts
import helmet from 'helmet';
app.use(helmet());

// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';
ThrottlerModule.forRoot({ ttl: 60, limit: 100 }),
```

---

## Phase 2: Testing Infrastructure (Week 3)

### P1-1: Backend Unit Tests (10-12 hours)

**Priority test files to create:**

| File | Tests For |
|------|-----------|
| `auth.service.spec.ts` | Login, signup, JWT validation |
| `events.service.spec.ts` | CRUD, registration, check-in |
| `rounds.service.spec.ts` | Pairing generation, round lifecycle |
| `matches.service.spec.ts` | Result reporting, override |
| `credits.service.spec.ts` | Ledger entries, balance updates |
| `ratings.service.spec.ts` | Glicko-2 calculations, tier mapping |

**Coverage target:** 80%+

---

### P1-2: E2E Tests (8-10 hours)

**Critical workflows to test:**

1. **Tournament lifecycle:** Create event → Register → Check-in → Generate rounds → Report results → Complete
2. **Payment flow:** Register → Mark paid → Check-in
3. **Rating flow:** Complete tournament → Process ratings → Verify leaderboard

---

### P1-3: CI/CD Pipeline (4-5 hours)

**Create:** `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
```

---

## Phase 3: Missing Mobile Features (Week 4)

### P1-4: Mobile Match Result Reporting (6-8 hours)

**New files:**
- `apps/mobile/app/report-result.tsx`
- `apps/mobile/components/MatchResultForm.tsx`

**Features:**
- Select winner/draw
- Input game scores (2-0, 2-1, etc.)
- Confirmation dialog
- Real-time sync with admin

---

### P1-5: Real-Time Updates in Mobile (6-8 hours)

**Files to modify:**
- `apps/mobile/lib/socket.ts` (new)
- `apps/mobile/app/events/[id]/pairings.tsx`
- `apps/mobile/app/events/[id]/standings.tsx`

**Features:**
- WebSocket connection to backend
- Auto-refresh on pairing/standings updates
- Push notification for new rounds

---

### P1-6: Mobile Decklist Submission (6-8 hours)

**New files:**
- `apps/mobile/app/submit-decklist.tsx`

**Features:**
- Deck name input
- Decklist URL input
- View submission status
- Lock indicator

---

## Phase 4: App Store Preparation (Week 5)

### P2-1: Legal Documents (2-3 hours)

| Document | Status | Action |
|----------|--------|--------|
| `PRIVACY_POLICY.md` | ✅ Created | Host publicly at yourdomain.com/privacy |
| `TERMS_OF_SERVICE.md` | ✅ Created | Host publicly at yourdomain.com/terms |

---

### P2-2: App Store Assets (4-6 hours)

**iOS (App Store Connect):**
- [ ] App icon 1024x1024 (no transparency)
- [ ] Screenshots 6.7" (1290x2796) - minimum 3
- [ ] Screenshots 6.5" (1284x2778) - minimum 3
- [ ] Privacy policy URL

**Android (Google Play):**
- [ ] App icon 512x512
- [ ] Feature graphic 1024x500
- [ ] Screenshots - minimum 2

**Screenshot content (8 total):**
1. Events list
2. Event details
3. Pairings view
4. Standings view
5. Leaderboard
6. Match reporting
7. Profile/stats
8. Wallet/credits

---

### P2-3: Build & Submit (4-6 hours)

```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios

# Android
eas build --platform android --profile production
eas submit --platform android
```

---

## Checklist Summary

### Week 1-2: Security (Must Complete)
- [ ] P0-1: IDOR fixes for all endpoints
- [ ] P0-2: Convert all DTOs to classes
- [ ] P0-3: Payment validation + transactions
- [ ] P0-4: Prize distribution validation
- [ ] P0-5: Rate limiting + security headers

### Week 3: Testing
- [ ] P1-1: Backend unit tests (80%+ coverage)
- [ ] P1-2: E2E tests for critical paths
- [ ] P1-3: CI/CD pipeline

### Week 4: Mobile Features
- [ ] P1-4: Match result reporting
- [ ] P1-5: Real-time WebSocket updates
- [ ] P1-6: Decklist submission

### Week 5: App Store
- [ ] P2-1: Host privacy policy & terms
- [ ] P2-2: Create app store assets
- [ ] P2-3: Build and submit

---

## Estimated Total Effort

| Phase | Hours | Calendar |
|-------|-------|----------|
| Security fixes | 22-29 hrs | 1-2 weeks |
| Testing | 22-27 hrs | 1 week |
| Mobile features | 18-24 hrs | 1 week |
| App Store prep | 10-15 hrs | 1 week |
| **Total** | **72-95 hrs** | **4-5 weeks** |

---

## Success Criteria

Before submitting to App Store:

- [ ] Zero CRITICAL security vulnerabilities
- [ ] 80%+ test coverage
- [ ] All critical mobile features working
- [ ] Privacy policy hosted publicly
- [ ] Screenshots and assets ready
- [ ] Test account prepared for review team
