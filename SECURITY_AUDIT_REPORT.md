# Security Audit Report: Genki TCG Backend Authentication System

**Date:** 2025-11-13  
**Scope:** Backend authentication, authorization, and input validation  
**Severity Summary:** 6 Critical, 8 High, 6 Medium, 4 Low

---

## Executive Summary

The backend authentication system has several **critical security vulnerabilities** that require immediate attention. The most severe issues include cross-organization data access, missing input validation, and insufficient authorization checks at the service layer. JWT security and password handling are generally well-implemented using industry-standard libraries (bcrypt, @nestjs/jwt), but the surrounding architecture has significant gaps.

---

## 1. CRITICAL VULNERABILITIES

### 1.1 Cross-Organization Event Access (CWE-639: Authorization Bypass Through User-Controlled Key)
**Severity:** CRITICAL  
**File:** `/home/user/genki-tcg/apps/backend/src/events/events.service.ts:60-76`  
**Status:** PRESENT

**Issue:**
The `getEvent()` method does not validate that the requesting user belongs to the event's organization:

```typescript
async getEvent(eventId: string) {
  return this.prisma.event.findUnique({
    where: { id: eventId },
    include: {
      entries: { include: { user: true } },
      rounds: { orderBy: { roundNumber: 'asc' } },
    },
  });
}
```

**Attack Scenario:**
1. User A (from Organization X) can access any event by knowing its ID
2. User can view all registered players, their entry information, and tournament pairings
3. No organization-level access control at the service layer

**Impact:**
- Exposure of sensitive tournament data (player list, pairings, event details)
- Privacy violation for players across all organizations
- Potential competitive advantage leakage

**Remediation:**
Must add `orgId` parameter and validate:
```typescript
async getEvent(eventId: string, requesterOrgId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });
  if (!event || event.orgId !== requesterOrgId) {
    throw new ForbiddenException('Access denied');
  }
  // ... rest of method
}
```

---

### 1.2 Cross-Organization Match/Round Access (CWE-639)
**Severity:** CRITICAL  
**Files:** 
- `/home/user/genki-tcg/apps/backend/src/rounds/rounds.service.ts:96-107`
- `/home/user/genki-tcg/apps/backend/src/matches/matches.service.ts:64-73`

**Issue:**
The `getPairings()` and `getMatch()` methods don't verify event ownership:

```typescript
// rounds.service.ts
async getPairings(roundId: string) {
  return this.prisma.match.findMany({
    where: { roundId },
    include: { playerA: true, playerB: true },
    orderBy: { tableNumber: 'asc' },
  });
}

// matches.service.ts
async getMatch(matchId: string) {
  return this.prisma.match.findUnique({
    where: { id: matchId },
    include: { playerA: true, playerB: true, round: true },
  });
}
```

**Impact:**
- Users can access match results and pairings from other organizations
- Player information exposure across organization boundaries
- Standings manipulation information leakage

---

### 1.3 Missing Service-Layer Organization Validation (CWE-639)
**Severity:** CRITICAL  
**Files:** Multiple service files (events, rounds, matches, decklists)

**Issue:**
The controller layer passes `user.orgId` to service methods, but services don't verify the orgId matches the target resource:

```typescript
// events.controller.ts
async updateEvent(@Param('id') eventId: string, @Body() dto: UpdateEventDto) {
  return this.eventsService.updateEvent(eventId, dto);
  // ❌ No orgId validation - user.orgId not passed
}

// events.service.ts
async updateEvent(eventId: string, dto: UpdateEventDto) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    // ❌ No orgId filter
  });
  // ...
}
```

**Impact:**
- Privilege escalation through ID enumeration
- Staff from Organization A can modify events in Organization B
- Tournament integrity compromise

---

### 1.4 Untyped User Object & Missing Implicit Authorization (CWE-639)
**Severity:** CRITICAL  
**Files:** All controllers using `@CurrentUser() user: any`

**Examples:**
```typescript
// 24 instances across codebase
async getBalance(@CurrentUser() user: any) { ... }
async updateEvent(@CurrentUser() user: any, ...) { ... }
```

