import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService, CreateEventDto } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  async getEvents(@CurrentUser() user: any, @Query('status') status?: any) {
    return this.eventsService.getEvents(user.orgId, status);
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    return this.eventsService.getEvent(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async createEvent(@CurrentUser() user: any, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(user.orgId, user.id, dto);
  }

  @Post(':id/register')
  async register(@CurrentUser() user: any, @Param('id') eventId: string) {
    return this.eventsService.registerForEvent(eventId, user.id);
  }

  @Post('entries/:entryId/check-in')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async checkIn(@Param('entryId') entryId: string) {
    return this.eventsService.checkIn(entryId);
  }

  @Post(':id/distribute-prizes')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async distributePrizes(
    @Param('id') eventId: string,
    @Body() dto: { distributions: Array<{ userId: string; amount: number; placement: number }> },
    @CurrentUser() user: any,
  ) {
    return this.eventsService.distributePrizes(eventId, dto.distributions, user.id);
  }

  @Post('entries/:entryId/drop')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async dropPlayer(@Param('entryId') entryId: string, @Body() body: { currentRound?: number }) {
    return this.eventsService.dropPlayer(entryId, body.currentRound);
  }
}
