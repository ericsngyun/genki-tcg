# GENKI TCG API - COMPREHENSIVE SECURITY AUDIT REPORT

## Executive Summary
This audit identified **14 distinct security vulnerability classes** affecting multiple endpoints, with **5 CRITICAL severity** issues affecting authentication, authorization, input validation, and business logic. The most severe issues are:

1. **Missing Organization Ownership Validation (IDOR)** - Can access any event/round/match
2. **No Runtime Input Validation** - All DTOs are interfaces, not classes
3. **Payment Bypass** - Staff can mark payments for any amount
4. **Prize Manipulation** - Staff can distribute arbitrary credit amounts
5. **Race Conditions** - In payment and credit marking operations

---

## VULNERABILITY DETAILS

### CRITICAL SEVERITY

#### 1. INSECURE DIRECT OBJECT REFERENCE (IDOR) - Missing Organization Validation

**Severity:** CRITICAL  
**Type:** Access Control / Authorization  
**Affected Endpoints:**

| Endpoint | Method | File | Issue |
|----------|--------|------|-------|
| `GET /events/:id` | GET | `/events/events.controller.ts:19` | No orgId verification |
| `PATCH /events/:id` | PATCH | `/events/events.controller.ts:33` | No orgId verification |
| `GET /rounds/:roundId/pairings` | GET | `/rounds/rounds.controller.ts:19` | No round/event validation |
| `GET /matches/:id` | GET | `/matches/matches.controller.ts:20` | No event ownership check |
| `GET /standings/events/:eventId` | GET | `/standings/standings.controller.ts:13` | No orgId validation |

**Root Cause:**
Service methods query resources by ID only, without validating they belong to the user's organization:

```typescript
// /events/events.service.ts:60 - VULNERABLE
async getEvent(eventId: string) {
  return this.prisma.event.findUnique({
    where: { id: eventId },  // ← Only checks ID, no orgId check!
    include: { ... }
  });
}

// /standings/standings.service.ts:9 - VULNERABLE
async calculateCurrentStandings(eventId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },  // ← No orgId filter
    ...
  });
}

// /rounds/rounds.service.ts:96 - VULNERABLE
async getPairings(roundId: string) {
  return this.prisma.match.findMany({
    where: { roundId },  // ← No event->org validation
    ...
  });
}
```

**Attack Scenario:**
```
1. User A gets JWT for Organization "Alpha"
2. User A calls GET /events/event-from-beta-org
3. System returns data without checking User A's orgId
4. User A can read standings, matches, pairings for other orgs
```

**Fix Required:**
Controllers must pass `user.orgId` to services and verify ownership:
```typescript
// In controller:
async getEvent(@Param('id') eventId: string, @CurrentUser() user: any) {
  return this.eventsService.getEvent(eventId, user.orgId);  // Pass orgId
}

// In service:
async getEvent(eventId: string, orgId: string) {
  const event = await this.prisma.event.findFirst({
    where: { 
      id: eventId,
      orgId: orgId  // ← Add organization validation
    }
  });
  if (!event) throw new ForbiddenException('Event not found');
  return event;
}
```

---

#### 2. NO RUNTIME INPUT VALIDATION - All DTOs Are Interfaces, Not Classes

**Severity:** CRITICAL  
**Type:** Input Validation / Type Safety  
**Affected DTOs:**

| DTO | Location | Issue |
|-----|----------|-------|
| `SignupDto` | `/auth/auth.service.ts:12` | Interface, no validation |
| `LoginDto` | `/auth/auth.service.ts:19` | Interface, no validation |
| `CreateEventDto` | `/events/events.service.ts:5` | Interface, no validation |
| `UpdateEventDto` | `/events/events.service.ts:17` | Interface, no validation |
| `CreditAdjustDto` | `/credits/credits.service.ts:6` | Interface, no validation |
| `SubmitDecklistDto` | `/decklists/decklists.service.ts:4` | Interface, no validation |
| `ReportMatchResultDto` | `/matches/matches.service.ts:6` | Interface, no validation |

**Root Cause:**
`main.ts` configures a ValidationPipe, but DTOs are TypeScript interfaces:

```typescript
// main.ts:11-16
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,  // ← No effect on interfaces!
    transform: true,
  })
);
```