**Issue:**
1. `user: any` defeats TypeScript's type safety
2. `user` object structure is assumed but never validated
3. Service methods receive unvalidated orgId from JWT payload

**Attack Scenario:**
A malicious JWT token (or token tampering) could contain:
```json
{
  "sub": "user123",
  "email": "attacker@example.com",
  "orgId": "other-org-id",  // ← Attacker-controlled
  "role": "STAFF"           // ← Attacker-controlled
}
```

**Impact:**
- Potential for privilege escalation if JWT validation is bypassed
- No runtime validation of claims
- Maintenance nightmare with implicit contracts

---

### 1.5 RolesGuard Doesn't Validate Organization Membership (CWE-639)
**Severity:** CRITICAL  
**File:** `/home/user/genki-tcg/apps/backend/src/auth/guards/roles.guard.ts:1-27`

**Code:**
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<OrgRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // ❌ Only checks if user HAS the role, not if they have it IN THEIR ORGANIZATION
    return requiredRoles.includes(user.role);
  }
}
```

**Issue:**
The guard trusts `user.role` from JWT without verifying:
1. User is actually a member of the target organization
2. User's role in that specific organization matches the required role
3. Membership hasn't been revoked since token issuance

**Attack Scenario:**
```
1. User A is STAFF in Organization X
2. User A is added as PLAYER to Organization Y
3. JWT still contains role: "STAFF"
4. User A can perform STAFF actions in Organization Y
5. No database lookup to verify current role
```

**Impact:**
- Privilege escalation across organizations
- Persistent elevated access even after role downgrade
- Broken access control

**Remediation Required:**
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const requiredRoles = this.reflector.get<OrgRole[]>('roles', context.getHandler());
  if (!requiredRoles) return true;
  
  const request = context.switchToHttp().getRequest();
  const user = request.user;
  
  // MUST verify membership in database
  const membership = await this.prisma.orgMembership.findUnique({
    where: { userId_orgId: { userId: user.sub, orgId: user.orgId } },
  });
  
  return membership && requiredRoles.includes(membership.role);
}
```

---

### 1.6 Default JWT Secret in Fallback (CWE-798: Use of Hard-Coded Credentials)
**Severity:** CRITICAL  
**Files:**
- `/home/user/genki-tcg/apps/backend/src/auth/auth.module.ts:17`
- `/home/user/genki-tcg/apps/backend/src/auth/strategies/jwt.strategy.ts:17-18`

**Code:**
```typescript
// auth.module.ts
secret: config.get('JWT_SECRET') || 'dev-secret-change-me',

// jwt.strategy.ts
secretOrKey: configService.get('JWT_SECRET') || 'dev-secret-change-me',
```

**Issue:**
- Hardcoded default JWT secret visible in source code
- If `JWT_SECRET` environment variable is not set, ALL tokens use 'dev-secret-change-me'
- Any attacker can forge valid tokens

**Attack:**
```bash
# Attacker can create valid JWT tokens
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'victim-user-id', email: 'victim@example.com', orgId: 'victim-org', role: 'OWNER' },
  'dev-secret-change-me'
);
```

**Impact:**
- Complete authentication bypass if environment variable not set
- Potential privilege escalation to OWNER role
- Account takeover for any user

**Remediation:**
```typescript
const secret = config.get('JWT_SECRET');
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

## 2. HIGH SEVERITY VULNERABILITIES

### 2.1 No Input Validation on DTOs (CWE-20: Improper Input Validation)
**Severity:** HIGH  
**Status:** PRESENT  
**Evidence:**
- `class-validator` installed (v0.14.1) but NOT USED
- `class-transformer` installed (v0.5.1) but NOT USED
- No validation decorators found in entire codebase

**Affected DTOs:**
```typescript
// auth.service.ts - SignupDto & LoginDto have NO validation
export interface SignupDto {
  email: string;           // ❌ No email format validation
  password: string;        // ❌ No password strength validation
  name: string;           // ❌ No length validation
  inviteCode: string;     // ❌ No format validation
}

