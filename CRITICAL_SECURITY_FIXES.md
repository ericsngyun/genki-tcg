# 🚨 CRITICAL SECURITY FIXES REQUIRED

## ⚠️ DO NOT DEPLOY TO PRODUCTION UNTIL THESE ARE FIXED

**Risk Level**: **CRITICAL - Multiple authentication bypass vulnerabilities**
**Status**: ❌ **NOT PRODUCTION READY**

---

## 🔴 P0 - CRITICAL (Fix Immediately - 24-48 hours)

### 1. **Hardcoded JWT Secret Fallback** ⚠️ AUTHENTICATION BYPASS
**Severity**: CRITICAL
**File**: `apps/backend/src/auth/auth.module.ts:17`
**CVE**: CWE-798 (Use of Hard-coded Credentials)

**Vulnerable Code**:
```typescript
secret: config.get('JWT_SECRET') || 'dev-secret-change-me',
```

**Problem**: Anyone can forge valid JWT tokens if `JWT_SECRET` env var is missing. This allows complete authentication bypass.

**Attack Scenario**:
```javascript
// Attacker code
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'any-user-id', email: 'admin@example.com', orgId: 'any-org', role: 'OWNER' },
  'dev-secret-change-me'
);
// Now attacker has OWNER access to everything
```

**Fix**:
```typescript
// apps/backend/src/auth/auth.module.ts
useFactory: (config: ConfigService) => {
  const secret = config.get('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return {
    secret,
    signOptions: {
      expiresIn: config.get('JWT_EXPIRES_IN') || '7d',
    },
  };
},
```

**Action**:
1. Apply fix immediately
2. Generate strong JWT secret: `openssl rand -base64 64`
3. Add to `.env` file
4. Never commit `.env` to git

---

### 2. **JWT Token Exposed in URL** ⚠️ TOKEN LEAKAGE
**Severity**: CRITICAL
**File**: `apps/admin-web/src/lib/api.ts:179`

**Vulnerable Code**:
```typescript
window.open(`${API_URL}/standings/events/${eventId}/export?token=${token}`, '_blank');
```

**Problem**:
- Token logged in server access logs
- Token saved in browser history
- Token leaked via Referer header
- Violates OWASP security guidelines

**Fix**:
```typescript
async exportStandings(eventId: string) {
  // Use POST request with token in header instead
  const response = await this.client.get(`/standings/events/${eventId}/export`, {
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `standings-${eventId}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

---

### 3. **Password Hashes Exposed** ⚠️ DATA EXPOSURE
**Severity**: HIGH
**Files**:
- `apps/backend/src/events/events.service.ts:66`
- `apps/backend/src/rounds/rounds.service.ts:28`
- `apps/backend/src/standings/standings.service.ts:13`

**Problem**: API returns full User objects with `passwordHash` field.

**Example**:
```json
{
  "entries": [{
    "user": {
      "id": "user123",
      "email": "player@test.com",
      "passwordHash": "$2b$10$abcdef..." // ⚠️ EXPOSED!
    }
  }]
}
```

**Fix**: Use Prisma `select` instead of `include: { user: true }`

```typescript
// Before (INSECURE):
include: {
  entries: {
    include: {
      user: true, // ❌ Returns ALL fields including passwordHash
    },
  },
}

// After (SECURE):
include: {
  entries: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
}
```

**Files to Fix**:
1. `apps/backend/src/events/events.service.ts` - `getEvent()`, `getEvents()`
2. `apps/backend/src/rounds/rounds.service.ts` - `createNextRound()`
3. `apps/backend/src/rounds/rounds.service.ts` - `getPairings()`
4. `apps/backend/src/standings/standings.service.ts` - `calculateCurrentStandings()`
5. `apps/backend/src/decklists/decklists.service.ts` - `getDecklistsForEvent()`

---

### 4. **Missing Organization Validation** ⚠️ IDOR VULNERABILITY
**Severity**: CRITICAL
**Files**: All service layer methods
**CVE**: CWE-639 (Authorization Bypass)

**Problem**: Users can access/modify events, matches, standings from OTHER organizations.

**Attack Scenario**:
```bash
# User from Org A can access Org B's event
GET /events/org-b-event-id
Authorization: Bearer <org-a-user-token>
# Returns Org B's private event data ❌
```

**Example Vulnerable Code**:
```typescript
// apps/backend/src/events/events.service.ts
async getEvent(eventId: string) {
  return this.prisma.event.findUnique({
    where: { id: eventId },
    // ❌ NO ORG VALIDATION - returns any event!
  });
}
```

