import { Module, forwardRef } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RatingsModule } from '../ratings/ratings.module';

@Module({
  imports: [
    RealtimeModule,
    NotificationsModule,
    forwardRef(() => RatingsModule),
  ],
  controllers: [RoundsController],
  providers: [RoundsService],
  exports: [RoundsService],
})
export class RoundsModule {}
