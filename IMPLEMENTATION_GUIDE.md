# 🚀 Genki TCG - Implementation Guide for Credit Polish & ELO System

This guide provides step-by-step instructions and complete code for implementing the improvements identified in the audit.

---

## Quick Summary of Changes

### ✅ Completed
1. Added `PROMO` reason code to schema
2. Created comprehensive audit report (`CREDIT_SYSTEM_AUDIT.md`)
3. Designed ELO/leaderboard system
4. Designed welcome bonus promo system

### 🔧 Ready to Implement
1. Add ELO/rating schema tables
2. Implement welcome bonus on signup
3. Remove Players tab
4. Implement Glicko-2 rating algorithm
5. Create leaderboard API endpoints
6. Build leaderboard UI components

---

## Part 1: Schema Changes

### Step 1: Add Rating Tables to Prisma Schema

Add these models to `apps/backend/prisma/schema.prisma` after the `AuditLog` model:

```prisma
// ============================================================================
// Player Rating & Leaderboard System (Glicko-2)
// ============================================================================

model PlayerRating {
  id              String   @id @default(cuid())
  userId          String
  orgId           String
  gameType        GameType // Track rating per game system

  // Glicko-2 components
  rating          Float    @default(1500)      // Player's rating
  ratingDeviation Float    @default(350)       // Uncertainty
  volatility      Float    @default(0.06)      // Expected fluctuation

  // Statistics
  matchesPlayed   Int      @default(0)
  matchWins       Int      @default(0)
  matchLosses     Int      @default(0)
  matchDraws      Int      @default(0)

  // Metadata
  lastUpdatedAt   DateTime @default(now())
  lastMatchAt     DateTime?
  isProvisional   Boolean  @default(true)      // < 30 matches

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user    User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  org     Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  history PlayerRatingHistory[]

  @@unique([userId, orgId, gameType])
  @@index([userId])
  @@index([orgId, gameType, rating(sort: Desc)])
  @@index([orgId, gameType, isProvisional])
}

model PlayerRatingHistory {
  id              String   @id @default(cuid())
  playerRatingId  String
  eventId         String?
  matchId         String?

  // Rating changes
  ratingBefore    Float
  ratingAfter     Float
  ratingChange    Float

  rdBefore        Float
  rdAfter         Float

  volatilityBefore Float
  volatilityAfter  Float

  // Match context
  opponentId      String
  opponentRatingBefore Float
  matchResult     MatchResult

  calculatedAt    DateTime @default(now())

  // Relations
  playerRating PlayerRating @relation(fields: [playerRatingId], references: [id], onDelete: Cascade)
  event        Event?        @relation(fields: [eventId], references: [id], onDelete: SetNull)
  match        Match?        @relation(fields: [matchId], references: [id], onDelete: SetNull)
  opponent     User          @relation("RatingHistoryOpponent", fields: [opponentId], references: [id], onDelete: Cascade)

  @@index([playerRatingId, calculatedAt(sort: Desc)])
  @@index([eventId])
  @@index([matchId])
}
```

### Step 2: Update Model Relations

Add these relations to existing models:

```prisma
// In Organization model:
model Organization {
  // ... existing fields ...
  playerRatings PlayerRating[]
}

// In User model:
model User {
  // ... existing fields ...
  playerRatings            PlayerRating[]
  ratingHistoryAsOpponent  PlayerRatingHistory[]     @relation("RatingHistoryOpponent")
}

// In Event model:
model Event {
  // ... existing fields ...
  ratingHistory        PlayerRatingHistory[]
}

// In Match model:
model Match {
  // ... existing fields ...
  ratingHistory PlayerRatingHistory[]
}
```

### Step 3: Run Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_player_rating_system
npx prisma generate
```

---

## Part 2: Welcome Bonus Implementation

### File: `apps/backend/src/auth/auth.service.ts`

Add this method to the `AuthService` class:

```typescript
/**
 * Give new players a welcome bonus
 */
