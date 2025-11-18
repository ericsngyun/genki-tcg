import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

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

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '../../.env',      // From apps/backend when running with npm run dev
        '../../../.env',   // From apps/backend/src if needed
        '.env',            // Current directory fallback
      ],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

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
  ],
})
export class AppModule {}
