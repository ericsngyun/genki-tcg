import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsScheduler } from './events.scheduler';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService, EventsScheduler],
  exports: [EventsService],
})
export class EventsModule {}