// events.service.ts - CreateEventDto has NO validation
export interface CreateEventDto {
  name: string;           // ❌ Could be empty string or SQL injection
  game: GameType;         // ❌ Not validated enum
  format: EventFormat;    // ❌ Not validated enum
  startAt: Date;          // ❌ No date validation
  maxPlayers?: number;    // ❌ Could be negative
  entryFeeCents?: number; // ❌ Could be negative
  // ...
}
```

**Attack Scenarios:**

1. **Empty Password:**
   ```typescript
   POST /auth/signup
   { email: "user@test.com", password: "", name: "Attacker", inviteCode: "VALID" }
   ```

2. **Invalid Email:**
   ```typescript
   POST /auth/signup
   { email: "not-an-email", password: "pass123", name: "X", inviteCode: "VALID" }
   ```

3. **Negative Entry Fee:**
   ```typescript
   POST /events
   { name: "Event", entryFeeCents: -5000 }  // Negative fee = credit to players
   ```

4. **SQL Injection via Event Name:**
   While Prisma provides SQL injection protection, unvalidated inputs can cause:
   - Extreme database load
   - NoSQL injection if database layer changes
   - Unexpected behavior

**Impact:**
- Account creation with weak credentials
- Tournament integrity compromise (negative fees, invalid dates)
- Potential DOS through malformed input

**Remediation:**
```typescript
import { IsEmail, MinLength, MaxLength, IsPositive, IsEnum } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @MaxLength(128)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @MinLength(1)
  @MaxLength(100)
  name: string;

  @MinLength(1)
  @MaxLength(50)
  inviteCode: string;
}
```

---

### 2.2 Missing Password Requirements (CWE-521: Weak Password Requirements)
**Severity:** HIGH  
**File:** `/home/user/genki-tcg/apps/backend/src/auth/auth.service.ts:38-92`

**Issue:**
```typescript
async signup(dto: SignupDto) {
  const { email, password, name, inviteCode } = dto;
  // ❌ NO password strength validation
  // ❌ NO password history check
  // ❌ NO password requirements enforced
  
  const passwordHash = await bcrypt.hash(password, 10);
  // Password could be "a", "123", "password", etc.
}
```

**Requirements Missing:**
- ❌ Minimum length (should be 12+ characters)
- ❌ Character complexity (uppercase, lowercase, numbers, symbols)
- ❌ Common password blacklist
- ❌ Password not same as email/username
- ❌ Password reuse prevention

**Attack:** Brute force and dictionary attacks on weak passwords

---

### 2.3 No Email Validation or Verification (CWE-20)
**Severity:** HIGH  
**Issue:**
- No email format validation
- No email verification/confirmation flow
- Spam accounts or malformed emails can be registered
- Account takeover through email hijacking possible

---

### 2.4 Missing Authorization Checks in Multiple Endpoints (CWE-639)
**Severity:** HIGH  

**Unguarded or Insufficiently Guarded Endpoints:**

| Endpoint | Issue | File |
|----------|-------|------|
| `GET /events/:id` | No JWT guard, no orgId check | events.controller.ts:18-21 |
| `GET /rounds/:roundId/pairings` | No orgId validation | rounds.controller.ts:19-22 |
| `GET /matches/:id` | No orgId validation | matches.controller.ts:20-23 |
| `GET /standings/events/:eventId` | Accessible by any user | standings.controller.ts:13-16 |
| `POST /events/:id/register` | No checking if user belongs to org | events.controller.ts:37-40 |
| `POST /decklists` | No validation entryId belongs to event in user's org | decklists.controller.ts:20-26 |

**Example - Register Event Across Organizations:**
```typescript
// events.controller.ts
@Post(':id/register')
async register(@CurrentUser() user: any, @Param('id') eventId: string) {
  return this.eventsService.registerForEvent(eventId, user.id);
  // ❌ User from Org A can register for event from Org B
}
```

---

### 2.5 Privilege Escalation via Match Override (CWE-639)
**Severity:** HIGH  
**File:** `/home/user/genki-tcg/apps/backend/src/matches/matches.controller.ts:25-40`

**Issue:**
```typescript
@Post(':id/override')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async overrideResult(
  @Param('id') matchId: string,
  @CurrentUser() user: any,
  @Body() dto: { result: any; gamesWonA: number; gamesWonB: number },
) {
  return this.matchesService.overrideMatchResult(
    matchId,
    dto.result,
    dto.gamesWonA,
    dto.gamesWonB,
    user.id,
  );
  // ❌ No validation that user's org owns the match
}
```

**Attack:**
STAFF from Organization A can override match results in Organization B's event

**Impact:**
- Tournament integrity compromise
- Fraud in prize distribution
- False match results recorded

---

### 2.6 No Validation of Invite Code Format (CWE-20)
**Severity:** HIGH  
**File:** `/home/user/genki-tcg/apps/backend/src/auth/auth.service.ts:41-48`

**Code:**
```typescript
async signup(dto: SignupDto) {
  const { email, password, name, inviteCode } = dto;

  const org = await this.prisma.organization.findUnique({
    where: { inviteCode },
  });

  if (!org) {
    throw new BadRequestException('Invalid invite code');
  }
  // ❌ No rate limiting on failed attempts
  // ❌ Invite code exposed in URL and requests
}
```

**Issues:**
1. No rate limiting on invalid invite code attempts
2. Invite code sent in plaintext in requests
3. Could enumerate valid invite codes through timing attacks

---

### 2.7 No Validation in Credits Adjustment (CWE-20)
**Severity:** HIGH  
**File:** `/home/user/genki-tcg/apps/backend/src/credits/credits.service.ts:25-109`

**Issue:**
```typescript
export interface CreditAdjustDto {
  userId: string;
  amount: number;        // ❌ No validation that amount is reasonable
  reasonCode: CreditReasonCode;
  memo?: string;         // ❌ No length validation
  relatedEventId?: string;
}