**Fix Pattern**:
```typescript
async getEvent(eventId: string, userOrgId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  if (event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied');
  }

  return event;
}
```

**Files Requiring Fix** (17 endpoints):
- ✅ `events.service.ts` - `getEvents()` already filters by orgId
- ❌ `events.service.ts` - `getEvent()`, `registerForEvent()`, `checkIn()`, `markAsPaid()`, etc.
- ❌ `rounds.service.ts` - `getPairings()`, `createNextRound()`
- ❌ `matches.service.ts` - `reportResult()`, `overrideResult()`
- ❌ `standings.service.ts` - `calculateCurrentStandings()`, `exportStandings()`
- ❌ `decklists.service.ts` - All methods

**Update Controllers to Pass orgId**:
```typescript
// apps/backend/src/events/events.controller.ts
@Get(':id')
async getEvent(@Param('id') id: string, @CurrentUser() user: any) {
  return this.eventsService.getEvent(id, user.orgId); // Add user.orgId
}
```

---

## 🟠 P1 - HIGH (Fix within 1 week)

### 5. **No Input Validation** ⚠️ INJECTION & BYPASS
**Severity**: HIGH
**All DTOs are TypeScript interfaces, not classes**

**Problem**: ValidationPipe configured but completely ineffective.

**Current State** (apps/backend/src/events/events.service.ts):
```typescript
export interface CreateEventDto {
  name: string;
  game: string;
  // ...
}
```

**Issue**: TypeScript interfaces compile away - no runtime validation!

**Fix**: Convert to classes with validators:
```typescript
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  game: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  entryFeeCents?: number;
}
```

**Files to Convert**:
1. `CreateEventDto`, `UpdateEventDto`
2. `SubmitDecklistDto`
3. `CreditAdjustDto`
4. `ReportResultDto`
5. All other DTOs (currently 7 DTOs)

---

### 6. **Payment Bypass** ⚠️ FINANCIAL VULNERABILITY
**Severity**: HIGH
**File**: `apps/backend/src/events/events.service.ts:119`

**Problem**: Staff can mark $0 payment for $50 entry fee.

```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
  const paidAmount = amount ?? entry.event.entryFeeCents ?? 0;
  // ⚠️ Staff can pass amount=0 for a $50 event!
}
```

**Fix**:
```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
  const entry = await this.prisma.entry.findUnique({
    where: { id: entryId },
    include: { event: true },
  });

  const requiredAmount = entry.event.entryFeeCents;
  const paidAmount = amount ?? requiredAmount ?? 0;

  // Validate payment amount
  if (requiredAmount && paidAmount < requiredAmount) {
    throw new BadRequestException(
      `Payment amount ($${paidAmount/100}) is less than entry fee ($${requiredAmount/100})`
    );
  }

  // Continue with update...
}
```

---

### 7. **Prize Distribution No Validation** ⚠️ FINANCIAL VULNERABILITY
**Severity**: HIGH
**File**: `apps/backend/src/events/events.service.ts:140`

**Problems**:
1. Can distribute unlimited amounts (no cap)
2. Can distribute to non-participants
3. No validation of total vs allocated

**Fix**:
```typescript
async distributePrizes(
  eventId: string,
  distributions: Array<{ userId: string; amount: number; placement: number }>,
  distributedBy: string,
) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    include: { entries: true },
  });

  // Validation 1: Check total doesn't exceed pool
  const totalDistributed = distributions.reduce((sum, d) => sum + d.amount, 0);
  if (totalDistributed > event.totalPrizeCredits) {
    throw new BadRequestException(
      `Total distribution (${totalDistributed}) exceeds prize pool (${event.totalPrizeCredits})`
    );
  }

  // Validation 2: Check all recipients are participants
  const entryUserIds = new Set(event.entries.map(e => e.userId));
  const invalidRecipients = distributions.filter(d => !entryUserIds.has(d.userId));
  if (invalidRecipients.length > 0) {
    throw new BadRequestException('Can only distribute to event participants');
  }

  // Validation 3: Check amounts are positive
  if (distributions.some(d => d.amount <= 0)) {
    throw new BadRequestException('Prize amounts must be positive');
  }

  // Continue with transaction...
}
```

---

### 8. **Race Condition in Payment Marking** ⚠️ DATA INTEGRITY
**Severity**: MEDIUM
**File**: `apps/backend/src/events/events.service.ts:112`

