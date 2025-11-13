import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface SubmitDecklistDto {
  entryId: string;
  deckName?: string;
  mainDeckUrl?: string;
  mainDeckJson?: Prisma.InputJsonValue;
}

@Injectable()
export class DecklistsService {
  constructor(private prisma: PrismaService) {}

  async submitDecklist(userId: string, userOrgId: string, dto: SubmitDecklistDto) {
    // Verify the entry belongs to the user
    const entry = await this.prisma.entry.findUnique({
      where: { id: dto.entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Validate organization
    if (entry.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException('This entry does not belong to you');
    }

    if (entry.event.status !== 'SCHEDULED') {
      throw new BadRequestException('Cannot submit decklist after event has started');
    }

    // Check if decklist already exists and is locked
    const existingDecklist = await this.prisma.decklist.findUnique({
      where: { entryId: dto.entryId },
    });

    if (existingDecklist?.lockedAt) {
      throw new BadRequestException('Decklist is locked and cannot be modified');
    }

    // Create or update decklist
    return this.prisma.decklist.upsert({
      where: { entryId: dto.entryId },
      create: {
        entryId: dto.entryId,
        userId,
        deckName: dto.deckName,
        mainDeckUrl: dto.mainDeckUrl,
        mainDeckJson: dto.mainDeckJson ?? Prisma.JsonNull,
      },
      update: {
        deckName: dto.deckName,
        mainDeckUrl: dto.mainDeckUrl,
        mainDeckJson: dto.mainDeckJson ?? Prisma.JsonNull,
        updatedAt: new Date(),
      },
    });
  }

  async getMyDecklist(userId: string, userOrgId: string, entryId: string) {
    const decklist = await this.prisma.decklist.findUnique({
      where: { entryId },
      include: {
        entry: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!decklist) {
      return null;
    }

    // Validate organization
    if (decklist.entry.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (decklist.userId !== userId) {
      throw new ForbiddenException('This decklist does not belong to you');
    }

    return decklist;
  }

  async getDecklistsForEvent(eventId: string, userOrgId: string) {
    // Validate event exists and user has access
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    return this.prisma.decklist.findMany({
      where: {
        entry: {
          eventId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        entry: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async lockDecklist(entryId: string, userOrgId: string) {
    // Get decklist with entry and event to validate organization
    const decklist = await this.prisma.decklist.findUnique({
      where: { entryId },
      include: {
        entry: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!decklist) {
      throw new NotFoundException('Decklist not found');
    }

    // Validate organization
    if (decklist.entry.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this decklist');
    }

    return this.prisma.decklist.update({
      where: { entryId },
      data: {
        lockedAt: new Date(),
      },
    });
  }

  async lockAllDecklists(eventId: string, userOrgId: string) {
    // Validate event exists and user has access
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    const entries = await this.prisma.entry.findMany({
      where: { eventId },
      select: { id: true },
    });

    const entryIds = entries.map((e) => e.id);

    await this.prisma.decklist.updateMany({
      where: {
        entryId: { in: entryIds },
        lockedAt: null,
      },
      data: {
        lockedAt: new Date(),
      },
    });

    return { locked: entryIds.length };
  }
}
