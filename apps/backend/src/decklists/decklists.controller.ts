import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DecklistsService, SubmitDecklistDto } from './decklists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('decklists')
@UseGuards(JwtAuthGuard)
export class DecklistsController {
  constructor(private decklistsService: DecklistsService) {}

  @Post()
  async submitDecklist(
    @CurrentUser() user: any,
    @Body() dto: SubmitDecklistDto,
  ) {
    return this.decklistsService.submitDecklist(user.id, user.orgId, dto);
  }

  @Get('entry/:entryId')
  async getMyDecklist(
    @CurrentUser() user: any,
    @Param('entryId') entryId: string,
  ) {
    return this.decklistsService.getMyDecklist(user.id, user.orgId, entryId);
  }

  @Get('event/:eventId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getDecklistsForEvent(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.decklistsService.getDecklistsForEvent(eventId, user.orgId);
  }

  @Post('entry/:entryId/lock')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async lockDecklist(@CurrentUser() user: any, @Param('entryId') entryId: string) {
    return this.decklistsService.lockDecklist(entryId, user.orgId);
  }

  @Post('event/:eventId/lock-all')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async lockAllDecklists(@CurrentUser() user: any, @Param('eventId') eventId: string) {
    return this.decklistsService.lockAllDecklists(eventId, user.orgId);
  }
}
