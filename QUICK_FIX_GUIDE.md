# 🔧 Quick Fix Guide - Apply These Changes Immediately

**Time Required**: 4-6 hours
**Priority**: P0 CRITICAL

Apply these exact code changes to fix the most critical security vulnerabilities.

---

## Fix 1: Remove Hardcoded JWT Secret (5 minutes)

### File: `apps/backend/src/auth/auth.module.ts`

**Replace lines 16-20 with:**

```typescript
useFactory: (config: ConfigService) => {
  const secret = config.get('JWT_SECRET');
  if (!secret || secret === 'dev-secret-change-me') {
    throw new Error(
      'JWT_SECRET environment variable must be set to a secure value'
    );
  }
  return {
    secret,
    signOptions: {
      expiresIn: config.get('JWT_EXPIRES_IN') || '7d',
    },
  };
},
```

### Generate Strong Secret:

```bash
# Run this command to generate a secure secret
openssl rand -base64 64

# Add to .env file:
# JWT_SECRET="<paste the generated secret here>"
```

---

## Fix 2: Fix Token in URL (30 minutes)

### File: `apps/admin-web/src/lib/api.ts`

**Replace the `exportStandings` method (lines 176-180) with:**

```typescript
async exportStandings(eventId: string) {
  const response = await this.client.get(`/standings/events/${eventId}/export`, {
    responseType: 'blob',
  });

  // Create download programmatically
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `standings-${eventId}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
```

**Update the controller to remove token from query:**

### File: `apps/backend/src/standings/standings.controller.ts`

**Replace the export endpoint:**

```typescript
@Get('events/:eventId/export')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async exportStandings(
  @Param('eventId') eventId: string,
  @Res() res: Response,
) {
  const standings = await this.standingsService.calculateCurrentStandings(eventId);

  const headers = ['Rank', 'Player', 'Points', 'Match Record', 'OMW%', 'GW%', 'OGW%', 'OOMW%'];
  const csvRows = [headers.join(',')];

  for (const standing of standings) {
    const row = [
      standing.rank,
      `"${standing.userName}"`,
      standing.points,
      `"${standing.matchWins}-${standing.matchLosses}-${standing.matchDraws}"`,
      (standing.omwPercent * 100).toFixed(2),
      (standing.gwPercent * 100).toFixed(2),
      (standing.ogwPercent * 100).toFixed(2),
      (standing.oomwPercent * 100).toFixed(2),
    ];
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="standings-${eventId}.csv"`);

  return res.send(csv);
}
```

---

## Fix 3: Stop Exposing Password Hashes (2 hours)

### File: `apps/backend/src/events/events.service.ts`

**Method: `getEvent` (around line 60-76)**

Replace:
```typescript
include: {
  entries: {
    include: {
      user: true, // ❌ BAD
    },
  },
}
```

With:
```typescript
include: {
  entries: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          // Only fields needed for display
        },
      },
    },
    include: {
      decklist: true,
    },
  },
  rounds: {
    orderBy: {
      roundNumber: 'asc',
    },
  },
}
```

**Method: `getEvents` (around line 21)**

Already correct - no changes needed ✅

---

### File: `apps/backend/src/rounds/rounds.service.ts`

**Method: `createNextRound` (around line 20-28)**

Replace:
```typescript
include: {
  entries: {
    where: {
      checkedInAt: { not: null },
      droppedAt: null,
    },
    include: {
      user: true, // ❌ BAD
    },
  },
  rounds: true,
},
```

With:
```typescript
include: {
  entries: {
    where: {
      checkedInAt: { not: null },
      droppedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  rounds: true,
},
```

**Method: `getPairings` (around line 96-106)**

Replace:
```typescript
return this.prisma.match.findMany({
  where: { roundId },
  include: {
    playerA: true, // ❌ BAD
    playerB: true, // ❌ BAD
  },
  orderBy: {
    tableNumber: 'asc',
  },
});
```

With:
```typescript
return this.prisma.match.findMany({
  where: { roundId },
  include: {
    playerA: {
      select: {
        id: true,
        name: true,
      },
    },
    playerB: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  orderBy: {
    tableNumber: 'asc',
  },
});
```

---

### File: `apps/backend/src/standings/standings.service.ts`

**Method: `calculateCurrentStandings` (around line 12-16)**

Replace:
```typescript
include: {
  entries: {
    include: {
      user: true, // ❌ BAD
    },
  },
  rounds: {
    include: {
      matches: true,
    },
  },
},
```

With:
```typescript
include: {
  entries: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  rounds: {
    include: {
      matches: true,
    },
  },
},
```

---

### File: `apps/backend/src/matches/matches.service.ts`

**Method: `reportResult` (around line 64-72)**

Replace:
```typescript
const match = await this.prisma.match.findUnique({
  where: { id: matchId },
  include: {
    round: {
      include: {
        event: true,
      },
    },
    playerA: true, // ❌ BAD
    playerB: true, // ❌ BAD
  },
});
```

With:
```typescript
const match = await this.prisma.match.findUnique({
  where: { id: matchId },
  include: {
    round: {
      include: {
        event: true,
      },
    },
    playerA: {
      select: {
        id: true,
        name: true,
      },
    },
    playerB: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});
```

---

## Fix 4: Add Organization Validation (3-4 hours)

This is the most important fix. Add organization validation to prevent cross-organization data access.

### Pattern to Apply:

**Service Layer**: Add `orgId` parameter and validation
**Controller Layer**: Pass `user.orgId` from JWT

### File: `apps/backend/src/events/events.service.ts`

**Update method signature:**

```typescript
async getEvent(eventId: string, userOrgId: string) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
    include: { /* ... */ },
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  // CRITICAL: Validate organization
  if (event.orgId !== userOrgId) {
    throw new ForbiddenException('Access denied to this event');
  }

  return event;
}
```

**Apply same pattern to these methods in `events.service.ts`:**
- `registerForEvent()`
- `selfCheckIn()`
- `checkIn()`
- `markAsPaid()`
- `addLatePlayer()`
- `distributePrizes()`
- `dropPlayer()`
- `getMyMatches()`

### File: `apps/backend/src/events/events.controller.ts`

**Update controllers to pass orgId:**

```typescript
@Get(':id')
async getEvent(@Param('id') id: string, @CurrentUser() user: any) {
  return this.eventsService.getEvent(id, user.orgId); // Add user.orgId
}

@Post(':id/register')
async register(@CurrentUser() user: any, @Param('id') eventId: string) {
  return this.eventsService.registerForEvent(eventId, user.id, user.orgId); // Add user.orgId
}

// Apply to all other endpoints...
```

### File: `apps/backend/src/rounds/rounds.service.ts`

**Update `createNextRound`:**

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

  // Continue with existing logic...
}
```

**Update `getPairings`:**

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

### File: `apps/backend/src/rounds/rounds.controller.ts`

```typescript
@Post('events/:eventId/next')
@UseGuards(RolesGuard)
@Roles('OWNER', 'STAFF')
async createNextRound(
  @Param('eventId') eventId: string,
  @CurrentUser() user: any,
) {
  return this.roundsService.createNextRound(eventId, user.orgId); // Add user.orgId
}

@Get(':roundId/pairings')
async getPairings(@Param('roundId') roundId: string, @CurrentUser() user: any) {
  return this.roundsService.getPairings(roundId, user.orgId); // Add user.orgId
}
```

### Apply Same Pattern To:

1. **matches.service.ts**: `reportResult()`, `overrideResult()`
2. **standings.service.ts**: `calculateCurrentStandings()`, `exportStandings()`
3. **decklists.service.ts**: All methods
4. **credits.service.ts**: Methods that take userId

---

## Testing After Fixes

### 1. Test JWT Secret:
```bash
# Should fail to start without JWT_SECRET
npm run start:dev

# Add JWT_SECRET to .env, should start successfully
```

### 2. Test Password Hash Exposure:
```bash
curl http://localhost:3001/events/EVENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response should NOT contain passwordHash field
```

### 3. Test Organization Isolation:
```bash
# Create two users in different orgs
# User A tries to access User B's event
curl http://localhost:3001/events/USER_B_EVENT_ID \
  -H "Authorization: Bearer USER_A_TOKEN"

# Should return 403 Forbidden
```

### 4. Test Export Download:
- Click "Export CSV" in admin UI
- Check browser Network tab
- URL should NOT contain `?token=` parameter

---

## Verification Checklist

After applying all fixes:

- [ ] App fails to start without JWT_SECRET
- [ ] Generated JWT_SECRET is in `.env` and `.env` is in `.gitignore`
- [ ] Export CSV downloads without token in URL
- [ ] API responses never contain `passwordHash` field
- [ ] Users cannot access other org's events (403 error)
- [ ] Users cannot check-in to other org's events
- [ ] Users cannot see other org's standings
- [ ] All tests pass

---

## If You Get Stuck

1. Check error messages carefully - they'll guide you
2. Test one fix at a time
3. Use Postman/curl to test API endpoints
4. Check server logs for detailed errors
5. Review the full `CRITICAL_SECURITY_FIXES.md` for context

---

**After completing these fixes, the application will be significantly more secure but still needs P1 and P2 fixes before production deployment.**
