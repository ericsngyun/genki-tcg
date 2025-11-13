# Security Remediation Guide - Genki TCG Backend

## Quick Fix Summary (For Developers)

### 1. CRITICAL: Fix JWT Secret Fallback (30 min)

**File:** `apps/backend/src/auth/auth.module.ts`

**Current Code:**
```typescript
secret: config.get('JWT_SECRET') || 'dev-secret-change-me',  // ❌ BAD
```

**Fixed Code:**
```typescript
const secret = config.get('JWT_SECRET');
if (!secret) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

**Repeat in:** `apps/backend/src/auth/strategies/jwt.strategy.ts`

---

### 2. CRITICAL: Update RolesGuard to Check Organization (2 hours)

**File:** `apps/backend/src/auth/guards/roles.guard.ts`

**Current Code:**
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<OrgRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // ❌ Only checks if user HAS the role, not in their org
    return requiredRoles.includes(user.role);
  }
}
```

**Fixed Code:**
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,  // ADD THIS
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<OrgRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // ✅ Verify user is actually a member of org with required role
    const membership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId: user.sub,
          orgId: user.orgId,
        },
      },
    });
    
    if (!membership) {
      return false;
    }
    
    return requiredRoles.includes(membership.role);
  }
}
```

---

### 3. CRITICAL: Add Organization Validation to Services (8-12 hours)

**Pattern to Apply to ALL services:**

#### Before:
```typescript
// events.service.ts
async getEvent(eventId: string) {
  return this.prisma.event.findUnique({
    where: { id: eventId },
    // ❌ No orgId check
  });
}

async updateEvent(eventId: string, dto: UpdateEventDto) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    // ❌ No orgId check
  });
  // ...
}
```

#### After:
```typescript
// events.service.ts
async getEvent(eventId: string, requesterOrgId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });
  
  // ✅ Verify org ownership
  if (!event || event.orgId !== requesterOrgId) {
    throw new ForbiddenException('Access denied');
  }
  
  return event;
}

async updateEvent(eventId: string, dto: UpdateEventDto, requesterOrgId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });
  
  // ✅ Verify org ownership
  if (!event || event.orgId !== requesterOrgId) {
    throw new ForbiddenException('Access denied');
  }
  
  // ... rest of update logic
}
```

**Update controller calls:**
```typescript
// Before
async getEvent(@Param('id') id: string) {
  return this.eventsService.getEvent(id);  // ❌ Missing orgId
}

// After
async getEvent(@CurrentUser() user: any, @Param('id') id: string) {
  return this.eventsService.getEvent(id, user.orgId);  // ✅ Pass orgId
}
```

**Files to update:**
- ✅ events.service.ts (getEvent, updateEvent, all methods)
- ✅ events.controller.ts (pass user.orgId)
- ✅ rounds.service.ts (getPairings, createNextRound)
- ✅ matches.service.ts (getMatch, reportMatchResult, overrideMatchResult)
- ✅ decklists.service.ts (submitDecklist, getMyDecklist, getDecklistsForEvent)
- ✅ credits.service.ts (all credit adjustment methods)
- ✅ standings.service.ts (calculateCurrentStandings)

---

### 4. HIGH: Add DTO Validation (4 hours)

**Install (already in package.json):**
```bash
npm install class-validator class-transformer
```

**Create:** `apps/backend/src/auth/auth.dto.ts`
```typescript
import { IsEmail, MinLength, MaxLength, IsStrongPassword } from 'class-validator';

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

export class LoginDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;
}
```

**Create:** `apps/backend/src/events/events.dto.ts`
```typescript
import { IsString, IsEnum, IsDate, IsOptional, IsPositive, Min, Max } from 'class-validator';
import { GameType, EventFormat } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsEnum(GameType)
  game: GameType;

  @IsEnum(EventFormat)
  format: EventFormat;

  @IsDate()
  startAt: Date;

  @IsOptional()
  @IsPositive()
  @Max(1000)
  maxPlayers?: number;

  @IsOptional()
  @Min(0)
  @Max(999999)
  entryFeeCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @Min(0)
  @Max(9999999)
  totalPrizeCredits?: number;
}
```

**Update controllers to use DTOs:**
```typescript
// auth.controller.ts
import { SignupDto, LoginDto } from './auth.dto';

