import { Module } from '@nestjs/common';
import { DecklistsController } from './decklists.controller';
import { DecklistsService } from './decklists.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DecklistsController],
  providers: [DecklistsService],
  exports: [DecklistsService],
})
export class DecklistsModule {}
