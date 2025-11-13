# Complete Security Implementation Guide

## Progress Status

### ✅ Completed (3/12 Critical Fixes)
1. ✅ Fixed hardcoded JWT secret fallback
2. ✅ Fixed JWT token in URL
3. ✅ Fixed password hash exposure

### 🔄 In Progress (1/12)
4. 🔄 Organization validation (started - 1 of 17 endpoints fixed)

### ⏳ Remaining (8/12)
5. ⏳ Convert DTOs to classes with validation
6. ⏳ Add payment validation
7. ⏳ Add prize distribution validation
8. ⏳ Fix race conditions
9. ⏳ Add password requirements
10. ⏳ Configure rate limiting
11. ⏳ Configure CORS
12. ⏳ Add request size limits

---

## 4. Organization Validation (CRITICAL - Highest Priority)

**Status**: 1 of 17 endpoints fixed
**Time Required**: 3-4 hours
**Priority**: P0 CRITICAL

### Pattern to Apply

```typescript
// Service Method Pattern
async methodName(resourceId: string, userOrgId: string) {
  const resource = await this.prisma.resource.findUnique({
    where: { id: resourceId },
    include: { event: true }, // if checking via event
  });

  if (!resource) {
    throw new NotFoundException('Resource not found');
  }

  // Validate organization access
  if (resource.orgId !== userOrgId) {  // or resource.event.orgId
    throw new ForbiddenException('Access denied');
  }

  // Continue with logic...
}
```

### Files to Fix

#### A. `/home/user/genki-tcg/apps/backend/src/events/events.service.ts`

**Methods needing orgId validation:**

1. ✅ **getEvent** - DONE
2. **registerForEvent** (line 96)
```typescript
async registerForEvent(eventId: string, userId: string, userOrgId: string) {
  // Validate event belongs to user's org
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  if (event.orgId !== userOrgId) {
    throw new ForbiddenException('Cannot register for events in other organizations');
  }

  return this.prisma.entry.create({
    data: {
      eventId,
      userId,
    },
  });
}
```

3. **selfCheckIn** (find in file)
```typescript
async selfCheckIn(eventId: string, userId: string, userOrgId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied');
  }

  const entry = await this.prisma.entry.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
    include: { event: true },
  });

  if (!entry) {
    throw new NotFoundException('Entry not found');
  }

  // Continue with check-in logic...
}
```

4. **checkIn** (line 94)
5. **markAsPaid** (line 119)
6. **addLatePlayer**
7. **distributePrizes** (line 147)
8. **dropPlayer**
9. **getMyMatches**
10. **updateEvent**

#### B. `/home/user/genki-tcg/apps/backend/src/rounds/rounds.service.ts`

1. **createNextRound** (line 17)
```typescript
async createNextRound(eventId: string, userOrgId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    include: { /* ... */ },
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  if (event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied');
  }

  // Continue with pairing logic...
}
```

2. **getPairings** (line 101)
```typescript
async getPairings(roundId: string, userOrgId: string) {
  const round = await this.prisma.round.findUnique({
    where: { id: roundId },
    include: { event: true },
  });

  if (!round) {
    throw new NotFoundException('Round not found');
  }

  if (round.event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied');
  }

  return this.prisma.match.findMany({
    where: { roundId },
    include: { /* ... */ },
  });
}
```

#### C. `/home/user/genki-tcg/apps/backend/src/matches/matches.service.ts`

1. **reportMatchResult** (line 20)
2. **getMatch** (line 64)
3. **overrideMatchResult** (line 75)

Pattern: Add orgId validation by loading match → round → event → validate orgId

#### D. `/home/user/genki-tcg/apps/backend/src/standings/standings.service.ts`

1. **calculateCurrentStandings** (line 9)
2. **exportStandings** (in standings.controller.ts)

#### E. `/home/user/genki-tcg/apps/backend/src/decklists/decklists.service.ts`

1. **submitDecklist**
2. **getMyDecklist**
3. **getDecklistsForEvent**
4. **lockDecklist**
5. **lockAllDecklists**

### Update Controllers

After fixing service methods, update **all controllers** to pass `user.orgId`:

#### `/home/user/genki-tcg/apps/backend/src/events/events.controller.ts`

```typescript
@Get(':id')
async getEvent(@Param('id') id: string, @CurrentUser() user: any) {
  return this.eventsService.getEvent(id, user.orgId); // Add user.orgId
}

@Post(':id/register')
async register(@CurrentUser() user: any, @Param('id') eventId: string) {
  return this.eventsService.registerForEvent(eventId, user.id, user.orgId); // Add user.orgId
}

// Apply to ALL endpoints...
```