private async giveWelcomeBonus(
  tx: any, // Prisma transaction client
  userId: string,
  orgId: string,
): Promise<void> {
  const WELCOME_BONUS = 10; // 10 credits

  // Create ledger entry
  await tx.creditLedgerEntry.create({
    data: {
      orgId,
      userId,
      amount: WELCOME_BONUS,
      reasonCode: 'PROMO',
      memo: 'Welcome bonus! Thanks for joining our community. 🎉',
      createdBy: 'system',
    },
  });

  // Update balance
  await tx.creditBalance.upsert({
    where: {
      orgId_userId: { orgId, userId },
    },
    create: {
      orgId,
      userId,
      balance: WELCOME_BONUS,
      lastTransactionAt: new Date(),
    },
    update: {
      balance: { increment: WELCOME_BONUS },
      lastTransactionAt: new Date(),
    },
  });

  this.logger.log(`Welcome bonus of ${WELCOME_BONUS} credits given to user ${userId}`);
}
```

### Update `signup()` method:

```typescript
async signup(dto: SignupDto) {
  // ... existing validation ...

  const user = await this.prisma.$transaction(async (tx) => {
    // Create user
    const newUser = await tx.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 12),
      },
    });

    // Find org and create membership
    const org = await tx.organization.findUnique({
      where: { inviteCode: dto.inviteCode },
    });

    if (!org) {
      throw new BadRequestException('Invalid invite code');
    }

    const membership = await tx.orgMembership.create({
      data: {
        userId: newUser.id,
        orgId: org.id,
        role: 'PLAYER',
      },
    });

    // Give welcome bonus for PLAYER role
    if (membership.role === 'PLAYER') {
      await this.giveWelcomeBonus(tx, newUser.id, org.id);
    }

    return newUser;
  });

  // ... rest of existing code ...
}
```

### Update Discord OAuth signup:

In `handleDiscordCallback()` method, add welcome bonus when creating new user:

```typescript
// After creating new user and membership
if (newMembership.role === 'PLAYER') {
  await this.giveWelcomeBonus(tx, newUser.id, org.id);
}
```

---

## Part 3: Remove Players Tab

### Step 1: Delete the file

```bash
rm apps/admin-web/src/app/dashboard/players/page.tsx
```

### Step 2: Update navigation

File: `apps/admin-web/src/app/dashboard/layout.tsx`

Remove the Players link from the navigation (around lines 64-70):

```tsx
// REMOVE THIS:
<Link
  href="/dashboard/players"
  className={cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
    pathname === "/dashboard/players" ? "bg-muted text-primary" : "text-muted-foreground"
  )}
>
  <Users className="h-4 w-4" />
  Players
</Link>
```

---

## Part 4: Glicko-2 Rating Algorithm

### File: `apps/backend/src/ratings/glicko2.service.ts` (NEW)

Create a new ratings module:

```bash
cd apps/backend/src
nest g module ratings
nest g service ratings
```

Here's the complete Glicko-2 implementation:

```typescript
import { Injectable, Logger } from '@nestjs/common';

const GLICKO2_SCALE = 173.7178; // Conversion factor

interface Glicko2Rating {
  rating: number;
  ratingDeviation: number;
  volatility: number;
}

interface MatchOutcome {
  opponentRating: number;
  opponentRD: number;
  score: number; // 1 = win, 0.5 = draw, 0 = loss
}

@Injectable()
export class Glicko2Service {
  private readonly logger = new Logger(Glicko2Service.name);

  // Glicko-2 constants
  private readonly TAU = 0.5; // System volatility
  private readonly CONVERGENCE_TOLERANCE = 0.000001;

  /**
   * Update a player's rating based on match outcomes
   */
  updateRating(
    currentRating: Glicko2Rating,
    matches: MatchOutcome[],
  ): Glicko2Rating {
    if (matches.length === 0) {
      // No matches: increase RD due to inactivity
      return {
        ...currentRating,
        ratingDeviation: this.calculateInactivityRD(currentRating.ratingDeviation),
      };
    }

    // Step 2: Convert to Glicko-2 scale
    const mu = (currentRating.rating - 1500) / GLICKO2_SCALE;
    const phi = currentRating.ratingDeviation / GLICKO2_SCALE;
    const sigma = currentRating.volatility;

    // Step 3: Compute variance (v)
    const v = this.computeVariance(mu, phi, matches);

    // Step 4: Compute delta
    const delta = this.computeDelta(mu, phi, matches, v);

    // Step 5: Update volatility
    const newSigma = this.computeNewVolatility(phi, sigma, delta, v);

    // Step 6: Update rating deviation
    const phiStar = Math.sqrt(phi * phi + newSigma * newSigma);

    // Step 7: Update rating and RD
    const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
    const newMu = mu + newPhi * newPhi * this.computeDeltaNumerator(mu, matches);

    // Convert back to Glicko scale
    return {
      rating: newMu * GLICKO2_SCALE + 1500,
      ratingDeviation: newPhi * GLICKO2_SCALE,
      volatility: newSigma,
    };
  }

