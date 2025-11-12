import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrgsModule } from './orgs/orgs.module';
import { CreditsModule } from './credits/credits.module';
import { EventsModule } from './events/events.module';
import { RoundsModule } from './rounds/rounds.module';
import { StandingsModule } from './standings/standings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../../.env',
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
    AuthModule,
    OrgsModule,
    CreditsModule,
    EventsModule,
    RoundsModule,
    StandingsModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
