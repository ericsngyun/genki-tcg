import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EventsService, CreateEventDto, UpdateEventDto } from './events.service';
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

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async updateEvent(@Param('id') eventId: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.updateEvent(eventId, dto);
  }

  @Post(':id/register')
  async register(@CurrentUser() user: any, @Param('id') eventId: string) {
    return this.eventsService.registerForEvent(eventId, user.id);
  }

  @Post(':id/self-check-in')
  async selfCheckIn(@CurrentUser() user: any, @Param('id') eventId: string) {
    return this.eventsService.selfCheckIn(eventId, user.id);
  }

  @Post('entries/:entryId/check-in')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async checkIn(@Param('entryId') entryId: string) {
    return this.eventsService.checkIn(entryId);
  }

  @Post(':id/add-late-player')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async addLatePlayer(@Param('id') eventId: string, @Body() dto: { userId: string }) {
    return this.eventsService.addLatePlayer(eventId, dto.userId);
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

  @Get(':id/my-matches')
  async getMyMatches(@CurrentUser() user: any, @Param('id') eventId: string) {
    return this.eventsService.getMyMatches(eventId, user.id);
  }
}
