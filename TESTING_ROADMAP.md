# 🧪 Testing Roadmap - Genki TCG

**Status**: Phase 1 - Infrastructure Setup Complete ✅
**Current Coverage**: TBD (running tests now)
**Target Coverage**: 80%

---

## Infrastructure Status

### ✅ Completed

1. **Jest Configuration** (`jest.config.js`)
   - TypeScript support with ts-jest
   - Coverage thresholds: 70% (branches, functions, lines, statements)
   - Module name mapping
   - Test setup integration

2. **Test Setup** (`test/setup.ts`)
   - Global test database connection
   - 30-second timeout for database operations
   - Database cleanup utility (`cleanDatabase()`)
   - Proper teardown hooks

3. **Existing Test Files** (Fixed TypeScript errors)
   - ✅ `auth.service.spec.ts` - Comprehensive auth tests
   - ✅ `events.service.spec.ts` - Event management + IDOR validation
   - ✅ `ratings.service.spec.ts` - Basic rating service setup
   - ✅ `ratings.controller.spec.ts` - Controller setup

---

## Test Coverage Analysis

### Services WITH Tests

#### 1. **AuthService** ✅ COMPREHENSIVE
**File**: `src/auth/auth.service.spec.ts`

**Coverage**:
- ✅ Signup with valid invite code
- ✅ Signup with duplicate email (ConflictException)
- ✅ Signup with invalid invite code (UnauthorizedException)
- ✅ Password hashing verification
- ✅ Login with valid credentials
- ✅ Login with invalid email (UnauthorizedException)
- ✅ Login with invalid password (UnauthorizedException)
- ✅ Password hash not exposed in response
- ✅ User validation

**Security Tests**:
- ✅ IDOR protection (invite code validation)
- ✅ Password security (bcrypt hashing)
- ✅ Sensitive data not leaked (passwordHash excluded)

#### 2. **EventsService** ✅ GOOD COVERAGE
**File**: `src/events/events.service.spec.ts`

**Coverage**:
- ✅ Get event with org validation (IDOR test)
- ✅ Get event from different org (ForbiddenException)
- ✅ Get event that doesn't exist (NotFoundException)
- ✅ Register for event with org validation
- ✅ Register with duplicate entry (BadRequestException)
- ✅ Prize distribution with transaction
- ✅ Prize distribution already done (BadRequestException)

**Security Tests**:
- ✅ IDOR protection (cross-org access denied)
- ✅ Financial validation (prize distribution)

---

### Services WITHOUT Tests (Need to Add)

#### 3. **MatchesService** ❌ MISSING
**Priority**: HIGH (handles match results + financial implications)

**Critical Tests Needed**:
- Match result reporting (staff)
- Player self-reporting with validation
- Match confirmation flow
- Cross-org access protection (IDOR)
- Invalid result validation
- Game score validation (0-3 range)
- Atomic transaction verification

**Estimated Time**: 3-4 hours

#### 4. **RoundsService** ❌ MISSING
**Priority**: HIGH (tournament core logic)

**Critical Tests Needed**:
- Swiss pairing generation
- Round creation with org validation
- Round start/complete flow
- Tournament status calculation
- Cross-org access protection (IDOR)
- Regenerate pending round

**Estimated Time**: 3-4 hours

#### 5. **CreditsService** ❌ MISSING
**Priority**: HIGH (financial operations)

**Critical Tests Needed**:
- Credit adjustment with validation
- Negative balance prevention
- Ledger entry creation
- Balance calculation accuracy
- Transaction atomicity
- Cross-org validation

**Estimated Time**: 2-3 hours

#### 6. **StandingsService** ❌ MISSING
**Priority**: MEDIUM (read-only, uses tournament-logic package)

**Tests Needed**:
- Standings calculation
- Cross-org access protection
- OMW% calculation accuracy
- Tiebreaker verification

**Estimated Time**: 2 hours

#### 7. **DecklistsService** ❌ MISSING
**Priority**: MEDIUM

**Tests Needed**:
- Decklist submission
- Lock functionality
- Cross-org access protection
- Duplicate submission handling

**Estimated Time**: 2 hours

#### 8. **NotificationsService** ❌ MISSING
**Priority**: LOW

**Tests Needed**:
- Notification creation
- Push notification delivery
- Preference handling

**Estimated Time**: 2 hours

---

## Integration Tests (Phase 2)

### Critical Flows to Test

#### 1. **Auth Flow** (E2E)
**File**: `test/integration/auth.e2e-spec.ts`

```typescript
describe('Auth Flow (e2e)', () => {
  it('should signup, login, and access protected endpoint', async () => {
    // 1. Create org with invite code
    // 2. Signup with invite code
    // 3. Login and get access token
    // 4. Access protected endpoint with token
  });

  it('should prevent cross-org access', async () => {
    // 1. Create user in Org A
    // 2. Create event in Org B
    // 3. Attempt to access Org B event with Org A user
    // 4. Expect 403 Forbidden
  });
});
```

