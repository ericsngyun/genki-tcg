import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { EventStatus } from '@prisma/client';
import { CreateEventDto, UpdateEventDto } from './dto';

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

  async getEvent(eventId: string, userOrgId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                // Never expose passwordHash, avatarUrl, or other sensitive fields
              },
            },
          },
        },
        rounds: {
          orderBy: {
            roundNumber: 'asc',
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization access
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    return event;
  }

  async registerForEvent(eventId: string, userId: string, userOrgId: string) {
    // Validate event belongs to user's org
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Cannot register for events in other organizations');
    }

    // Check for duplicate registration
    const existingEntry = await this.prisma.entry.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Already registered for this event');
    }

    return this.prisma.entry.create({
      data: {
        eventId,
        userId,
      },
    });
  }

  async checkIn(entryId: string, userOrgId: string) {
    // Get entry with event details
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Validate organization
    if (entry.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if payment is required and has been made
    const requiresPayment = entry.event.entryFeeCents && entry.event.entryFeeCents > 0;
    if (requiresPayment && !entry.paidAt) {
      throw new BadRequestException('Player must pay entry fee before check-in');
    }

    return this.prisma.entry.update({
      where: { id: entryId },
      data: {
        checkedInAt: new Date(),
      },
    });
  }

  async markAsPaid(entryId: string, confirmedBy: string, userOrgId: string, amount?: number) {
    // Get entry with event details
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Validate organization
    if (entry.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied');
    }

    const requiredAmount = entry.event.entryFeeCents;
    const paidAmount = amount ?? requiredAmount ?? 0;

    // Validate payment amount
    if (requiredAmount && paidAmount < requiredAmount) {
      throw new BadRequestException(
        `Payment amount ($${(paidAmount/100).toFixed(2)}) is less than required entry fee ($${(requiredAmount/100).toFixed(2)})`
      );
    }

    // Use atomic updateMany to prevent race condition
    const updated = await this.prisma.entry.updateMany({
      where: {
        id: entryId,
        paidAt: null, // Only update if not already paid
      },
      data: {
        paidAt: new Date(),
        paidAmount,
        paidBy: confirmedBy,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException('Entry already paid or not found');
    }

    return this.prisma.entry.findUnique({ where: { id: entryId } });
  }

  async distributePrizes(
    eventId: string,
    distributions: Array<{ userId: string; amount: number; placement: number }>,
    distributedBy: string,
    userOrgId: string,
  ) {
    // Check if event exists and prizes haven't been distributed
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization access
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    if (event.prizesDistributed) {
      throw new BadRequestException('Prizes have already been distributed for this event');
    }

    // Validate all recipients are participants in the event
    const participantUserIds = new Set(event.entries.map(e => e.userId));
    const invalidRecipients = distributions.filter(d => !participantUserIds.has(d.userId));
    if (invalidRecipients.length > 0) {
      throw new BadRequestException('Some prize recipients are not participants in this event');
    }

    // Validate all amounts are positive
    const invalidAmounts = distributions.filter(d => d.amount <= 0);
    if (invalidAmounts.length > 0) {
      throw new BadRequestException('Prize amounts must be positive');
    }

    // Validate total distribution doesn't exceed totalPrizeCredits
    const totalDistributed = distributions.reduce((sum, d) => sum + d.amount, 0);
    if (event.totalPrizeCredits && totalDistributed > event.totalPrizeCredits) {
      throw new BadRequestException(
        `Total prize distribution ($${(totalDistributed/100).toFixed(2)}) exceeds event prize pool ($${(event.totalPrizeCredits/100).toFixed(2)})`
      );
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

  async dropPlayer(entryId: string, userOrgId: string, currentRound?: number) {
    // Get entry with event details
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: { event: true },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Validate organization
    if (entry.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.entry.update({
      where: { id: entryId },
      data: {
        droppedAt: new Date(),
        droppedAfterRound: currentRound,
      },
    });
  }

  async updateEvent(eventId: string, userOrgId: string, dto: UpdateEventDto) {
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

    // Only allow editing if event hasn't started or completed
    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      throw new BadRequestException('Cannot edit completed or cancelled events');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: dto,
    });
  }

  async addLatePlayer(eventId: string, userId: string, userOrgId: string) {
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

    // Check if player is already registered
    const existingEntry = await this.prisma.entry.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Player already registered');
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

  async selfCheckIn(eventId: string, userId: string, userOrgId: string) {
    // Validate event exists and user has access
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Cannot check in to events in other organizations');
    }

    // Find the user's entry
    const entry = await this.prisma.entry.findFirst({
      where: {
        eventId,
        userId,
      },
      include: {
        event: true,
      },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found - you are not registered for this event');
    }

    if (entry.checkedInAt) {
      throw new BadRequestException('Already checked in');
    }

    if (entry.droppedAt) {
      throw new BadRequestException('Cannot check in - you have dropped from this event');
    }

    // Check if payment is required
    const requiresPayment = entry.event.entryFeeCents && entry.event.entryFeeCents > 0;
    if (requiresPayment && !entry.paidAt) {
      throw new BadRequestException('You must pay the entry fee before checking in');
    }

    return this.prisma.entry.update({
      where: { id: entry.id },
      data: {
        checkedInAt: new Date(),
      },
    });
  }

  async getMyMatches(eventId: string, userId: string, userOrgId: string) {
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
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Cannot view matches for events in other organizations');
    }

    // Flatten matches from all rounds
    const matches = event.rounds.flatMap((round) => round.matches);

    return matches;
  }

  /**
   * Get player's active match for the current/latest round
   */
  async getMyActiveMatch(eventId: string, userId: string, userOrgId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rounds: {
          where: {
            status: 'ACTIVE',
          },
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
              },
            },
          },
          orderBy: {
            roundNumber: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Cannot view matches for events in other organizations');
    }

    // Check if there's an active round with a match for this player
    if (event.rounds.length === 0 || event.rounds[0].matches.length === 0) {
      return null; // No active match
    }

    const round = event.rounds[0];
    const match = round.matches[0];

    // Determine if user is playerA or playerB
    const iAmPlayerA = match.playerAId === userId;

    return {
      match: {
        id: match.id,
        roundId: round.id,
        roundNumber: round.roundNumber,
        tableNumber: match.tableNumber,
        opponent: iAmPlayerA ? match.playerB : match.playerA,
        result: match.result,
        gamesWonA: match.gamesWonA,
        gamesWonB: match.gamesWonB,
        reportedBy: match.reportedBy,
        confirmedBy: match.confirmedBy,
        iAmPlayerA,
      },
    };
  }

  /**
   * Player drops themselves from the tournament
   */
  async playerDrop(eventId: string, userId: string, userOrgId: string, currentRound?: number) {
    // Validate event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Cannot drop from events in other organizations');
    }

    // Find the user's entry
    const entry = await this.prisma.entry.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found - you are not registered for this event');
    }

    if (entry.droppedAt) {
      throw new BadRequestException('You have already dropped from this event');
    }

    return this.prisma.entry.update({
      where: { id: entry.id },
      data: {
        droppedAt: new Date(),
        droppedAfterRound: currentRound ?? event.currentRound,
      },
    });
  }
}