Apply same pattern to:
- `rounds.controller.ts`
- `matches.controller.ts`
- `standings.controller.ts`
- `decklists.controller.ts`

---

## 5. Convert DTOs to Classes with Validation (HIGH Priority)

**Time Required**: 6-8 hours
**Priority**: P1 HIGH

### Current Problem

DTOs are TypeScript interfaces (compile-time only):
```typescript
export interface CreateEventDto {  // ❌ No runtime validation
  name: string;
  game: GameType;
}
```

### Solution: Use class-validator

```typescript
import { IsString, IsInt, IsOptional, IsEnum, Min, Max, Length, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {  // ✅ Runtime validation
  @IsString()
  @Length(3, 100)
  name: string;

  @IsEnum(GameType)
  game: GameType;

  @IsEnum(EventFormat)
  format: EventFormat;

  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(1000)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000) // $1000 max
  entryFeeCents?: number;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;
}
```

### DTOs to Convert

1. **CreateEventDto** - `events.service.ts`
2. **UpdateEventDto** - `events.service.ts`
3. **ReportMatchResultDto** - `matches.service.ts`
4. **SubmitDecklistDto** - `decklists.service.ts`
5. **CreditAdjustDto** - `credits.service.ts`

### Enable Global Validation

```typescript
// apps/backend/src/main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestModule.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,  // Strip unknown properties
    forbidNonWhitelisted: true,  // Throw error on unknown properties
    transform: true,  // Auto-transform payloads to DTO types
  }));

  await app.listen(3001);
}
```

---

## 6. Add Payment Validation (HIGH Priority)

**Time Required**: 2 hours
**Priority**: P1 HIGH

### Fix: markAsPaid Validation

```typescript
// apps/backend/src/events/events.service.ts
async markAsPaid(entryId: string, confirmedBy: string, userOrgId: string, amount?: number) {
  const entry = await this.prisma.entry.findUnique({
    where: { id: entryId },
    include: { event: true },
  });

  if (!entry) {
    throw new NotFoundException('Entry not found');
  }

  // Validate organization
  if (entry.event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied');
  }

  if (entry.paidAt) {
    throw new BadRequestException('Entry has already been marked as paid');
  }

  const requiredAmount = entry.event.entryFeeCents;
  const paidAmount = amount ?? requiredAmount ?? 0;

  // ✅ NEW: Validate payment amount
  if (requiredAmount && paidAmount < requiredAmount) {
    throw new BadRequestException(
      `Payment amount ($${(paidAmount/100).toFixed(2)}) is less than required entry fee ($${(requiredAmount/100).toFixed(2)})`
    );
  }

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

---

## 7. Add Prize Distribution Validation (HIGH Priority)

**Time Required**: 2 hours
**Priority**: P1 HIGH

```typescript
// apps/backend/src/events/events.service.ts
async distributePrizes(
  eventId: string,
  distributions: Array<{ userId: string; amount: number; placement: number }>,
  distributedBy: string,
  userOrgId: string,
) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    include: { entries: true },
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  // Validate organization
  if (event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied');
  }

  // ✅ NEW: Validate total doesn't exceed pool
  const totalDistributed = distributions.reduce((sum, d) => sum + d.amount, 0);
  if (totalDistributed > event.totalPrizeCredits) {
    throw new BadRequestException(
      `Total distribution (${totalDistributed}) exceeds prize pool (${event.totalPrizeCredits})`
    );
  }

  // ✅ NEW: Validate all recipients are participants
  const entryUserIds = new Set(event.entries.map(e => e.userId));
  const invalidRecipients = distributions.filter(d => !entryUserIds.has(d.userId));
  if (invalidRecipients.length > 0) {
    throw new BadRequestException('Can only distribute prizes to event participants');
  }

  // ✅ NEW: Validate amounts are positive
  if (distributions.some(d => d.amount <= 0)) {
    throw new BadRequestException('Prize amounts must be positive');
  }

  // Continue with transaction...
}
```

---

## 8. Fix Race Conditions in Payments (MEDIUM Priority)

**Time Required**: 2 hours
**Priority**: P1 HIGH

```typescript
// apps/backend/src/events/events.service.ts
async markAsPaid(entryId: string, confirmedBy: string, userOrgId: string, amount?: number) {
  const entry = await this.prisma.entry.findUnique({
    where: { id: entryId },
    include: { event: true },
  });

  if (!entry) {
    throw new NotFoundException('Entry not found');
  }

  if (entry.event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied');
  }

  const requiredAmount = entry.event.entryFeeCents;
  const paidAmount = amount ?? requiredAmount ?? 0;

  // Validate payment amount
  if (requiredAmount && paidAmount < requiredAmount) {
    throw new BadRequestException(
      `Payment amount is less than required entry fee`
    );
  }

  // ✅ FIX: Use atomic updateMany to prevent race condition
  const updated = await this.prisma.entry.updateMany({
    where: {
      id: entryId,
      paidAt: null, // Only update if not already paid
    },
    data: {
      paidAt: new Date(),
      paidAmount,
      paidBy: confirmedBy,
    },
  });

  if (updated.count === 0) {
    throw new BadRequestException('Entry already paid or not found');
  }

  return this.prisma.entry.findUnique({ where: { id: entryId } });
}
```

---

## 9. Add Password Requirements (MEDIUM Priority)

**Time Required**: 1 hour
**Priority**: P2 MEDIUM

```typescript
// apps/backend/src/auth/auth.service.ts
async signup(dto: SignupDto) {
  const { email, password, name, inviteCode } = dto;

  // ✅ NEW: Validate password requirements
  if (password.length < 8) {
    throw new BadRequestException('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestException('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new BadRequestException('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new BadRequestException('Password must contain at least one number');
  }

  // Continue with existing logic...
}
```

---

## 10. Configure Rate Limiting (MEDIUM Priority)

**Time Required**: 2 hours
**Priority**: P2 MEDIUM

### Install Dependency

```bash
cd apps/backend
npm install @nestjs/throttler
```

### Configure Module

```typescript
// apps/backend/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute
      },
    ]),
    // ... other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... other providers
  ],
})
export class AppModule {}
```

### Customize Per-Route

```typescript
// For more sensitive endpoints like auth
import { Throttle } from '@nestjs/throttler';