async adjustCredits(orgId: string, dto: CreditAdjustDto, performedBy: string) {
  const { userId, amount, reasonCode, memo, relatedEventId } = dto;
  // ❌ No validation that requesting user is in the same org as target user
  // ❌ No upper limit on credit adjustments
  // ❌ No validation that memo isn't SQL injection
  
  if (amount < 0) {
    const currentBalance = await this.getBalance(orgId, userId);
    if (currentBalance + amount < 0) {
      throw new BadRequestException('Insufficient credits');
    }
  }
  // Only checks insufficient balance, not authorization
}
```

**Attack:**
Staff member can set `userId` to any user in the system and adjust their credits

---

### 2.8 No Rate Limiting on Authentication Endpoints (CWE-307)
**Severity:** HIGH  
**Files:** `/home/user/genki-tcg/apps/backend/src/auth/auth.controller.ts`

**Issue:**
```typescript
@Post('signup')
async signup(@Body() dto: SignupDto) {
  return this.authService.signup(dto);
  // ❌ No rate limiting
  // ❌ No CAPTCHA
}

@Post('login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
  // ❌ No rate limiting
  // ❌ No account lockout
  // ❌ No failed attempt logging
}
```

**Note:** App-level throttler is configured (100 requests/min) but not applied to auth endpoints specifically. Need aggressive per-IP/per-email rate limiting.

---

## 3. MEDIUM SEVERITY VULNERABILITIES

### 3.1 Bcrypt Rounds Set to 10 (CWE-916: Use of Password Hash With Insufficient Computational Effort)
**Severity:** MEDIUM  
**File:** `/home/user/genki-tcg/apps/backend/src/auth/auth.service.ts:60`

**Code:**
```typescript
const passwordHash = await bcrypt.hash(password, 10);
// ❌ 10 rounds: ~100ms on modern hardware
// ✅ Recommendation: 12+ rounds
```

**Context:** 10 rounds is acceptable but could be optimized to 12-13 for better security margin without significant performance impact.

---

### 3.2 Long JWT Expiration (7 days) (CWE-613: Insufficient Session Expiration)
**Severity:** MEDIUM  
**File:** `/home/user/genki-tcg/apps/backend/src/auth/auth.module.ts:19`

**Code:**
```typescript
signOptions: {
  expiresIn: config.get('JWT_EXPIRES_IN') || '7d',
  // ❌ 7 days is long for sensitive operations
  // Recommendation: 1-2 hours for access token
}
```

**Issues:**
- Stolen token valid for 7 days
- No refresh token mechanism
- Long window for token replay attacks

---

### 3.3 No Logout Mechanism
**Severity:** MEDIUM  
**Issue:**
- No JWT blacklist or token revocation
- User cannot manually logout
- Stolen tokens cannot be invalidated
- Device compromise not mitigatable

---

### 3.4 No Input Sanitization on Match Results (CWE-19)
**Severity:** MEDIUM  
**File:** `/home/user/genki-tcg/apps/backend/src/matches/matches.controller.ts:13-18`

**Code:**
```typescript
@Post('report')
async reportResult(@CurrentUser() user: any, @Body() dto: ReportMatchResultDto) {
  return this.matchesService.reportMatchResult(dto, user.id);
  // ❌ No validation on gamesWonA and gamesWonB
  // Could be negative or extremely large
}