**Problem**: Same entry can be marked paid multiple times concurrently.

```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
  if (entry.paidAt) {
    throw new Error('Entry has already been marked as paid');
  }
  // ⚠️ Another request could check paidAt=null here too!

  return this.prisma.entry.update({ /* ... */ });
}
```

**Fix**: Use atomic operation:
```typescript
async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
  try {
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
  } catch (error) {
    throw new BadRequestException('Failed to mark as paid');
  }
}
```

---

## 🟡 P2 - MEDIUM (Fix within 2 weeks)

### 9. **Missing Password Requirements**
**File**: `apps/backend/src/auth/auth.service.ts:60`

**Current**: No minimum length, complexity, or validation

**Fix**:
```typescript
async signup(dto: SignupDto) {
  // Validate password
  if (password.length < 8) {
    throw new BadRequestException('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    throw new BadRequestException('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new BadRequestException('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new BadRequestException('Password must contain number');
  }

  // Continue...
}
```

---

### 10. **No Rate Limiting**
**All endpoints vulnerable to brute force/DoS**

**Fix**: Install and configure rate limiting:
```bash
npm install @nestjs/throttler
```

```typescript
// apps/backend/src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 100, // 100 requests per minute
    }]),
    // ...
  ],
})
```

---

### 11. **Missing CORS Configuration**
**File**: `apps/backend/src/main.ts`

**Current**: No CORS configured - allows all origins

**Fix**:
```typescript
// apps/backend/src/main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

### 12. **No Request Size Limits**
**Vulnerable to DoS via large payloads**

**Fix**:
```typescript
// apps/backend/src/main.ts
import * as bodyParser from 'body-parser';

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
```

---

## 📋 SUMMARY

| Priority | Issues | Est. Hours | Must Fix By |
|----------|--------|------------|-------------|
| P0 Critical | 4 | 8-12 hours | 24-48 hours |
| P1 High | 4 | 12-16 hours | 1 week |
| P2 Medium | 4 | 8-10 hours | 2 weeks |
| **TOTAL** | **12** | **28-38 hours** | **2-3 weeks** |

---

## 🔧 IMMEDIATE ACTION PLAN

### Phase 1: Emergency Fixes (Next 48 hours)
1. ✅ Fix hardcoded JWT secret (30 min)
2. ✅ Add organization validation to all endpoints (4-6 hours)
3. ✅ Fix password hash exposure (2 hours)
4. ✅ Fix token in URL (1 hour)

### Phase 2: High Priority (Next Week)
5. ✅ Convert DTOs to classes with validation (6-8 hours)
6. ✅ Add payment validation (2 hours)
7. ✅ Add prize distribution validation (2 hours)
8. ✅ Fix race conditions (2 hours)

### Phase 3: Hardening (Week 2-3)
9. ✅ Add password requirements (1 hour)
10. ✅ Configure rate limiting (2 hours)
11. ✅ Configure CORS properly (1 hour)
12. ✅ Add request size limits (1 hour)

---

## 🧪 TESTING CHECKLIST

After fixes, verify:

- [ ] Cannot forge JWT tokens with default secret
- [ ] Cannot access other org's events/data
- [ ] Password hashes never in API responses
- [ ] Tokens never in URLs
- [ ] Invalid input properly rejected
- [ ] Cannot bypass payment
- [ ] Cannot over-distribute prizes
- [ ] No race conditions in payments
- [ ] Strong passwords enforced
- [ ] Rate limiting works
- [ ] CORS configured correctly

---

## 📚 ADDITIONAL RECOMMENDATIONS

1. **Audit Logging**: Log all sensitive operations (payments, prize distribution, admin actions)
2. **Database Backups**: Automated daily backups with point-in-time recovery
3. **Monitoring**: Set up Sentry for error tracking
4. **Security Headers**: Add helmet.js for security headers
5. **SQL Injection Testing**: Even with Prisma, test edge cases
6. **Dependency Scanning**: Run `npm audit` regularly
7. **Penetration Testing**: Professional pentest before production launch

---

## 🆘 SUPPORT

For questions about fixes:
- Review full audit reports in repository root
- Check SECURITY_REMEDIATION_GUIDE.md for code examples
- Test each fix thoroughly before deploying

**Status**: ⚠️ **CRITICAL - DO NOT DEPLOY UNTIL P0 FIXES COMPLETE**
