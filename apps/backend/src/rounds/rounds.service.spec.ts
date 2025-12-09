import { Test, TestingModule } from '@nestjs/testing';
import { RoundsService } from './rounds.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { RatingsService } from '../ratings/ratings.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('RoundsService', () => {
  let service: RoundsService;
  let prisma: PrismaService;
  let realtimeGateway: RealtimeGateway;
  let notificationsService: NotificationsService;
  let ratingsService: RatingsService;

  const mockPrismaService: any = {
    event: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    round: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    match: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  const mockRealtimeGateway = {
    broadcastToEvent: jest.fn(),
    broadcastRoundUpdate: jest.fn(),
    emitRoundStarted: jest.fn(),
    emitRoundEnded: jest.fn(),
    emitStandingsUpdated: jest.fn(),
    emitTournamentComplete: jest.fn(),
    emitTournamentCompleted: jest.fn(),
  };

  const mockNotificationsService = {
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
    createAndSend: jest.fn().mockResolvedValue(undefined),
    broadcastToEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockRatingsService = {
    processEventRatings: jest.fn().mockResolvedValue(undefined),
    processTournamentRatings: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoundsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
      ],
    }).compile();

    service = module.get<RoundsService>(RoundsService);
    prisma = module.get<PrismaService>(PrismaService);
    realtimeGateway = module.get<RealtimeGateway>(RealtimeGateway);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    ratingsService = module.get<RatingsService>(RatingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNextRound', () => {
    const mockEvent = {
      id: 'event-1',
      orgId: 'org-1',
      status: 'SCHEDULED',
      roundsPlanned: 4,
      entries: [
        { userId: 'user-1', checkedInAt: new Date(), droppedAt: null, user: { id: 'user-1', name: 'Player 1' } },
        { userId: 'user-2', checkedInAt: new Date(), droppedAt: null, user: { id: 'user-2', name: 'Player 2' } },
        { userId: 'user-3', checkedInAt: new Date(), droppedAt: null, user: { id: 'user-3', name: 'Player 3' } },
        { userId: 'user-4', checkedInAt: new Date(), droppedAt: null, user: { id: 'user-4', name: 'Player 4' } },
      ],
      rounds: [],
    };

    it('should create first round and update event status to IN_PROGRESS', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        await callback(mockPrismaService);
        return {
          id: 'round-1',
          roundNumber: 1,
          status: 'PENDING',
          matches: [],
        };
      });

      const result = await service.createNextRound('event-1', 'org-1');

      expect(mockPrismaService.event.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1' },
          data: expect.objectContaining({
            status: 'IN_PROGRESS',
            roundsPlanned: 4,
          }),
        }),
      );
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.createNextRound('event-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        orgId: 'org-2',
      });

      await expect(service.createNextRound('event-1', 'org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if previous round not complete', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        rounds: [
          {
            id: 'round-1',
            roundNumber: 1,
            status: 'ACTIVE',
            matches: [],
          },
        ],
      });

      await expect(service.createNextRound('event-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if tournament complete', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue({
        ...mockEvent,
        roundsPlanned: 2,
        rounds: [
          { id: 'round-1', roundNumber: 1, status: 'COMPLETED', matches: [] },
          { id: 'round-2', roundNumber: 2, status: 'COMPLETED', matches: [] },
        ],
      });

      await expect(service.createNextRound('event-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPairings', () => {
    it('should return pairings if user has access', async () => {
      const round = {
        id: 'round-1',
        roundNumber: 1,
        event: {
          id: 'event-1',
          orgId: 'org-1',
        },
      };

      const matches = [
        {
          id: 'match-1',
          roundId: 'round-1',
          playerAId: 'user-1',
          playerBId: 'user-2',
          playerA: { id: 'user-1', name: 'Player 1' },
          playerB: { id: 'user-2', name: 'Player 2' },
        },
      ];

      mockPrismaService.round.findUnique.mockResolvedValue(round);
      mockPrismaService.match.findMany.mockResolvedValue(matches);

      const result = await service.getPairings('round-1', 'org-1');

      expect(result).toEqual(matches);
    });

    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue(null);

      await expect(service.getPairings('round-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue({
        id: 'round-1',
        event: {
          orgId: 'org-2',
        },
      });

      await expect(service.getPairings('round-1', 'org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('startRound', () => {
    it('should start round if in PENDING status', async () => {
      const round = {
        id: 'round-1',
        roundNumber: 1,
        status: 'PENDING',
        event: {
          id: 'event-1',
          orgId: 'org-1',
        },
      };

      mockPrismaService.round.findUnique.mockResolvedValue(round);
      mockPrismaService.round.update.mockResolvedValue({
        ...round,
        status: 'ACTIVE',
      });

      const result = await service.startRound('round-1', 'org-1');

      expect(result.status).toBe('ACTIVE');
      expect(mockPrismaService.round.update).toHaveBeenCalledWith({
        where: { id: 'round-1' },
        data: { status: 'ACTIVE' },
      });
    });

    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue(null);

      await expect(service.startRound('round-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue({
        id: 'round-1',
        status: 'PENDING',
        event: {
          orgId: 'org-2',
        },
      });

      await expect(service.startRound('round-1', 'org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if round not in PENDING status', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue({
        id: 'round-1',
        status: 'ACTIVE',
        event: {
          orgId: 'org-1',
        },
      });

      await expect(service.startRound('round-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeRound', () => {
    it('should complete round if all matches reported', async () => {
      const round = {
        id: 'round-1',
        roundNumber: 1,
        status: 'ACTIVE',
        eventId: 'event-1',
        event: {
          id: 'event-1',
          orgId: 'org-1',
          roundsPlanned: 4,
          entries: [
            { userId: 'user-1', checkedInAt: new Date(), user: { id: 'user-1', name: 'Player 1' } },
            { userId: 'user-2', checkedInAt: new Date(), user: { id: 'user-2', name: 'Player 2' } },
          ],
          rounds: [
            {
              id: 'round-1',
              roundNumber: 1,
              matches: [
                { playerAId: 'user-1', playerBId: 'user-2', result: 'PLAYER_A_WIN', gamesWonA: 2, gamesWonB: 0 },
              ],
            },
          ],
        },
        matches: [
          { id: 'match-1', result: 'PLAYER_A_WIN', playerBId: 'user-2', overriddenBy: 'staff-1', reportedBy: null, confirmedBy: null },
        ],
      };

      mockPrismaService.round.findUnique.mockResolvedValue(round);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          round: {
            update: jest.fn().mockResolvedValue({ ...round, status: 'COMPLETED' }),
          },
          event: {
            update: jest.fn().mockResolvedValue({ id: 'event-1', status: 'IN_PROGRESS' }),
          },
        });
      });

      const result = await service.completeRound('round-1', 'org-1');

      expect(result.round.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException if round does not exist', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue(null);

      await expect(service.completeRound('round-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue({
        id: 'round-1',
        status: 'ACTIVE',
        event: {
          orgId: 'org-2',
        },
      });

      await expect(service.completeRound('round-1', 'org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if round already completed', async () => {
      mockPrismaService.round.findUnique.mockResolvedValue({
        id: 'round-1',
        status: 'COMPLETED',
        matches: [],
        event: {
          orgId: 'org-1',
          entries: [],
          rounds: [],
        },
      });

      await expect(service.completeRound('round-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if not all matches reported', async () => {
      const round = {
        id: 'round-1',
        roundNumber: 1,
        status: 'ACTIVE',
        eventId: 'event-1',
        event: {
          id: 'event-1',
          orgId: 'org-1',
          roundsPlanned: 4,
          entries: [
            { userId: 'user-1', checkedInAt: new Date(), user: { id: 'user-1', name: 'Player 1' } },
            { userId: 'user-2', checkedInAt: new Date(), user: { id: 'user-2', name: 'Player 2' } },
          ],
          rounds: [
            {
              id: 'round-1',
              roundNumber: 1,
              matches: [],
            },
          ],
        },
        matches: [
          { id: 'match-1', result: null, playerBId: 'user-2', overriddenBy: null, reportedBy: null, confirmedBy: null }, // Not reported
        ],
      };

      mockPrismaService.round.findUnique.mockResolvedValue(round);

      await expect(service.completeRound('round-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
