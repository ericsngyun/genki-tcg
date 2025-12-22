import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsScheduler } from './events.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [NotificationsModule, RealtimeModule],
  controllers: [EventsController],
  providers: [EventsService, EventsScheduler],
  exports: [EventsService],
})
export class EventsModule {}