**Estimated Time**: 2-3 hours

#### 2. **Event Lifecycle** (E2E)
**File**: `test/integration/event-lifecycle.e2e-spec.ts`

```typescript
describe('Event Lifecycle (e2e)', () => {
  it('should complete full event flow', async () => {
    // 1. Create event
    // 2. Register players
    // 3. Mark payments
    // 4. Check in players
    // 5. Start event
    // 6. Generate rounds
    // 7. Report results
    // 8. Complete tournament
    // 9. Distribute prizes
    // 10. Verify credit balances
  });
});
```

**Estimated Time**: 3-4 hours

#### 3. **Tournament Flow** (E2E)
**File**: `test/integration/tournament.e2e-spec.ts`

```typescript
describe('Tournament Flow (e2e)', () => {
  it('should run Swiss tournament with proper pairings', async () => {
    // 1. Create event with 8 players
    // 2. Generate Round 1 pairings
    // 3. Report all results
    // 4. Calculate standings
    // 5. Generate Round 2 pairings
    // 6. Verify no rematches
    // 7. Verify bye distribution
  });
});
```

**Estimated Time**: 3-4 hours

#### 4. **Financial Operations** (E2E)
**File**: `test/integration/financial.e2e-spec.ts`

```typescript
describe('Financial Operations (e2e)', () => {
  it('should handle entry fees and prize distribution', async () => {
    // 1. Create event with entry fee
    // 2. Register player
    // 3. Mark payment
    // 4. Complete tournament
    // 5. Distribute prizes
    // 6. Verify ledger entries
    // 7. Verify balance calculations
  });

  it('should prevent negative balances', async () => {
    // Test credit deduction validation
  });
});
```

**Estimated Time**: 2-3 hours

---

## Test Execution Plan

### Week 1: Unit Tests (20-25 hours)

**Day 1-2**: MatchesService + RoundsService tests (6-8 hours)
**Day 3**: CreditsService tests (2-3 hours)
**Day 4**: StandingsService + DecklistsService tests (4 hours)
**Day 5**: NotificationsService + coverage verification (4 hours)

**Deliverable**: 80%+ unit test coverage ✅

### Week 2: Integration Tests (10-12 hours)

**Day 1**: Auth flow E2E tests (2-3 hours)
**Day 2**: Event lifecycle E2E tests (3-4 hours)
**Day 3**: Tournament flow E2E tests (3-4 hours)
**Day 4**: Financial operations E2E tests (2-3 hours)

**Deliverable**: All critical flows tested E2E ✅

---

## Coverage Targets

### Minimum (Required for Production)
- **Overall**: 70% (matches Jest threshold)
- **Critical Services**: 80%+ (Auth, Events, Matches, Rounds, Credits)
- **E2E**: All critical flows covered

### Ideal (Best Practice)
- **Overall**: 80%+
- **Critical Services**: 90%+
- **Integration**: 100% of critical user journeys

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.service.spec

# Run E2E tests
npm run test:e2e
```

### Test Database Setup

```bash
# Create test database
createdb genki_test

# Set test database URL
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/genki_test"

# Run migrations on test database
npx prisma migrate deploy --schema prisma/schema.prisma
```

---

## Test Utilities

### Database Helpers

```typescript
// test/helpers/database.helper.ts
export async function createTestUser(prisma: PrismaClient, orgId: string) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      passwordHash: await bcrypt.hash('Password123!', 10),
      orgId,
      role: 'PLAYER',
    },
  });
}

export async function createTestEvent(prisma: PrismaClient, orgId: string) {
  return prisma.event.create({
    data: {
      name: 'Test Event',
      game: 'ONE_PIECE_TCG',
      format: 'STANDARD',
      startAt: new Date(),
      orgId,
      createdBy: 'test-user',
      status: 'SCHEDULED',
    },
  });
}
```

### Auth Helpers

```typescript
// test/helpers/auth.helper.ts
export function createAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function loginAsUser(app: INestApplication, email: string, password: string) {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  return response.body.accessToken;
}
```

---

## Next Steps

### Immediate (This Week)
1. ✅ Fix TypeScript errors in existing tests - **DONE**
2. ✅ Run tests to verify current coverage - **IN PROGRESS**
3. ⏳ Write MatchesService tests (highest priority)
4. ⏳ Write RoundsService tests
5. ⏳ Write CreditsService tests

### Week 2
1. Complete remaining unit tests
2. Write integration tests
3. Achieve 80%+ coverage
4. Set up CI/CD with test automation

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All critical services have unit tests
- ✅ Coverage reaches 80%+
- ✅ All tests pass consistently
- ✅ IDOR protection verified through tests
- ✅ Financial operations tested thoroughly

### Phase 2 Complete When:
- ✅ All critical user journeys tested E2E
- ✅ Cross-org security verified through integration tests
- ✅ Tournament flow tested end-to-end
- ✅ Financial operations tested with real database

---

**Status**: Infrastructure ready, now writing tests! 🚀

**Last Updated**: December 1, 2025