@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

---

## 11. Configure CORS (MEDIUM Priority)

**Time Required**: 1 hour
**Priority**: P2 MEDIUM

```typescript
// apps/backend/src/main.ts
async function bootstrap() {
  const app = await NestModule.create(AppModule);

  // ✅ Configure CORS properly
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',  // Admin web
      'http://localhost:8081',  // Mobile (Expo)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'], // For file downloads
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  await app.listen(3001);
}
```

### Add to .env

```bash
# .env
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8081,https://your-production-domain.com"
```

---

## 12. Add Request Size Limits (MEDIUM Priority)

**Time Required**: 1 hour
**Priority**: P2 MEDIUM

```typescript
// apps/backend/src/main.ts
import * as bodyParser from 'body-parser';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestModule.create(AppModule);

  // ✅ Request size limits
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // ✅ Security headers
  app.use(helmet());

  await app.listen(3001);
}
```

---

## Testing Checklist

After implementing all fixes:

### Manual Testing
- [ ] Cannot forge JWT tokens with default secret
- [ ] Cannot access other org's events/data (returns 403)
- [ ] Password hashes never in API responses
- [ ] Tokens never in URLs
- [ ] Invalid input rejected with proper errors
- [ ] Cannot bypass payment validation
- [ ] Cannot over-distribute prizes
- [ ] No race conditions in concurrent payment marking
- [ ] Weak passwords rejected
- [ ] Rate limiting works (test with rapid requests)
- [ ] CORS configured (test from different origins)

### Automated Testing
See `TESTING_GUIDE.md` for unit and integration test examples.

---

## Estimated Total Time

| Task | Hours | Priority |
|------|-------|----------|
| Organization validation (remaining) | 3-4 | P0 |
| Convert DTOs to classes | 6-8 | P1 |
| Payment validation | 2 | P1 |
| Prize validation | 2 | P1 |
| Fix race conditions | 2 | P1 |
| Password requirements | 1 | P2 |
| Rate limiting | 2 | P2 |
| CORS configuration | 1 | P2 |
| Request size limits | 1 | P2 |
| **Total** | **20-25 hours** | |

---

## Next Steps

1. **Complete organization validation** (3-4 hours) - CRITICAL
2. **Convert DTOs** (6-8 hours) - HIGH
3. **Add payment/prize validation** (4 hours) - HIGH
4. **Fix race conditions** (2 hours) - HIGH
5. **Security hardening** (5 hours) - MEDIUM

**After P0+P1 fixes complete**: Platform will be production-ready ✅
