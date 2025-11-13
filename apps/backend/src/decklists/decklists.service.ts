import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SubmitDecklistDto {
  entryId: string;
  deckName?: string;
  mainDeckUrl?: string;
  mainDeckJson?: Record<string, unknown>;
}

@Injectable()
export class DecklistsService {
  constructor(private prisma: PrismaService) {}

  async submitDecklist(userId: string, dto: SubmitDecklistDto) {
    // Verify the entry belongs to the user
    const entry = await this.prisma.entry.findUnique({
      where: { id: dto.entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    if (entry.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (entry.event.status !== 'SCHEDULED') {
      throw new Error('Cannot submit decklist after event has started');
    }

    // Check if decklist already exists and is locked
    const existingDecklist = await this.prisma.decklist.findUnique({
      where: { entryId: dto.entryId },
    });

    if (existingDecklist?.lockedAt) {
      throw new Error('Decklist is locked and cannot be modified');
    }

    // Create or update decklist
    return this.prisma.decklist.upsert({
      where: { entryId: dto.entryId },
      create: {
        entryId: dto.entryId,
        userId,
        deckName: dto.deckName,
        mainDeckUrl: dto.mainDeckUrl,
        mainDeckJson: dto.mainDeckJson || null,
      },
      update: {
        deckName: dto.deckName,
        mainDeckUrl: dto.mainDeckUrl,
        mainDeckJson: dto.mainDeckJson || null,
        updatedAt: new Date(),
      },
    });
  }

  async getMyDecklist(userId: string, entryId: string) {
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

    if (decklist.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return decklist;
  }

  async getDecklistsForEvent(eventId: string) {
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

  async lockDecklist(entryId: string) {
    return this.prisma.decklist.update({
      where: { entryId },
      data: {
        lockedAt: new Date(),
      },
    });
  }

  async lockAllDecklists(eventId: string) {
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
