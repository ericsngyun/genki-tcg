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
  totalPrizeCredits?: number;
}

export interface UpdateEventDto {
  name?: string;
  description?: string;
  startAt?: Date;
  maxPlayers?: number;
  entryFeeCents?: number;
  totalPrizeCredits?: number;
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
    // Get entry with event details
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    // Check if payment is required and has been made
    const requiresPayment = entry.event.entryFeeCents && entry.event.entryFeeCents > 0;
    if (requiresPayment && !entry.paidAt) {
      throw new Error('Player must pay entry fee before check-in');
    }

    return this.prisma.entry.update({
      where: { id: entryId },
      data: {
        checkedInAt: new Date(),
      },
    });
  }

  async markAsPaid(entryId: string, confirmedBy: string, amount?: number) {
    // Get entry with event details
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new Error('Entry not found');
    }

    if (entry.paidAt) {
      throw new Error('Entry has already been marked as paid');
    }

    // Use event entry fee if no amount specified
    const paidAmount = amount ?? entry.event.entryFeeCents ?? 0;

    return this.prisma.entry.update({
      where: { id: entryId },
      data: {
        paidAt: new Date(),
        paidAmount,
        paidBy: confirmedBy,
      },
    });
  }

  async distributePrizes(
    eventId: string,
    distributions: Array<{ userId: string; amount: number; placement: number }>,
    distributedBy: string,
  ) {
    // Check if event exists and prizes haven't been distributed
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.prizesDistributed) {
      throw new Error('Prizes have already been distributed for this event');
    }

    // Use transaction to ensure all distributions succeed or none do
    return this.prisma.$transaction(async (tx) => {
      // Create credit ledger entries for each distribution
      const ledgerEntries = await Promise.all(
        distributions.map((dist) =>
          tx.creditLedgerEntry.create({
            data: {
              orgId: event.orgId,
              userId: dist.userId,
              amount: dist.amount,
              reasonCode: 'PRIZE',
              memo: `Tournament prize - ${event.name} (Placement: ${dist.placement})`,
              relatedEventId: eventId,
              createdBy: distributedBy,
            },
          }),
        ),
      );

      // Update or create credit balances
      await Promise.all(
        distributions.map((dist) =>
          tx.creditBalance.upsert({
            where: {
              orgId_userId: {
                orgId: event.orgId,
                userId: dist.userId,
              },
            },
            create: {
              orgId: event.orgId,
              userId: dist.userId,
              balance: dist.amount,
              lastTransactionAt: new Date(),
            },
            update: {
              balance: {
                increment: dist.amount,
              },
              lastTransactionAt: new Date(),
            },
          }),
        ),
      );

      // Mark event prizes as distributed
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          prizesDistributed: true,
          prizesDistributedAt: new Date(),
          prizesDistributedBy: distributedBy,
        },
      });

      return {
        event: updatedEvent,
        distributions: ledgerEntries,
      };
    });
  }

  async dropPlayer(entryId: string, currentRound?: number) {
    return this.prisma.entry.update({
      where: { id: entryId },
      data: {
        droppedAt: new Date(),
        droppedAfterRound: currentRound,
      },
    });
  }

  async updateEvent(eventId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Only allow editing if event hasn't started or completed
    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      throw new Error('Cannot edit completed or cancelled events');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: dto,
    });
  }

  async addLatePlayer(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Check if player is already registered
    const existingEntry = await this.prisma.entry.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (existingEntry) {
      throw new Error('Player already registered');
    }

    // Create entry and auto-check-in
    return this.prisma.entry.create({
      data: {
        eventId,
        userId,
        checkedInAt: new Date(), // Auto check-in for late adds
      },
    });
  }

  async selfCheckIn(eventId: string, userId: string) {
    // Find the user's entry
    const entry = await this.prisma.entry.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!entry) {
      throw new Error('Entry not found - you are not registered for this event');
    }

    if (entry.checkedInAt) {
      throw new Error('Already checked in');
    }

    if (entry.droppedAt) {
      throw new Error('Cannot check in - you have dropped from this event');
    }

    return this.prisma.entry.update({
      where: { id: entry.id },
      data: {
        checkedInAt: new Date(),
      },
    });
  }

  async getMyMatches(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rounds: {
          include: {
            matches: {
              where: {
                OR: [{ playerAId: userId }, { playerBId: userId }],
              },
              include: {
                playerA: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                playerB: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                round: {
                  select: {
                    roundNumber: true,
                  },
                },
              },
            },
          },
          orderBy: {
            roundNumber: 'asc',
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Flatten matches from all rounds
    const matches = event.rounds.flatMap((round) => round.matches);

    return matches;
  }
}
