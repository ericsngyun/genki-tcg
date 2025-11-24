import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { RatingsModule } from '../ratings/ratings.module';

@Module({
  imports: [RealtimeModule, RatingsModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
