import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { EventStatus, GameType, EventFormat } from '@prisma/client';

export interface CreateEventDto {
  name: string;
  game: GameType;
  format: EventFormat;
  startAt: Date;
  maxPlayers?: number;
  entryFeeCents?: number;
  requiresDecklist?: boolean;
  description?: string;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(orgId: string, createdBy: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        orgId,
        createdBy,
        status: 'SCHEDULED',
      },
    });
  }

  async getEvents(orgId: string, status?: EventStatus) {
    return this.prisma.event.findMany({
      where: {
        orgId,
        ...(status && { status }),
      },
      orderBy: {
        startAt: 'desc',
      },
      include: {
        _count: {
          select: {
            entries: true,
          },
        },
      },
    });
  }

  async getEvent(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          include: {
            user: true,
          },
        },
        rounds: {
          orderBy: {
            roundNumber: 'asc',
          },
        },
      },
    });
  }

  async registerForEvent(eventId: string, userId: string) {
    return this.prisma.entry.create({
      data: {
        eventId,
        userId,
      },
    });
  }

  async checkIn(entryId: string) {
    return this.prisma.entry.update({
      where: { id: entryId },
      data: {
        checkedInAt: new Date(),
      },
    });
  }
}