  private computeVariance(mu: number, phi: number, matches: MatchOutcome[]): number {
    let sum = 0;
    for (const match of matches) {
      const opponentMu = (match.opponentRating - 1500) / GLICKO2_SCALE;
      const opponentPhi = match.opponentRD / GLICKO2_SCALE;
      const g = this.gFunction(opponentPhi);
      const E = this.expectedScore(mu, opponentMu, opponentPhi);
      sum += g * g * E * (1 - E);
    }
    return 1 / sum;
  }

  private computeDelta(
    mu: number,
    phi: number,
    matches: MatchOutcome[],
    v: number,
  ): number {
    return v * this.computeDeltaNumerator(mu, matches);
  }

  private computeDeltaNumerator(mu: number, matches: MatchOutcome[]): number {
    let sum = 0;
    for (const match of matches) {
      const opponentMu = (match.opponentRating - 1500) / GLICKO2_SCALE;
      const opponentPhi = match.opponentRD / GLICKO2_SCALE;
      const g = this.gFunction(opponentPhi);
      const E = this.expectedScore(mu, opponentMu, opponentPhi);
      sum += g * (match.score - E);
    }
    return sum;
  }

  private computeNewVolatility(
    phi: number,
    sigma: number,
    delta: number,
    v: number,
  ): number {
    const a = Math.log(sigma * sigma);
    const tau = this.TAU;

    let A = a;
    let B: number;

    const phiSquared = phi * phi;
    const deltaSquared = delta * delta;

    if (deltaSquared > phiSquared + v) {
      B = Math.log(deltaSquared - phiSquared - v);
    } else {
      let k = 1;
      while (this.f(a - k * tau, deltaSquared, phiSquared, v, a) < 0) {
        k++;
      }
      B = a - k * tau;
    }

    let fA = this.f(A, deltaSquared, phiSquared, v, a);
    let fB = this.f(B, deltaSquared, phiSquared, v, a);

    while (Math.abs(B - A) > this.CONVERGENCE_TOLERANCE) {
      const C = A + ((A - B) * fA) / (fB - fA);
      const fC = this.f(C, deltaSquared, phiSquared, v, a);

      if (fC * fB < 0) {
        A = B;
        fA = fB;
      } else {
        fA = fA / 2;
      }

      B = C;
      fB = fC;
    }

    return Math.exp(A / 2);
  }

  private f(
    x: number,
    deltaSquared: number,
    phiSquared: number,
    v: number,
    a: number,
  ): number {
    const eX = Math.exp(x);
    const part1 = (eX * (deltaSquared - phiSquared - v - eX)) / (2 * Math.pow(phiSquared + v + eX, 2));
    const part2 = (x - a) / (this.TAU * this.TAU);
    return part1 - part2;
  }