export interface ReportMatchResultDto {
  matchId: string;
  result: MatchResult;
  gamesWonA: number;  // ❌ Could be -100000
  gamesWonB: number;  // ❌ Could be 999999
}
```

---

### 3.4 Missing Null/Undefined Checks in Authorization (CWE-252: Unchecked Return Value)
**Severity:** MEDIUM  
**File:** `/home/user/genki-tcg/apps/backend/src/auth/decorators/current-user.decorator.ts`

**Code:**
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;  // ❌ Could be undefined if not authenticated
  }
);
```

Controllers assume `user` is always present but it could be undefined if guard fails.

---

### 3.5 No HTTPS Enforcement
**Severity:** MEDIUM  
**Issue:**
- No visible HTTPS/TLS enforcement in code
- Tokens sent in plaintext if not using HTTPS
- Credentials transmitted insecurely
- Should use HSTS headers and force HTTPS

---

### 3.6 CORS Configuration Incomplete
**Severity:** MEDIUM  
**File:** `/home/user/genki-tcg/apps/backend/src/main.ts:20-26`

**Code:**
```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',  // Admin web
    'http://localhost:8081',  // Expo dev
  ],
  credentials: true,
});
```

**Issues:**
- localhost only (good for development)
- credentials: true without proper validation
- No production CORS configuration visible
- Need explicit origin list for production

---

## 4. LOW SEVERITY VULNERABILITIES

### 4.1 Excessive Error Information (CWE-209: Information Exposure Through an Error Message)
**Severity:** LOW  
**File:** `/home/user/genki-tcg/apps/backend/src/auth/auth.service.ts:108-115`

**Code:**
```typescript
const user = await this.prisma.user.findUnique({
  where: { email },
  // ...
});

if (!user || !user.passwordHash) {
  throw new UnauthorizedException('Invalid credentials');
  // ✅ Good - generic message
}

const valid = await bcrypt.compare(password, user.passwordHash);
if (!valid) {
  throw new UnauthorizedException('Invalid credentials');
  // ✅ Good - generic message
}
```

**Good:** Generic "Invalid credentials" doesn't leak if user exists.  
**Concern:** Some error messages in other services could leak information (e.g., "User not found in organization").

---

### 4.2 No CSRF Protection
**Severity:** LOW  
**Issue:**
- No CSRF tokens in state-changing operations
- Could be vulnerable to CSRF attacks if cookies used for auth
- Current JWT-based auth somewhat mitigates, but should still add

---

### 4.3 No Two-Factor Authentication (2FA)
**Severity:** LOW  
**Issue:**
- No 2FA implementation
- No TOTP support
- No SMS verification
- Valuable for user accounts with sensitive access

---

### 4.4 Missing Security Headers
**Severity:** LOW  
**Missing Headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `X-XSS-Protection`

---

## 5. DATA PROTECTION ISSUES

### 5.1 Sensitive Data Exposure in Database
**Severity:** MEDIUM  
**File:** `/home/user/genki-tcg/apps/backend/prisma/schema.prisma`

**Issues:**
- Password hashes stored correctly (good)
- Audit logs store all actions (good)
- But no encryption of sensitive data in transit
- No field-level encryption for credit amounts or PII

---

### 5.2 Logs Expose Sensitive Information
**Severity:** MEDIUM  
**File:** `/home/user/genki-tcg/apps/backend/src/main.ts:7`

