import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { EventStatus } from '@prisma/client';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { CreateEventDto, UpdateEventDto } from './dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private realtimeGateway: RealtimeGateway,
  ) { }

  async createEvent(orgId: string, createdBy: string, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        orgId,
        createdBy,
        status: 'SCHEDULED',
      },
    });

    // Notify all org members about new event (non-blocking)
    this.notificationsService.notifyAdmins(orgId, {
      type: NotificationType.EVENT_PUBLISHED,
      priority: NotificationPriority.HIGH,
      title: 'New Event Published',
      body: `${event.name} is now open for registration`,
      eventId: event.id,
    }).catch(err => this.logger.error('Failed to send event published notification:', err));

    return event;
  }

  async getEvents(orgId: string, status?: EventStatus, userId?: string) {
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
        // Include the current user's entry to check registration status
        entries: userId ? {
          where: {
            userId,
          },
          select: {
            userId: true,
            checkedInAt: true,
            paidAt: true,
            droppedAt: true,
          },
        } : false,
      },
    });
  }

  async getEvent(eventId: string, userOrgId: string) {
    try {
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
                  avatarUrl: true,
                  // Never expose passwordHash or other sensitive fields
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
    } catch (error: any) {
      // Re-throw known NestJS exceptions
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      // Log unexpected errors for debugging
      this.logger.error(`Failed to get event ${eventId}:`, error);
      throw new BadRequestException(`Failed to load event: ${error?.message || 'Unknown error'}`);
    }
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

    // Check event capacity if maxPlayers is set
    if (event.maxPlayers) {
      const currentEntryCount = await this.prisma.entry.count({
        where: {
          eventId,
        },
      });

      if (currentEntryCount >= event.maxPlayers) {
        throw new BadRequestException('Event is at maximum capacity');
      }
    }

    const entry = await this.prisma.entry.create({
      data: {
        eventId,
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Notify admins about new player registration (non-blocking)
    this.notificationsService.notifyAdmins(userOrgId, {
      type: NotificationType.PLAYER_REGISTERED,
      priority: NotificationPriority.NORMAL,
      title: 'New Player Registered',
      body: `${entry.user.name} registered for ${event.name}`,
      eventId: event.id,
    }).catch(err => this.logger.error('Failed to send player registered notification:', err));

    return entry;
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

    // Validate payment amount is not negative
    if (paidAmount < 0) {
      throw new BadRequestException('Payment amount cannot be negative');
    }

    // Validate payment amount meets minimum requirement
    if (requiredAmount && paidAmount < requiredAmount) {
      throw new BadRequestException(
        `Payment amount ($${(paidAmount / 100).toFixed(2)}) is less than required entry fee ($${(requiredAmount / 100).toFixed(2)})`
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

    // Validate no duplicate placements
    const placements = distributions.map(d => d.placement);
    const uniquePlacements = new Set(placements);
    if (placements.length !== uniquePlacements.size) {
      throw new BadRequestException('Duplicate placements are not allowed');
    }

    // Validate total distribution doesn't exceed totalPrizeCredits
    const totalDistributed = distributions.reduce((sum, d) => sum + d.amount, 0);
    if (event.totalPrizeCredits && totalDistributed > event.totalPrizeCredits) {
      throw new BadRequestException(
        `Total prize distribution ($${(totalDistributed / 100).toFixed(2)}) exceeds event prize pool ($${(event.totalPrizeCredits / 100).toFixed(2)})`
      );
    }

    // Use transaction to ensure all distributions succeed or none do
    const result = await this.prisma.$transaction(async (tx) => {
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

    // Notify all prize winners (non-blocking)
    distributions.forEach(dist => {
      this.notificationsService.createAndSend({
        userId: dist.userId,
        orgId: userOrgId,
        type: NotificationType.PRIZES_DISTRIBUTED,
        priority: NotificationPriority.HIGH,
        title: 'Prize Won!',
        body: `You won $${(dist.amount / 100).toFixed(2)} for placing ${dist.placement} in ${event.name}`,
        eventId: event.id,
      }).catch(err => this.logger.error('Failed to send prize notification:', err));
    });

    // Also notify admins
    this.notificationsService.notifyAdmins(userOrgId, {
      type: NotificationType.PRIZES_DISTRIBUTED,
      priority: NotificationPriority.NORMAL,
      title: 'Prizes Distributed',
      body: `Prizes have been distributed for ${event.name}`,
      eventId: event.id,
    }).catch(err => this.logger.error('Failed to send prize distribution notification to admins:', err));

    return result;
  }

  async dropPlayer(entryId: string, userOrgId: string, currentRound?: number) {
    // Get entry with event details
    const entry = await this.prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        event: {
          include: {
            rounds: {
              where: {
                status: 'ACTIVE',
              },
              include: {
                matches: {
                  where: {
                    OR: [
                      { playerAId: '' }, // Will be replaced with actual userId
                      { playerBId: '' }, // Will be replaced with actual userId
                    ],
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    // Validate organization
    if (entry.event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied');
    }

    // Find any active matches involving this player
    const activeRound = entry.event.rounds.find(r => r.status === 'ACTIVE');
    if (activeRound) {
      const playerMatches = await this.prisma.match.findMany({
        where: {
          roundId: activeRound.id,
          OR: [
            { playerAId: entry.userId },
            { playerBId: entry.userId },
          ],
          result: null, // Only unreported matches
        },
      });

      // Auto-forfeit unreported matches for the dropped player
      for (const match of playerMatches) {
        const isPlayerA = match.playerAId === entry.userId;
        const result = isPlayerA ? 'PLAYER_B_DQ' : 'PLAYER_A_DQ';

        await this.prisma.match.update({
          where: { id: match.id },
          data: {
            result,
            gamesWonA: isPlayerA ? 0 : 2,
            gamesWonB: isPlayerA ? 2 : 0,
            reportedBy: 'SYSTEM_DROP',
            reportedAt: new Date(),
            confirmedBy: 'SYSTEM_DROP',
          },
        });

        this.logger.log(`Auto-forfeited match ${match.id} due to player drop`);
      }
    }

    const updatedEntry = await this.prisma.entry.update({
      where: { id: entryId },
      data: {
        droppedAt: new Date(),
        droppedAfterRound: currentRound,
      },
    });

    // Notify admins about player dropping (non-blocking)
    this.notificationsService.notifyAdmins(userOrgId, {
      type: NotificationType.PLAYER_DROPPED,
      priority: NotificationPriority.NORMAL,
      title: 'Player Dropped',
      body: `${entry.user.name} dropped from ${entry.event.name}`,
      eventId: entry.event.id,
    }).catch(err => this.logger.error('Failed to send player dropped notification:', err));

    // Emit standings updated since forfeited matches affect standings
    if (activeRound) {
      this.realtimeGateway.emitStandingsUpdated(entry.event.id);
    }

    return updatedEntry;
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

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: dto,
    });

    // Notify all registered players about event update (non-blocking)
    this.notificationsService.broadcastToEvent(eventId, {
      orgId: userOrgId,
      type: NotificationType.EVENT_UPDATED,
      priority: NotificationPriority.NORMAL,
      title: 'Event Updated',
      body: `${updatedEvent.name} details have been updated`,
      eventId: updatedEvent.id,
    }).catch(err => this.logger.error('Failed to send event updated notification:', err));

    return updatedEvent;
  }

  async addLatePlayer(eventId: string, userId: string, userOrgId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rounds: {
          orderBy: { roundNumber: 'desc' },
          take: 1,
        },
      },
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

    // Determine how many rounds the player has missed
    // Late player joins with phantom losses for all missed rounds
    const currentRoundNumber = event.rounds[0]?.roundNumber ?? 0;
    const missedRounds = currentRoundNumber > 0 ? currentRoundNumber : 0;

    // Create entry and auto-check-in
    // Track joinedAtRound so ratings can calculate phantom losses
    const entry = await this.prisma.entry.create({
      data: {
        eventId,
        userId,
        checkedInAt: new Date(), // Auto check-in for late adds
        joinedAtRound: currentRoundNumber + 1, // Will join in next round
      },
    });

    if (missedRounds > 0) {
      this.logger.log(
        `Late player ${userId} added to event ${eventId} at round ${currentRoundNumber + 1}. ` +
        `They missed ${missedRounds} round(s) and will receive phantom losses for ratings.`
      );
    }

    return entry;
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

    // Validate event status - can only check in to SCHEDULED events
    // Once tournament is IN_PROGRESS, check-in is closed
    if (event.status !== 'SCHEDULED') {
      if (event.status === 'IN_PROGRESS') {
        throw new BadRequestException('Check-in is closed - tournament has already started');
      } else if (event.status === 'COMPLETED') {
        throw new BadRequestException('Cannot check in - tournament has ended');
      } else if (event.status === 'CANCELLED') {
        throw new BadRequestException('Cannot check in - event has been cancelled');
      } else {
        throw new BadRequestException('Cannot check in at this time');
      }
    }

    // Validate check-in time window
    // Check-in opens 2 hours before event start time
    const now = new Date();
    const checkInWindowHours = 2;
    const checkInOpensAt = new Date(event.startAt.getTime() - checkInWindowHours * 60 * 60 * 1000);

    if (now < checkInOpensAt) {
      const minutesUntilOpen = Math.ceil((checkInOpensAt.getTime() - now.getTime()) / (60 * 1000));
      throw new BadRequestException(
        `Check-in opens ${checkInWindowHours} hours before the event starts. ` +
        `Please try again in ${minutesUntilOpen} minute(s).`
      );
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
   * Get player's active match for the current round
   * Only shows ACTIVE rounds (admin has started the round)
   * Players must view pairings for PENDING rounds
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

    // Determine opponent - handle both cases properly
    // If playerBId is null or undefined, it's a BYE (opponent is null)
    // Otherwise, show the other player
    let opponent = null;

    // Check if this is a BYE match (playerBId is null/undefined)
    // Also check if playerBId exists but is empty string (defensive check)
    if (!match.playerBId || match.playerBId === null || match.playerBId === undefined) {
      // This is a BYE match - no opponent
      opponent = null;
    } else {
      // Normal match - opponent is the other player
      if (iAmPlayerA) {
        // We're playerA, opponent is playerB
        opponent = match.playerB;
        // If relation didn't load but playerBId exists, fetch it
        if (!opponent && match.playerBId) {
          try {
            opponent = await this.prisma.user.findUnique({
              where: { id: match.playerBId },
              select: { id: true, name: true },
            });
          } catch (error) {
            // If user doesn't exist, treat as BYE
            this.logger.error(`Failed to fetch playerB with id ${match.playerBId}:`, error);
            opponent = null;
          }
        }
      } else {
        // We're playerB, opponent is playerA
        opponent = match.playerA;
        // PlayerA should always exist, but handle gracefully if not
        if (!opponent && match.playerAId) {
          try {
            opponent = await this.prisma.user.findUnique({
              where: { id: match.playerAId },
              select: { id: true, name: true },
            });
          } catch (error) {
            this.logger.error(`Failed to fetch playerA with id ${match.playerAId}:`, error);
            // PlayerA should always exist, but if not, we can't proceed
            throw new Error('Match data is invalid: playerA not found');
          }
        }
      }
    }

    return {
      match: {
        id: match.id,
        roundId: round.id,
        roundNumber: round.roundNumber,
        tableNumber: match.tableNumber,
        opponent,
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
   * Get player's tournament history
   * Returns completed events the player participated in with their results
   */
  async getMyTournamentHistory(userId: string, userOrgId: string, limit = 10, offset = 0) {
    const entries = await this.prisma.entry.findMany({
      where: {
        userId,
        event: {
          orgId: userOrgId,
          status: 'COMPLETED',
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            game: true,
            startAt: true,
            status: true,
          },
        },
      },
      orderBy: {
        event: {
          startAt: 'desc',
        },
      },
      take: limit,
      skip: offset,
    });

    // Get match statistics for each event
    const tournaments = await Promise.all(
      entries.map(async (entry) => {
        // Get all matches for this player in this event
        const matches = await this.prisma.match.findMany({
          where: {
            round: {
              eventId: entry.eventId,
            },
            OR: [{ playerAId: userId }, { playerBId: userId }],
            result: { not: null }, // Only completed matches have a result
          },
        });

        // Calculate wins, losses, draws
        let wins = 0;
        let losses = 0;
        let draws = 0;

        matches.forEach((match) => {
          if (match.result === 'DRAW' || match.result === 'INTENTIONAL_DRAW') {
            draws++;
          } else if (match.result === 'PLAYER_A_WIN' && match.playerAId === userId) {
            wins++;
          } else if (match.result === 'PLAYER_B_WIN' && match.playerBId === userId) {
            wins++;
          } else if (match.result === 'PLAYER_A_WIN' || match.result === 'PLAYER_B_WIN') {
            losses++;
          }
          // PLAYER_A_DQ, PLAYER_B_DQ, DOUBLE_LOSS don't count as wins/losses for records
        });

        // Get total number of players in the event
        const totalPlayers = await this.prisma.entry.count({
          where: { eventId: entry.eventId },
        });

        return {
          id: entry.event.id,
          name: entry.event.name,
          gameType: entry.event.game,
          date: entry.event.startAt,
          placement: entry.placement || undefined,
          totalPlayers,
          matchRecord: `${wins}-${losses}-${draws}`,
        };
      })
    );

    return { tournaments };
  }

  /**
   * Player drops themselves from the tournament
   * - For SCHEDULED events: Withdraws application (deletes entry)
   * - For IN_PROGRESS events: Drops from tournament (marks as dropped)
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
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found - you are not registered for this event');
    }

    if (entry.droppedAt) {
      throw new BadRequestException('You have already dropped from this event');
    }

    // SCHEDULED events: Withdraw application (delete entry)
    if (event.status === 'SCHEDULED') {
      // Check if player has checked in - cannot withdraw after check-in
      if (entry.checkedInAt) {
        throw new BadRequestException('Cannot withdraw after checking in. Please contact staff.');
      }

      // Delete the entry entirely for clean withdrawal
      await this.prisma.entry.delete({
        where: { id: entry.id },
      });

      // Notify admins about withdrawal
      this.notificationsService.notifyAdmins(userOrgId, {
        type: NotificationType.PLAYER_DROPPED,
        priority: NotificationPriority.NORMAL,
        title: 'Player Withdrew',
        body: `${entry.user.name} withdrew their application from ${event.name}`,
        eventId: event.id,
      }).catch(err => this.logger.error('Failed to send withdrawal notification:', err));

      // Return the deleted entry for confirmation
      return entry;
    }

    // IN_PROGRESS or other events: Mark as dropped (existing behavior)
    // Find any active matches involving this player and auto-forfeit them
    const activeRound = await this.prisma.round.findFirst({
      where: {
        eventId,
        status: 'ACTIVE',
      },
    });

    if (activeRound) {
      const playerMatches = await this.prisma.match.findMany({
        where: {
          roundId: activeRound.id,
          OR: [
            { playerAId: userId },
            { playerBId: userId },
          ],
          result: null, // Only unreported matches
        },
      });

      // Auto-forfeit unreported matches for the dropped player
      for (const match of playerMatches) {
        const isPlayerA = match.playerAId === userId;
        const result = isPlayerA ? 'PLAYER_B_DQ' : 'PLAYER_A_DQ';

        await this.prisma.match.update({
          where: { id: match.id },
          data: {
            result,
            gamesWonA: isPlayerA ? 0 : 2,
            gamesWonB: isPlayerA ? 2 : 0,
            reportedBy: 'SYSTEM_DROP',
            reportedAt: new Date(),
            confirmedBy: 'SYSTEM_DROP',
          },
        });

        this.logger.log(`Auto-forfeited match ${match.id} due to player self-drop`);
      }

      // Emit standings updated since forfeited matches affect standings
      this.realtimeGateway.emitStandingsUpdated(eventId);
    }

    const updatedEntry = await this.prisma.entry.update({
      where: { id: entry.id },
      data: {
        droppedAt: new Date(),
        droppedAfterRound: currentRound ?? event.currentRound,
      },
    });

    // Notify admins about player dropping (non-blocking)
    this.notificationsService.notifyAdmins(userOrgId, {
      type: NotificationType.PLAYER_DROPPED,
      priority: NotificationPriority.NORMAL,
      title: 'Player Dropped',
      body: `${entry.user.name} dropped from ${event.name}`,
      eventId: event.id,
    }).catch(err => this.logger.error('Failed to send player dropped notification:', err));

    return updatedEntry;
  }

  /**
   * Manually cancel an event
   */
  async cancelEvent(eventId: string, userOrgId: string, userId: string, reason?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate organization
    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied to this event');
    }

    // Cannot cancel already completed events
    if (event.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed event');
    }

    // Cannot cancel already cancelled events
    if (event.status === 'CANCELLED') {
      throw new BadRequestException('Event is already cancelled');
    }

    // Update event status to CANCELLED
    const cancelledEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'CANCELLED' },
    });

    // Notify all registered players
    if (event._count.entries > 0) {
      const notificationBody = reason
        ? `${event.name} has been cancelled. Reason: ${reason}`
        : `${event.name} has been cancelled`;

      this.notificationsService.broadcastToEvent(eventId, {
        orgId: event.orgId,
        type: NotificationType.EVENT_CANCELLED,
        priority: NotificationPriority.HIGH,
        title: 'Event Cancelled',
        body: notificationBody,
        eventId: event.id,
      }).catch(err => this.logger.error('Failed to broadcast event cancellation:', err));
    }

    // Notify admins about event cancellation (non-blocking)
    this.notificationsService.notifyAdmins(userOrgId, {
      type: NotificationType.EVENT_CANCELLED,
      priority: NotificationPriority.HIGH,
      title: 'Event Cancelled',
      body: reason ? `${event.name} has been cancelled: ${reason}` : `${event.name} has been cancelled`,
      eventId: event.id,
    }).catch(err => this.logger.error('Failed to send event cancelled notification to admins:', err));

    return cancelledEvent;
  }

  /**
   * Delete an event and all related data (OWNER only)
   * Use with caution - this permanently removes all tournament data
   */
  async deleteEvent(eventId: string, userOrgId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Access denied');
    }

    // Delete in transaction to ensure data consistency
    await this.prisma.$transaction(async (tx) => {
      // Delete credit ledger entries (prize distributions) for this event
      await tx.creditLedgerEntry.deleteMany({
        where: { relatedEventId: eventId },
      });

      // Delete rating history entries that reference matches from this event
      await tx.lifetimeRatingHistory.deleteMany({
        where: { eventId },
      });

      // Delete tournament rating updates
      await tx.tournamentRatingUpdate.deleteMany({
        where: { tournamentId: eventId },
      });

      // Delete standing snapshots
      await tx.standingSnapshot.deleteMany({
        where: { eventId },
      });

      // Delete matches (through rounds)
      const rounds = await tx.round.findMany({
        where: { eventId },
        select: { id: true },
      });
      const roundIds = rounds.map(r => r.id);

      if (roundIds.length > 0) {
        await tx.match.deleteMany({
          where: { roundId: { in: roundIds } },
        });
      }

      // Delete rounds
      await tx.round.deleteMany({
        where: { eventId },
      });

      // Delete entries
      await tx.entry.deleteMany({
        where: { eventId },
      });

      // Delete the event
      await tx.event.delete({
        where: { id: eventId },
      });
    });

    this.logger.log(`Event ${event.name} (${eventId}) deleted by owner`);

    return { success: true, deletedEvent: event.name };
  }

  /**
   * Auto-cancel scheduled events that are past their start time
   * Called by scheduled task (daily at 2 AM)
   */
  async cancelStaleScheduledEvents() {
    // Find events that are still scheduled but 6+ hours past start time
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const staleEvents = await this.prisma.event.findMany({
      where: {
        status: { in: ['SCHEDULED', 'REGISTRATION_CLOSED'] },
        startAt: { lt: sixHoursAgo },
      },
      include: {
        org: {
          select: { id: true, name: true },
        },
        _count: {
          select: { entries: true },
        },
      },
    });

    if (staleEvents.length === 0) {
      return { cancelledCount: 0, events: [] };
    }

    // Cancel all stale events and notify admins
    const cancelledEvents = await Promise.all(
      staleEvents.map(async (event) => {
        // Update event status to CANCELLED
        const updated = await this.prisma.event.update({
          where: { id: event.id },
          data: { status: 'CANCELLED' },
        });

        // Notify admins about auto-cancellation
        this.notificationsService.notifyAdmins(event.orgId, {
          type: NotificationType.EVENT_CANCELLED,
          priority: NotificationPriority.NORMAL,
          title: 'Event Auto-Cancelled',
          body: `${event.name} was automatically cancelled (missed start time by 6+ hours)`,
          eventId: event.id,
        }).catch(err => this.logger.error('Failed to send auto-cancel notification:', err));

        // If there were registered players, notify them too
        if (event._count.entries > 0) {
          this.notificationsService.broadcastToEvent(event.id, {
            orgId: event.orgId,
            type: NotificationType.EVENT_CANCELLED,
            priority: NotificationPriority.HIGH,
            title: 'Event Cancelled',
            body: `${event.name} has been cancelled`,
            eventId: event.id,
          }).catch(err => this.logger.error('Failed to broadcast event cancellation:', err));
        }

        return {
          id: event.id,
          name: event.name,
          startAt: event.startAt,
          entriesCount: event._count.entries,
        };
      })
    );

    return {
      cancelledCount: cancelledEvents.length,
      events: cancelledEvents,
    };
  }

  /**
   * Finalize tournament placements after tournament completion
   * Calculates final standings and updates Entry.placement for all players
   *
   * @param eventId - The event ID
   * @param userId - Staff user performing the finalization
   * @param userOrgId - Organization ID for authorization
   * @returns Final standings with placements
   *
   * @throws NotFoundException if event doesn't exist
   * @throws ForbiddenException if user doesn't have permission
   * @throws BadRequestException if tournament is not completed or placements already finalized
   */
  async finalizePlacements(eventId: string, userId: string, userOrgId: string) {
    // Validate event exists and belongs to org
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        rounds: {
          include: {
            matches: {
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
            roundNumber: 'asc',
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.orgId !== userOrgId) {
      throw new ForbiddenException('Not authorized to finalize placements for this event');
    }

    // Validate tournament is completed
    if (event.status !== 'COMPLETED') {
      throw new BadRequestException('Tournament must be COMPLETED before finalizing placements');
    }

    // Check if placements already finalized
    const existingPlacements = event.entries.filter(e => e.placement !== null);
    if (existingPlacements.length > 0) {
      this.logger.warn(`Event ${eventId} already has ${existingPlacements.length} placements set`);
      // Allow re-finalization to fix errors
    }

    // Collect all matches from all rounds
    const allMatches = event.rounds.flatMap(round => round.matches);

    // Build player names map
    const playerNames = new Map<string, string>();
    const playerIds: string[] = [];
    const droppedPlayers = new Set<string>();
    const droppedAfterRound = new Map<string, number>();

    for (const entry of event.entries) {
      playerIds.push(entry.userId);
      playerNames.set(entry.userId, entry.user.name);

      if (entry.droppedAt) {
        droppedPlayers.add(entry.userId);
        if (entry.droppedAfterRound !== null) {
          droppedAfterRound.set(entry.userId, entry.droppedAfterRound);
        }
      }
    }

    // Calculate total completed rounds
    const totalCompletedRounds = event.rounds.filter(r => r.status === 'COMPLETED').length;

    // Validate we have matches
    if (allMatches.length === 0) {
      throw new BadRequestException('Cannot finalize placements: No matches found in tournament');
    }

    // Validate all matches are reported
    const unreportedMatches = allMatches.filter(m => m.result === null);
    if (unreportedMatches.length > 0) {
      throw new BadRequestException(
        `Cannot finalize placements: ${unreportedMatches.length} match(es) not reported`
      );
    }

    // Calculate standings using tournament-logic package
    const { calculateStandings } = await import('@genki-tcg/tournament-logic');

    const standings = calculateStandings({
      playerIds,
      playerNames,
      matches: allMatches.map(m => ({
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        result: m.result,
        gamesWonA: m.gamesWonA || 0,
        gamesWonB: m.gamesWonB || 0,
      })),
      droppedPlayers,
      totalCompletedRounds,
      droppedAfterRound,
    });

    // Edge case: Handle tied placements
    // Players with same points/tiebreakers get same placement
    // Next placement skips accordingly (e.g., two 1st place = next is 3rd)
    let currentPlacement = 1;
    let lastPoints = -1;
    let lastOMW = -1;
    let lastGW = -1;
    let playersAtCurrentPlacement = 0;

    const placementsToUpdate: Array<{ userId: string; placement: number }> = [];

    for (let i = 0; i < standings.length; i++) {
      const standing = standings[i];

      // Check if this player has same score as previous
      const isTied =
        standing.points === lastPoints &&
        Math.abs(standing.omwPercent - lastOMW) < 0.0001 &&
        Math.abs(standing.gwPercent - lastGW) < 0.0001;

      if (isTied) {
        // Same placement as previous
        playersAtCurrentPlacement++;
      } else {
        // New placement tier
        currentPlacement += playersAtCurrentPlacement;
        playersAtCurrentPlacement = 1;
      }

      placementsToUpdate.push({
        userId: standing.userId,
        placement: currentPlacement,
      });

      lastPoints = standing.points;
      lastOMW = standing.omwPercent;
      lastGW = standing.gwPercent;
    }

    // Update placements in database (transaction for atomicity)
    await this.prisma.$transaction(
      placementsToUpdate.map(({ userId, placement }) =>
        this.prisma.entry.update({
          where: {
            eventId_userId: {
              eventId,
              userId,
            },
          },
          data: {
            placement,
          },
        })
      )
    );

    this.logger.log(`Finalized placements for event ${eventId}: ${placementsToUpdate.length} players`);

    // Return standings with finalized placements
    return {
      eventId,
      eventName: event.name,
      totalPlayers: standings.length,
      standings: standings.map((s, i) => ({
        ...s,
        placement: placementsToUpdate[i].placement,
      })),
      finalizedAt: new Date(),
      finalizedBy: userId,
    };
  }
}