  private gFunction(phi: number): number {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  private expectedScore(mu: number, opponentMu: number, opponentPhi: number): number {
    const g = this.gFunction(opponentPhi);
    return 1 / (1 + Math.exp(-g * (mu - opponentMu)));
  }

  private calculateInactivityRD(currentRD: number): number {
    const maxRD = 350;
    const newRD = Math.sqrt(currentRD * currentRD + this.TAU * this.TAU);
    return Math.min(newRD, maxRD);
  }

  /**
   * Calculate expected outcome probability
   */
  getExpectedScore(
    playerRating: number,
    playerRD: number,
    opponentRating: number,
    opponentRD: number,
  ): number {
    const playerMu = (playerRating - 1500) / GLICKO2_SCALE;
    const opponentMu = (opponentRating - 1500) / GLICKO2_SCALE;
    const opponentPhi = opponentRD / GLICKO2_SCALE;
    return this.expectedScore(playerMu, opponentMu, opponentPhi);
  }
}
```

---

## Part 5: Rating Service

### File: `apps/backend/src/ratings/ratings.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Glicko2Service } from './glicko2.service';
import type { GameType, MatchResult } from '@prisma/client';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private prisma: PrismaService,
    private glicko2: Glicko2Service,
  ) {}

  /**
   * Get or create player rating
   */
  async getOrCreateRating(userId: string, orgId: string, gameType: GameType) {
    return this.prisma.playerRating.upsert({
      where: {
        userId_orgId_gameType: { userId, orgId, gameType },
      },
      create: {
        userId,
        orgId,
        gameType,
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
      },
      update: {},
    });
  }

  /**
   * Update ratings after a match
   */
  async updateRatingsForMatch(matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        round: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!match || !match.playerBId || !match.result) {
      return; // Skip byes and incomplete matches
    }

    const gameType = match.round.event.game;
    const orgId = match.round.event.orgId;

    // Get current ratings
    const [ratingA, ratingB] = await Promise.all([
      this.getOrCreateRating(match.playerAId, orgId, gameType),
      this.getOrCreateRating(match.playerBId, orgId, gameType),
    ]);

    // Calculate match scores
    const score = this.getMatchScore(match.result);

    // Update ratings using Glicko-2
    const newRatingA = this.glicko2.updateRating(
      {
        rating: ratingA.rating,
        ratingDeviation: ratingA.ratingDeviation,
        volatility: ratingA.volatility,
      },
      [
        {
          opponentRating: ratingB.rating,
          opponentRD: ratingB.ratingDeviation,
          score: score.playerA,
        },
      ],
    );

    const newRatingB = this.glicko2.updateRating(
      {
        rating: ratingB.rating,
        ratingDeviation: ratingB.ratingDeviation,
        volatility: ratingB.volatility,
      },
      [
        {
          opponentRating: ratingA.rating,
          opponentRD: ratingA.ratingDeviation,
          score: score.playerB,
        },
      ],
    );

    // Update database
    await this.prisma.$transaction([
      // Update player A rating
      this.prisma.playerRating.update({
        where: { id: ratingA.id },
        data: {
          rating: newRatingA.rating,
          ratingDeviation: newRatingA.ratingDeviation,
          volatility: newRatingA.volatility,
          matchesPlayed: { increment: 1 },
          matchWins: score.playerA === 1 ? { increment: 1 } : undefined,
          matchLosses: score.playerA === 0 ? { increment: 1 } : undefined,
          matchDraws: score.playerA === 0.5 ? { increment: 1 } : undefined,
          lastMatchAt: new Date(),
          lastUpdatedAt: new Date(),
          isProvisional: ratingA.matchesPlayed + 1 < 30,
        },
      }),

      // Update player B rating
      this.prisma.playerRating.update({
        where: { id: ratingB.id },
        data: {
          rating: newRatingB.rating,
          ratingDeviation: newRatingB.ratingDeviation,
          volatility: newRatingB.volatility,
          matchesPlayed: { increment: 1 },
          matchWins: score.playerB === 1 ? { increment: 1 } : undefined,
          matchLosses: score.playerB === 0 ? { increment: 1 } : undefined,
          matchDraws: score.playerB === 0.5 ? { increment: 1 } : undefined,
          lastMatchAt: new Date(),
          lastUpdatedAt: new Date(),
          isProvisional: ratingB.matchesPlayed + 1 < 30,
        },
      }),

      // Create history for player A
      this.prisma.playerRatingHistory.create({
        data: {
          playerRatingId: ratingA.id,
          eventId: match.round.eventId,
          matchId: match.id,
          ratingBefore: ratingA.rating,
          ratingAfter: newRatingA.rating,
          ratingChange: newRatingA.rating - ratingA.rating,
          rdBefore: ratingA.ratingDeviation,
          rdAfter: newRatingA.ratingDeviation,
          volatilityBefore: ratingA.volatility,
          volatilityAfter: newRatingA.volatility,
          opponentId: match.playerBId,
          opponentRatingBefore: ratingB.rating,
          matchResult: match.result,
        },
      }),

      // Create history for player B
      this.prisma.playerRatingHistory.create({
        data: {
          playerRatingId: ratingB.id,
          eventId: match.round.eventId,
          matchId: match.id,
          ratingBefore: ratingB.rating,
          ratingAfter: newRatingB.rating,
          ratingChange: newRatingB.rating - ratingB.rating,
          rdBefore: ratingB.ratingDeviation,
          rdAfter: newRatingB.ratingDeviation,
          volatilityBefore: ratingB.volatility,
          volatilityAfter: newRatingB.volatility,
          opponentId: match.playerAId,
          opponentRatingBefore: ratingA.rating,
          matchResult: this.invertMatchResult(match.result),
        },
      }),
    ]);

    this.logger.log(
      `Updated ratings for match ${matchId}: ` +
      `${ratingA.rating.toFixed(0)} → ${newRatingA.rating.toFixed(0)} (Player A), ` +
      `${ratingB.rating.toFixed(0)} → ${newRatingB.rating.toFixed(0)} (Player B)`,
    );
  }

  /**
   * Get leaderboard for organization
   */
  async getLeaderboard(
    orgId: string,
    gameType: GameType,
    limit: number = 100,
  ) {
    return this.prisma.playerRating.findMany({
      where: { orgId, gameType },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
      take: limit,
    });
  }

  /**
   * Get player rating history
   */
  async getPlayerHistory(userId: string, orgId: string, gameType: GameType) {
    const rating = await this.prisma.playerRating.findUnique({
      where: {
        userId_orgId_gameType: { userId, orgId, gameType },
      },
      include: {
        history: {
          orderBy: { calculatedAt: 'desc' },
          take: 50,
          include: {
            opponent: {
              select: {
                id: true,
                name: true,
              },
            },
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return rating;
  }

  private getMatchScore(result: MatchResult): { playerA: number; playerB: number } {
    switch (result) {
      case 'PLAYER_A_WIN':
        return { playerA: 1, playerB: 0 };
      case 'PLAYER_B_WIN':
        return { playerA: 0, playerB: 1 };
      case 'DRAW':
      case 'INTENTIONAL_DRAW':
      case 'DOUBLE_LOSS':
        return { playerA: 0.5, playerB: 0.5 };
      case 'PLAYER_A_DQ':
        return { playerA: 0, playerB: 1 };
      case 'PLAYER_B_DQ':
        return { playerA: 1, playerB: 0 };
      default:
        return { playerA: 0.5, playerB: 0.5 };
    }
  }

  private invertMatchResult(result: MatchResult): MatchResult {
    switch (result) {
      case 'PLAYER_A_WIN':
        return 'PLAYER_B_WIN';
      case 'PLAYER_B_WIN':
        return 'PLAYER_A_WIN';
      case 'PLAYER_A_DQ':
        return 'PLAYER_B_DQ';
      case 'PLAYER_B_DQ':
        return 'PLAYER_A_DQ';
      default:
        return result; // DRAW, INTENTIONAL_DRAW, DOUBLE_LOSS stay same
    }
  }
}
```

---

## Part 6: Wire Rating Updates into Match Flow

### File: `apps/backend/src/matches/matches.service.ts`

Update the `reportMatchResult()` method to trigger rating updates:

```typescript
import { RatingsService } from '../ratings/ratings.service';

// In constructor:
constructor(
  private prisma: PrismaService,
  // ... other services ...
  private ratingsService: RatingsService, // Add this
) {}

// After reporting match result:
async reportMatchResult(dto: ReportMatchResultDto, reportedBy: string, userOrgId: string) {
  // ... existing validation and match update ...

  // Update match result
  const match = await this.prisma.match.update({
    where: { id: dto.matchId },
    data: {
      result: dto.result,
      gamesWonA: dto.gamesWonA,
      gamesWonB: dto.gamesWonB,
      reportedBy,
      reportedAt: new Date(),
    },
  });

  // **NEW**: Update player ratings asynchronously
  // Don't await to avoid blocking the response
  this.ratingsService
    .updateRatingsForMatch(match.id)
    .catch((err) => this.logger.error(`Failed to update ratings: ${err.message}`));

  return match;
}
```

---

## Part 7: API Endpoints for Leaderboard

### File: `apps/backend/src/ratings/ratings.controller.ts` (NEW)

```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import type { GameType } from '@prisma/client';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @Get('leaderboard')
  async getLeaderboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('gameType') gameType: GameType,
    @Query('limit') limit?: string,
  ) {
    return this.ratingsService.getLeaderboard(
      user.orgId,
      gameType || 'ONE_PIECE_TCG',
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('player/:userId')
  async getPlayerRating(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
    @Query('gameType') gameType: GameType,
  ) {
    return this.ratingsService.getPlayerHistory(
      userId,
      user.orgId,
      gameType || 'ONE_PIECE_TCG',
    );
  }

  @Get('me')
  async getMyRating(
    @CurrentUser() user: AuthenticatedUser,
    @Query('gameType') gameType: GameType,
  ) {
    return this.ratingsService.getPlayerHistory(
      user.id,
      user.orgId,
      gameType || 'ONE_PIECE_TCG',
    );
  }
}
```

---

## Part 8: Test the Implementation

### Run migrations

```bash
cd apps/backend
npx prisma migrate dev --name add_rating_system
npx prisma generate
npm run build
```

### Test welcome bonus

1. Sign up a new player
2. Check their credit balance - should be 10 credits
3. Check transaction history - should see PROMO entry

### Test rating system

1. Create a tournament
2. Report match results
3. Check `/ratings/leaderboard` endpoint
4. Check individual player ratings

---

## Summary

This implementation guide provides:

1. ✅ Complete Prisma schema for ELO/rating system
2. ✅ Full Glicko-2 algorithm implementation
3. ✅ Welcome bonus promo system
4. ✅ Players tab removal instructions
5. ✅ Rating service with database integration
6. ✅ API endpoints for leaderboard
7. ✅ Match result integration

**Next Steps:**
1. Apply schema changes
2. Run migrations
3. Implement the services
4. Add UI components for leaderboard
5. Test thoroughly

For the UI components (leaderboard display, player profiles, rating graphs), I can provide those next once the backend is working!