ValidationPipe requires **class-based DTOs with decorators** to work:
```typescript
// Current code - DOES NOT VALIDATE
export interface CreateEventDto {  // ← TypeScript interface
  name: string;
  game: GameType;
  format: EventFormat;
  startAt: Date;
  maxPlayers?: number;
  entryFeeCents?: number;
}

// What's needed - VALIDATES AT RUNTIME
export class CreateEventDto {
  @IsString() name: string;
  @IsEnum(GameType) game: GameType;
  @IsEnum(EventFormat) format: EventFormat;
  @IsDate() startAt: Date;
  @IsOptional() @IsNumber() maxPlayers?: number;
  @IsOptional() @IsNumber() @Min(0) entryFeeCents?: number;
}
```

**Attack Scenarios:**

1. **Negative Amount Attack:**
```javascript
POST /credits/adjust
{
  "userId": "victim-id",
  "amount": -999999,  // ← No validation, could be any number
  "reasonCode": "MANUAL_ADD"
}
```

2. **Type Coercion Attack:**
```javascript
POST /events
{
  "name": 12345,                    // ← Expected string
  "game": "INVALID_GAME",           // ← Invalid enum
  "format": { "nested": "object" }, // ← Expected enum
  "startAt": "not-a-date",          // ← Expected Date
  "maxPlayers": "unlimited"          // ← Expected number
}
```

3. **Prize Manipulation (No Validation):**
```javascript
POST /events/{eventId}/distribute-prizes
{
  "distributions": [
    { "userId": "player1", "amount": 999999, "placement": 1 },  // No validation
    { "userId": "player2", "amount": -50000, "placement": 2 }   // Negative!
  ]
}
```

4. **Required Field Bypass:**
```javascript
POST /auth/signup
{
  "email": "attacker@example.com"
  // Missing: password, name, inviteCode - no validation catches this
}
```

