import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { OrgsModule } from './orgs/orgs.module';
import { CreditsModule } from './credits/credits.module';
import { EventsModule } from './events/events.module';
import { RoundsModule } from './rounds/rounds.module';
import { MatchesModule } from './matches/matches.module';
import { StandingsModule } from './standings/standings.module';
import { DecklistsModule } from './decklists/decklists.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SeedModule } from './seed/seed.module';
import { RatingsModule } from './ratings/ratings.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { SentryModule } from './sentry/sentry.module';
import { SentryModule as SentryNestModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    // Sentry error tracking (must be first)
    SentryNestModule.forRoot(),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '../../.env',      // From apps/backend when running with npm run dev
        '../../../.env',   // From apps/backend/src if needed
        '.env',            // Current directory fallback
      ],
    }),

    // Rate limiting - configurable via environment
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ([
        {
          ttl: parseInt(config.get('THROTTLE_TTL', '60000'), 10),
          limit: parseInt(config.get('THROTTLE_LIMIT', '100'), 10),
        },
      ]),
    }),

    // Core modules
    PrismaModule,
    HealthModule,
    AuthModule,
    OrgsModule,
    CreditsModule,
    EventsModule,
    RoundsModule,
    MatchesModule,
    StandingsModule,
    DecklistsModule,
    NotificationsModule,
    AuditModule,
    RealtimeModule,
    SeedModule,
    RatingsModule,
    LeaderboardModule,
    SentryModule,
  ],
  providers: [
    // SECURITY: Enable global rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
