import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SeasonsService } from './seasons.service';

@Module({
  imports: [PrismaModule],
  providers: [RatingsService, SeasonsService],
  controllers: [RatingsController],
  exports: [RatingsService, SeasonsService],
})
export class RatingsModule { }