@Post('signup')
async signup(@Body() dto: SignupDto) {  // Now validated!
  return this.authService.signup(dto);
}

@Post('login')
async login(@Body() dto: LoginDto) {  // Now validated!
  return this.authService.login(dto);
}
```

---

### 5. HIGH: Increase Bcrypt Rounds (15 min)

**File:** `apps/backend/src/auth/auth.service.ts:60`

```typescript
// Before
const passwordHash = await bcrypt.hash(password, 10);  // ❌ 10 rounds

// After
const passwordHash = await bcrypt.hash(password, 12);  // ✅ 12 rounds
```

---

### 6. HIGH: Add Rate Limiting to Auth Endpoints (1 hour)

**File:** `apps/backend/src/auth/auth.controller.ts`

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 per minute
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })  // 10 per minute
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

---

### 7. MEDIUM: Reduce JWT Expiration (15 min)

**File:** `apps/backend/src/auth/auth.module.ts`

```typescript
// Before
signOptions: {
  expiresIn: config.get('JWT_EXPIRES_IN') || '7d',  // ❌ 7 days
}

// After
signOptions: {
  expiresIn: config.get('JWT_EXPIRES_IN') || '2h',  // ✅ 2 hours
}
```

**Update `.env.example`:**
```env
JWT_EXPIRES_IN="2h"  # Changed from 7d
```

---

## Testing the Fixes

### Test Organization Isolation
```bash
# Test that User A (Org X) cannot access Org Y data
curl -H "Authorization: Bearer <token-org-x>" \
  http://localhost:3001/events/<event-id-org-y>
# Should return: 403 Forbidden (Access denied)
```

### Test RolesGuard
```bash
# Test that downgraded STAFF user cannot perform STAFF actions
# 1. User has STAFF role in token
# 2. Revoke STAFF membership in database
# 3. Try to create event
# Should fail due to database check
```

### Test DTO Validation
```bash
# Test empty password
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"","name":"Test","inviteCode":"VALID"}'
# Should return: 400 Bad Request - password validation error

# Test invalid email
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"not-email","password":"SecurePass123!","name":"Test","inviteCode":"VALID"}'
# Should return: 400 Bad Request - email validation error
```

### Test JWT Secret Required
```bash
# Remove JWT_SECRET env var
unset JWT_SECRET

# Restart server
npm run dev

# Server should fail to start with:
# Error: JWT_SECRET environment variable is required
```

---

## Code Review Checklist

Before merging any security fixes:

- [ ] No `user: any` - use proper User type
- [ ] All service methods receive `requesterOrgId` parameter
- [ ] All service methods validate org ownership
- [ ] RolesGuard checks database membership
- [ ] All DTOs have validation decorators
- [ ] Password requirements enforced
- [ ] JWT_SECRET is required (no fallback)
- [ ] Auth endpoints have rate limiting
- [ ] Bcrypt rounds set to 12+
- [ ] JWT expiration is 2 hours or less
- [ ] All tests pass

---

## Deployment Steps

1. **Phase 1 (EMERGENCY):**
   - Merge JWT secret fix
   - Merge RolesGuard fix
   - Merge critical service org validation fixes
   - Deploy immediately

2. **Phase 2 (URGENT):**
   - Merge DTO validation
   - Merge password strength requirements
   - Merge rate limiting
   - Test thoroughly, deploy within 1 week

3. **Phase 3 (IMPORTANT):**
   - Merge token revocation system
   - Merge refresh token logic
   - Deploy within 2 weeks

---

## Emergency Hotfix Deployment

If you need to deploy critical fixes only:

```bash
# Stash non-critical changes
git stash

# Apply only critical patches
git apply critical-patches.patch

# Deploy
npm run build
npm run start:prod
```

---

## Questions?

See `/home/user/genki-tcg/SECURITY_AUDIT_REPORT.md` for detailed vulnerability analysis.