**Impact:**
- No runtime type checking
- Negative/invalid values accepted
- Missing required fields pass through
- Extra fields pass through (whitelist is configured but can't work without class DTOs)

---

#### 3. PAYMENT BYPASS VULNERABILITY - Arbitrary Amount Payment Marking

**Severity:** CRITICAL  
**Type:** Business Logic / Financial  
**Affected Endpoint:** `POST /events/entries/:entryId/mark-paid`  
**File:** `/events/events.controller.ts:54`, `/events/events.service.ts:112`

**Vulnerability:**

```typescript
// /events/events.controller.ts:54-62
@Post('entries/:entryId/mark-paid')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async markAsPaid(
  @Param('entryId') entryId: string,
  @CurrentUser() user: any,
  @Body() dto?: { amount?: number }  // ← No DTO class = no validation!
) {
  return this.eventsService.markAsPaid(entryId, user.id, dto?.amount);
}

// /events/events.service.ts:112-138
async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
  const entry = await this.prisma.entry.findUnique({
    where: { id: entryId },
    include: { event: true },
  });

  // ... validation code ...

  // Use provided amount OR event fee (no validation of amount itself!)
  const paidAmount = amount ?? entry.event.entryFeeCents ?? 0;  // ← Can be ANY value

  return this.prisma.entry.update({
    where: { id: entryId },
    data: {
      paidAt: new Date(),
      paidAmount,  // ← No validation this matches event fee
      paidBy: confirmedBy,
    },
  });
}
```

**Attack Scenarios:**

1. **Zero Payment Bypass:**
```javascript
POST /events/entries/entry-123/mark-paid
Content-Type: application/json

{
  "amount": 0  // Event requires $50 (5000 cents)
}
// Result: Entry marked paid for $0
```

2. **Event Fee Override:**
```javascript
POST /events/entries/entry-123/mark-paid
{
  "amount": 1  // Event fee is $50, staff marks as paid for $0.01
}
```

3. **Negative Amount (Combined with DTO issue):**
```javascript
POST /events/entries/entry-123/mark-paid
{
  "amount": -5000  // Creates credit instead of payment
}
```

**Check-in Vulnerability:**
The check-in function only checks if `paidAt` is set:

```typescript
// /events/events.service.ts:87-110
async checkIn(entryId: string) {
  const entry = await this.prisma.entry.findUnique({...});
  
  const requiresPayment = entry.event.entryFeeCents && entry.event.entryFeeCents > 0;
  if (requiresPayment && !entry.paidAt) {  // ← Only checks if paidAt EXISTS
    throw new Error('Player must pay entry fee before check-in');
  }
  // Does NOT verify paidAmount === entryFeeCents!
}
```

**Fix Required:**
```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number, orgId?: string) {
  const entry = await this.prisma.entry.findUnique({...});
  
  // Validate amount if provided
  if (amount !== undefined) {
    if (amount < 0) throw new BadRequestException('Amount must be positive');
    // Compare against event fee
    if (entry.event.entryFeeCents && amount !== entry.event.entryFeeCents) {
      throw new BadRequestException('Amount does not match event entry fee');
    }
  }
  
  const paidAmount = amount ?? entry.event.entryFeeCents ?? 0;
  // ...
}
```

---

#### 4. PRIZE DISTRIBUTION MANIPULATION - Arbitrary Amounts

**Severity:** CRITICAL  
**Type:** Business Logic / Financial  
**Affected Endpoint:** `POST /events/:id/distribute-prizes`  
**File:** `/events/events.controller.ts:72`, `/events/events.service.ts:140`

**Vulnerability:**

```typescript
// /events/events.controller.ts:72-81
@Post(':id/distribute-prizes')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async distributePrizes(
  @Param('id') eventId: string,
  @Body() dto: { distributions: Array<{ userId: string; amount: number; placement: number }> },
  @CurrentUser() user: any,
) {
  return this.eventsService.distributePrizes(eventId, dto.distributions, user.id);
}

// /events/events.service.ts:140-218
async distributePrizes(
  eventId: string,
  distributions: Array<{ userId: string; amount: number; placement: number }>,
  distributedBy: string,
) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });

  // Checks if prizes were already distributed, but NOT:
  // - If total amount exceeds event.totalPrizeCredits
  // - If amounts are reasonable/positive
  // - If users are actually in the event
  // - If placements are valid

  return this.prisma.$transaction(async (tx) => {
    const ledgerEntries = await Promise.all(
      distributions.map((dist) =>
        tx.creditLedgerEntry.create({
          data: {
            orgId: event.orgId,
            userId: dist.userId,      // ← No validation this user is in event
            amount: dist.amount,       // ← No validation amount is reasonable
            reasonCode: 'PRIZE',
            memo: `Tournament prize - ${event.name} (Placement: ${dist.placement})`,
            relatedEventId: eventId,
            createdBy: distributedBy,
          },
        }),
      ),
    );

    // Updates balances for ANY userId provided
    await Promise.all(
      distributions.map((dist) =>
        tx.creditBalance.upsert({
          where: {
            orgId_userId: {
              orgId: event.orgId,
              userId: dist.userId,
            },
          },
          create: {
            orgId: event.orgId,
            userId: dist.userId,
            balance: dist.amount,
            lastTransactionAt: new Date(),
          },
          update: {
            balance: {
              increment: dist.amount,  // ← No limit checking
            },
            lastTransactionAt: new Date(),
          },
        }),
      ),
    );
    // ...
  });
}
```

**Attack Scenarios:**

1. **Distribute More Than Allocated:**
```javascript
POST /events/event-123/distribute-prizes
{
  "distributions": [
    { "userId": "player1", "amount": 600000, "placement": 1 },
    { "userId": "player2", "amount": 600000, "placement": 2 }
  ]
}
// Event.totalPrizeCredits = 100000 (legitimate pool)
// Result: 1.2M distributed instead of 100K - massive fraud!
```

2. **Distribute to Non-Participants:**
```javascript
POST /events/event-123/distribute-prizes
{
  "distributions": [
    { "userId": "attacker-friend", "amount": 1000000, "placement": 1 }
  ]
}
// Result: Give prizes to anyone, not just tournament participants
```

3. **Negative Prize Amounts (With DTO issue):**
```javascript
POST /events/event-123/distribute-prizes
{
  "distributions": [
    { "userId": "victim", "amount": -5000, "placement": 1 }
  ]
}
// Result: Deduct credits from player's account
```

4. **Invalid Placement Numbers:**
```javascript
POST /events/event-123/distribute-prizes
{
  "distributions": [
    { "userId": "player1", "amount": 5000, "placement": 9999 }
  ]
}
// No validation placement matches actual tournament results
```

**Missing Validations:**
- ✗ Total amount vs `event.totalPrizeCredits`
- ✗ User is actually entry in event
- ✗ Amount is positive/reasonable
- ✗ Placement matches actual tournament results
- ✗ No duplicate placements

**Fix Required:**
```typescript
async distributePrizes(
  eventId: string,
  distributions: Array<{ userId: string; amount: number; placement: number }>,
  distributedBy: string,
) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    include: { entries: { select: { userId: true } } }
  });

  if (event.prizesDistributed) {
    throw new BadRequestException('Prizes already distributed');
  }

  // VALIDATE: Total amount
  const totalAmount = distributions.reduce((sum, d) => sum + d.amount, 0);
  if (totalAmount > (event.totalPrizeCredits || 0)) {
    throw new BadRequestException(`Total prize amount (${totalAmount}) exceeds allocated pool (${event.totalPrizeCredits})`);
  }

  // VALIDATE: Each amount
  distributions.forEach(dist => {
    if (dist.amount <= 0) throw new BadRequestException('Prize amounts must be positive');
    if (dist.placement <= 0) throw new BadRequestException('Invalid placement');
  });

  // VALIDATE: Users are in event
  const eventUserIds = new Set(event.entries.map(e => e.userId));
  distributions.forEach(dist => {
    if (!eventUserIds.has(dist.userId)) {
      throw new BadRequestException(`User ${dist.userId} is not registered for this event`);
    }
  });

  // VALIDATE: Unique placements and sequence
  const placements = distributions.map(d => d.placement);
  if (new Set(placements).size !== placements.length) {
    throw new BadRequestException('Duplicate placements');
  }

  // Proceed with transaction...
}
```

---

#### 5. RACE CONDITION IN PAYMENT MARKING

**Severity:** CRITICAL  
**Type:** Concurrency / Race Condition  
**Affected Endpoint:** `POST /events/entries/:entryId/mark-paid`  
**File:** `/events/events.service.ts:112-138`

**Vulnerability:**

```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
  const entry = await this.prisma.entry.findUnique({
    where: { id: entryId },
    include: { event: true },
  });

  if (!entry) {
    throw new Error('Entry not found');
  }

  if (entry.paidAt) {  // ← RACE CONDITION HERE
    throw new Error('Entry has already been marked as paid');
  }
  // Between here and next line, another request could update paidAt

  // No transaction used - check and update are separate operations
  return this.prisma.entry.update({
    where: { id: entryId },
    data: {
      paidAt: new Date(),
      paidAmount,
      paidBy: confirmedBy,
    },
  });
}
```

**Race Condition Scenario:**

```
Timeline:
T1: Request A - SELECT entry WHERE id=X (paidAt = null)
T2: Request B - SELECT entry WHERE id=X (paidAt = null)
T3: Request A - Check: entry.paidAt is null ✓
T4: Request B - Check: entry.paidAt is null ✓
T5: Request A - UPDATE entry SET paidAt=NOW (succeeds)
T6: Request B - UPDATE entry SET paidAt=NOW (succeeds - SHOULD FAIL!)

Result: Entry marked paid twice
- Payment audited twice
- Credits potentially applied twice
```

**Fix Required - Use Database Transaction:**
```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
  const entry = await this.prisma.$transaction(async (tx) => {
    const entry = await tx.entry.findUnique({
      where: { id: entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    if (entry.paidAt) {
      throw new Error('Entry has already been marked as paid');
    }

    // All within transaction - atomic operation
    return await tx.entry.update({
      where: { id: entryId },
      data: {
        paidAt: new Date(),
        paidAmount: amount ?? entry.event.entryFeeCents ?? 0,
        paidBy: confirmedBy,
      },
    });
  });

  return entry;
}
```

Or better yet - use database constraint:
```prisma
// In schema.prisma, add unique constraint
model Entry {
  id          String    @id @default(cuid())
  eventId     String
  userId      String
  paidAt      DateTime?
  // Add constraint ensuring paidAt can only be set once
  @@unique([id, paidAt])  // Can only update paidAt once
}
```

---

### HIGH SEVERITY

#### 6. Missing Entry Ownership Validation

**Severity:** HIGH  
**Type:** Access Control / IDOR  
**Affected Endpoints:**

| Endpoint | File | Issue |
|----------|------|-------|
| `POST /events/entries/:entryId/check-in` | `/events/events.controller.ts:47` | No entry ownership check |
| `POST /events/entries/:entryId/mark-paid` | `/events/events.controller.ts:54` | No entry ownership check |
| `POST /events/entries/:entryId/drop` | `/events/events.controller.ts:83` | No entry ownership check |

**Details:**
Staff members can perform operations on ANY entry by ID without verifying:
- The entry belongs to an event in their organization
- They have permission to modify that specific entry

```typescript
// /events/events.controller.ts:47-51
@Post('entries/:entryId/check-in')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async checkIn(@Param('entryId') entryId: string) {
  return this.eventsService.checkIn(entryId);  // ← No orgId or entry validation
}

// /events/events.service.ts:87-110
async checkIn(entryId: string) {
  const entry = await this.prisma.entry.findUnique({
    where: { id: entryId },  // ← Only by ID, no org filtering
    include: { event: true },
  });
  // ... process ...
}
```

**Fix:** Add orgId parameter and validate entry belongs to user's org:
```typescript
async checkIn(entryId: string, orgId: string) {
  const entry = await this.prisma.entry.findFirst({
    where: {
      id: entryId,
      event: { orgId }  // ← Verify entry belongs to user's org
    },
    include: { event: true },
  });
  if (!entry) throw new ForbiddenException('Entry not found');
  // ...
}
```

---

#### 7. Missing Event Ownership in Rounds Operations

**Severity:** HIGH  
**Type:** Access Control / Authorization  
**Affected Endpoints:**

| Endpoint | File | Issue |
|----------|------|-------|
| `POST /rounds/events/:eventId/next` | `/rounds/rounds.controller.ts:12` | No event ownership verification |

**Details:**

```typescript
// /rounds/rounds.controller.ts:12-17
@Post('events/:eventId/next')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async createNextRound(@Param('eventId') eventId: string) {
  return this.roundsService.createNextRound(eventId);  // ← No orgId check
}

// /rounds/rounds.service.ts:17-94
async createNextRound(eventId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },  // ← No orgId filter
    include: { ... }
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Staff from different org could create rounds for other org's events!
}
```

---

#### 8. Missing Match Ownership in Report/Override Operations

**Severity:** HIGH  
**Type:** Access Control / Authorization  
**Affected Endpoints:**

| Endpoint | File | Issue |
|----------|------|-------|
| `POST /matches/report` | `/matches/matches.controller.ts:13` | No event org verification |
| `POST /matches/:id/override` | `/matches/matches.controller.ts:25` | No event org verification |

**Details:**
Staff can report/override results for matches in events from different organizations.

---

#### 9. Unvalidated Search Parameter

**Severity:** HIGH  
**Type:** Input Validation  
**Affected Endpoint:** `GET /orgs/users`  
**File:** `/orgs/orgs.controller.ts:17`, `/orgs/orgs.service.ts:14`

**Details:**

```typescript
// /orgs/orgs.controller.ts:16-19
@Get('users')
async getUsers(@CurrentUser() user: any, @Query('search') search?: string) {
  return this.orgsService.getOrgUsers(user.orgId, search);  // ← No validation on search
}

// /orgs/orgs.service.ts:14-36
async getOrgUsers(orgId: string, search?: string) {
  return this.prisma.user.findMany({
    where: {
      memberships: {
        some: {
          orgId,
        },
      },
      ...(search && {  // ← Unvalidated search string used in query
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    // ...
  });
}
```

**Fix:**
```typescript
@Get('users')
async getUsers(
  @CurrentUser() user: any,
  @Query('search') search?: string
) {
  // Validate search parameter
  if (search && (typeof search !== 'string' || search.length > 50)) {
    throw new BadRequestException('Invalid search parameter');
  }
  return this.orgsService.getOrgUsers(user.orgId, search);
}
```

---

#### 10. Missing Validation in Decklist Operations

**Severity:** HIGH  
**Type:** Access Control / Input Validation  
**Affected Endpoints:**

| Endpoint | File | Issue |
|----------|------|-------|
| `POST /decklists/entry/:entryId/lock` | `/decklists/decklists.controller.ts:43` | No event org check |
| `POST /decklists/event/:eventId/lock-all` | `/decklists/decklists.controller.ts:50` | No event org check |

**Details:**
```typescript
// No validation that event belongs to staff member's organization
@Post('entry/:entryId/lock')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async lockDecklist(@Param('entryId') entryId: string) {
  return this.decklistsService.lockDecklist(entryId);  // ← No org check
}
```

---

#### 11. Check-In Bypass via Late Add

**Severity:** HIGH  
**Type:** Business Logic  
**Affected Endpoint:** `POST /events/:id/add-late-player`  
**File:** `/events/events.controller.ts:65`, `/events/events.service.ts:250`

**Vulnerability:**

```typescript
// /events/events.service.ts:250-279
async addLatePlayer(eventId: string, userId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  const existingEntry = await this.prisma.entry.findFirst({
    where: {
      eventId,
      userId,
    },
  });

  if (existingEntry) {
    throw new Error('Player already registered');
  }

  // VULNERABILITY: Auto-checks in late adds!
  return this.prisma.entry.create({
    data: {
      eventId,
      userId,
      checkedInAt: new Date(),  // ← Bypasses normal check-in workflow
    },
  });
}
```

**Attack Scenario:**
1. Event requires payment before check-in
2. Staff calls `POST /events/{id}/add-late-player` with userId
3. Player is auto-checked-in without payment
4. Player can compete without paying entry fee

---

### MEDIUM SEVERITY

#### 12. Missing DTO Validation in Multiple Endpoints

**Severity:** MEDIUM  
**Type:** Input Validation  
**Affected Endpoints:**

- `POST /events/entries/:entryId/mark-paid` - Body has optional `amount` with no type validation
- `POST /events/:id/distribute-prizes` - Distributions array with no shape validation
- `POST /events/entries/:entryId/drop` - Body with optional `currentRound` with no validation
- `POST /matches/:id/override` - DTO passed as plain object

**Details:**
Even though ValidationPipe is configured, these endpoints pass unvalidated objects:

```typescript
// /events/events.controller.ts:54-63 - Untyped body
async markAsPaid(
  @Param('entryId') entryId: string,
  @CurrentUser() user: any,
  @Body() dto?: { amount?: number }  // ← No class DTO = no validation
) {
  return this.eventsService.markAsPaid(entryId, user.id, dto?.amount);
}

// /matches/matches.controller.ts:25-40 - Untyped body  
async overrideResult(
  @Param('id') matchId: string,
  @CurrentUser() user: any,
  @Body() dto: { result: any; gamesWonA: number; gamesWonB: number }  // ← Interface, no validation
) {
  return this.matchesService.overrideMatchResult(
    matchId,
    dto.result,
    dto.gamesWonA,
    dto.gamesWonB,
    user.id,
  );
}
```

---

#### 13. Sensitive Data Exposure in CSV Export

**Severity:** MEDIUM  
**Type:** Information Disclosure  
**Affected Endpoint:** `GET /standings/events/:eventId/export`  
**File:** `/standings/standings.controller.ts:18`

**Details:**

```typescript
// /standings/standings.controller.ts:18-49
@Get('events/:eventId/export')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async exportStandings(@Param('eventId') eventId: string, @Res() res: Response) {
  const standings = await this.standingsService.calculateCurrentStandings(eventId);
  // ← NO orgId VALIDATION - ANY staff from ANY org can export

  // ...

  for (const standing of standings) {
    const row = [
      standing.rank,
      `"${standing.userName}"`,  // ← Exports player names (PII)
      standing.points,
      `"${standing.matchWins}-${standing.matchLosses}-${standing.matchDraws}"`,
      // ...
    ];
    csvRows.push(row.join(','));
  }
}
```

**Issues:**
- ✗ No verification event belongs to user's org (can export any event)
- ✗ Exports player names (Personally Identifiable Information)
- ✗ No rate limiting on CSV export
- ✗ Large CSV files not paginated/streamed

---

#### 14. Weak Input Validation in Match Result Reporting

**Severity:** MEDIUM  
**Type:** Input Validation  
**Affected Endpoint:** `POST /matches/report`  
**File:** `/matches/matches.controller.ts:13`, `/matches/matches.service.ts:20`

**Details:**

```typescript
// /matches/matches.controller.ts:13-18
@Post('report')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async reportResult(@CurrentUser() user: any, @Body() dto: ReportMatchResultDto) {
  return this.matchesService.reportMatchResult(dto, user.id);
}

// /matches/matches.service.ts:20-62
async reportMatchResult(dto: ReportMatchResultDto, reportedBy: string) {
  const { matchId, result, gamesWonA, gamesWonB } = dto;

  // Gets match and updates - but no validation that:
  // - gamesWonA and gamesWonB are reasonable (not -999999 or 999999)
  // - result is a valid enum value (partially protected by Prisma, but not validated in DTO)
  // - the match actually exists before writing

  const updatedMatch = await this.prisma.match.update({
    where: { id: matchId },
    data: {
      result,
      gamesWonA,      // ← No min/max bounds check
      gamesWonB,      // ← No min/max bounds check
      reportedBy,
      reportedAt: new Date(),
    },
  });
}
```

---

## SUMMARY TABLE

| # | Vulnerability | Severity | Type | Affected Endpoints |
|---|---|---|---|---|
| 1 | IDOR - Missing org validation | CRITICAL | Access Control | `GET /events/:id`, `PATCH /events/:id`, `GET /rounds/:roundId/pairings`, `GET /matches/:id`, `GET /standings/events/:eventId` |
| 2 | No runtime input validation | CRITICAL | Input Validation | All endpoints using DTOs |
| 3 | Payment bypass | CRITICAL | Business Logic | `POST /events/entries/:entryId/mark-paid` |
| 4 | Prize manipulation | CRITICAL | Business Logic | `POST /events/:id/distribute-prizes` |
| 5 | Race condition in payments | CRITICAL | Concurrency | `POST /events/entries/:entryId/mark-paid` |
| 6 | Missing entry ownership validation | HIGH | Access Control | `POST /events/entries/:entryId/check-in`, `POST /events/entries/:entryId/mark-paid`, `POST /events/entries/:entryId/drop` |
| 7 | Missing event ownership in rounds | HIGH | Access Control | `POST /rounds/events/:eventId/next` |
| 8 | Missing match ownership | HIGH | Access Control | `POST /matches/report`, `POST /matches/:id/override` |
| 9 | Unvalidated search parameter | HIGH | Input Validation | `GET /orgs/users` |
| 10 | Missing validation in decklists | HIGH | Access Control | `POST /decklists/entry/:entryId/lock`, `POST /decklists/event/:eventId/lock-all` |
| 11 | Check-in bypass via late add | HIGH | Business Logic | `POST /events/:id/add-late-player` |
| 12 | Untyped/unvalidated DTOs | MEDIUM | Input Validation | `POST /events/entries/:entryId/mark-paid`, `POST /events/:id/distribute-prizes`, `POST /matches/:id/override` |
| 13 | Sensitive data in CSV export | MEDIUM | Information Disclosure | `GET /standings/events/:eventId/export` |
| 14 | Weak match result validation | MEDIUM | Input Validation | `POST /matches/report` |

---

## RECOMMENDATIONS

### Immediate Actions (Critical Priority)

1. **Implement Class-Based DTOs** with validation decorators for all endpoints
2. **Add orgId validation** to all service methods
3. **Fix payment marking** to validate amount matches event fee
4. **Add constraints to prize distribution** (total amount, user membership)
5. **Fix race conditions** using database transactions

### Short-term Actions (1-2 weeks)

1. Add entry/event ownership checks to all endpoints
2. Implement proper error handling for security failures
3. Add comprehensive audit logging for sensitive operations
4. Implement request rate limiting per endpoint
5. Add input validation for search parameters

### Long-term Actions (Architecture)

1. Consider authentication context provider to automatically validate orgId
2. Implement resource-level authorization decorators
3. Add integration tests for access control scenarios
4. Implement request signing for critical operations
5. Regular security audits and penetration testing