**Code:**
```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose'],  // ✅ Full logging in production?
});
```

Should disable 'debug' and 'verbose' in production.

---

## 6. SUMMARY BY CATEGORY

### Authentication Vulnerabilities (3/4 - CRITICAL)
- ✅ Password hashing: **GOOD** (bcrypt with reasonable rounds)
- ❌ JWT security: **CRITICAL** (default secret fallback)
- ❌ Token expiration: **MEDIUM** (7 days is long)
- ❌ Session management: **HIGH** (no logout/revocation)

### Authorization Issues (3 CRITICAL, 2 HIGH)
- ❌ RBAC implementation: **CRITICAL** (RolesGuard bypasses org check)
- ❌ Guard effectiveness: **CRITICAL** (missing throughout)
- ❌ Missing authorization checks: **CRITICAL** (multiple endpoints)
- ❌ Privilege escalation risks: **HIGH** (match override, role claims trusted)

### Input Validation (5/5 - HIGH)
- ❌ DTO validation: **HIGH** (class-validator not used)
- ✅ SQL injection: **GOOD** (Prisma parameterization protects)
- ❌ Email validation: **HIGH** (no format validation)
- ❌ Password requirements: **HIGH** (no strength enforcement)
- ❌ General input: **HIGH** (no class-validator decorators)

---

## REMEDIATION PRIORITY

### Phase 1 (IMMEDIATE - 48 hours)
1. ✅ Remove default JWT secret fallback
2. ✅ Implement organization validation in RolesGuard
3. ✅ Add orgId parameter to all service methods
4. ✅ Validate orgId matches in controllers before service calls

### Phase 2 (URGENT - 1 week)
1. Add input validation (class-validator decorators)
2. Add password strength requirements
3. Implement email verification
4. Add rate limiting to auth endpoints

### Phase 3 (IMPORTANT - 2 weeks)
1. Implement token blacklist/revocation
2. Add 2FA support
3. Reduce JWT expiration to 1-2 hours
4. Add refresh token mechanism

### Phase 4 (SOON - 1 month)
1. Add HTTPS enforcement
2. Implement security headers
3. Add CSRF protection
4. Field-level encryption for sensitive data

---

## FILES REQUIRING CHANGES

**CRITICAL:**
- `/home/user/genki-tcg/apps/backend/src/auth/auth.module.ts`
- `/home/user/genki-tcg/apps/backend/src/auth/strategies/jwt.strategy.ts`
- `/home/user/genki-tcg/apps/backend/src/auth/guards/roles.guard.ts`
- `/home/user/genki-tcg/apps/backend/src/events/events.service.ts`
- `/home/user/genki-tcg/apps/backend/src/events/events.controller.ts`

**HIGH:**
- `/home/user/genki-tcg/apps/backend/src/auth/auth.service.ts`
- `/home/user/genki-tcg/apps/backend/src/auth/auth.controller.ts`
- `/home/user/genki-tcg/apps/backend/src/*/**.controller.ts` (all controllers)
- `/home/user/genki-tcg/apps/backend/src/*/**.service.ts` (all services)
- `/home/user/genki-tcg/apps/backend/src/main.ts`

---

## TESTING RECOMMENDATIONS

1. **Unit Tests:**
   - Test RolesGuard with users from different organizations
   - Test authorization checks in all service methods
   - Test DTO validation with edge cases

2. **Integration Tests:**
   - Cross-organization access attempts
   - Privilege escalation scenarios
   - Token manipulation and forgery

3. **Security Tests:**
   - Brute force login attempts
   - Invite code enumeration
   - Match result manipulation
   - Credit balance tampering

---

## REFERENCES

- CWE-639: Authorization Bypass Through User-Controlled Key
- CWE-798: Use of Hard-Coded Credentials
- CWE-20: Improper Input Validation
- CWE-521: Weak Password Requirements
- CWE-613: Insufficient Session Expiration
- CWE-307: Improper Restriction of Rendered UI Layers or Frames
- OWASP Top 10: A01:2021 - Broken Access Control
- OWASP Top 10: A07:2021 - Identification and Authentication Failures

