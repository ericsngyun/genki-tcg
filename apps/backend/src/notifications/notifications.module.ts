import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // Enable cron jobs
    RealtimeModule, // For WebSocket notifications
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
