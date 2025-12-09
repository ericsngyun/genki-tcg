import { Test, TestingModule } from '@nestjs/testing';
import { MatchesService } from './matches.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RatingsService } from '../ratings/ratings.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MatchResult } from '@prisma/client';

describe('MatchesService', () => {
  let service: MatchesService;
  let prisma: PrismaService;
  let realtimeGateway: RealtimeGateway;
  let ratingsService: RatingsService;
  let notificationsService: NotificationsService;

  const mockPrismaService: any = {
    match: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    round: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  const mockRealtimeGateway = {
    emitMatchResultReported: jest.fn(),
    emitStandingsUpdated: jest.fn(),
    emitRoundReadyToComplete: jest.fn(),
  };

  const mockRatingsService = {
    updateRatings: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationsService = {
    createAndSend: jest.fn().mockResolvedValue(undefined),
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    prisma = module.get<PrismaService>(PrismaService);
    realtimeGateway = module.get<RealtimeGateway>(RealtimeGateway);
    ratingsService = module.get<RatingsService>(RatingsService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reportMatchResult', () => {
    const reportDto = {
      matchId: 'match-1',
      result: 'PLAYER_A_WIN' as MatchResult,
      gamesWonA: 2,
      gamesWonB: 0,
    };

    const mockMatch = {
      id: 'match-1',
      tableNumber: 5,
      playerAId: 'player-a',
      playerBId: 'player-b',
      round: {
        id: 'round-1',
        eventId: 'event-1',
        event: {
          id: 'event-1',
          orgId: 'org-1',
        },
      },
    };

    it('should report match result successfully', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue({
        ...mockMatch,
        result: reportDto.result,
        gamesWonA: reportDto.gamesWonA,
        gamesWonB: reportDto.gamesWonB,
        reportedBy: 'staff-1',
        reportedAt: new Date(),
      });

      const result = await service.reportMatchResult(
        reportDto,
        'staff-1',
        'org-1',
      );

      expect(result.result).toBe(reportDto.result);
      expect(result.reportedBy).toBe('staff-1');
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: expect.objectContaining({
          result: reportDto.result,
          gamesWonA: reportDto.gamesWonA,
          gamesWonB: reportDto.gamesWonB,
          reportedBy: 'staff-1',
        }),
      });
    });

    it('should throw NotFoundException if match does not exist', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        service.reportMatchResult(reportDto, 'staff-1', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        round: {
          ...mockMatch.round,
          event: {
            ...mockMatch.round.event,
            orgId: 'org-2',
          },
        },
      });

      await expect(
        service.reportMatchResult(reportDto, 'staff-1', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should emit real-time events after reporting', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue({
        ...mockMatch,
        result: reportDto.result,
      });

      await service.reportMatchResult(reportDto, 'staff-1', 'org-1');

      expect(mockRealtimeGateway.emitMatchResultReported).toHaveBeenCalledWith(
        'event-1',
        'match-1',
        5,
      );
      expect(mockRealtimeGateway.emitStandingsUpdated).toHaveBeenCalledWith(
        'event-1',
      );
    });
  });

  describe('getMatch', () => {
    const mockMatch = {
      id: 'match-1',
      tableNumber: 5,
      playerA: { id: 'player-a', name: 'Player A' },
      playerB: { id: 'player-b', name: 'Player B' },
      round: {
        id: 'round-1',
        event: {
          id: 'event-1',
          orgId: 'org-1',
        },
      },
    };

    it('should return match if user has access', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      const result = await service.getMatch('match-1', 'org-1');

      expect(result).toEqual(mockMatch);
      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if match does not exist', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(service.getMatch('match-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        round: {
          ...mockMatch.round,
          event: {
            orgId: 'org-2',
          },
        },
      });

      await expect(service.getMatch('match-1', 'org-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('overrideMatchResult', () => {
    const mockMatch = {
      id: 'match-1',
      tableNumber: 5,
      playerAId: 'player-a',
      playerBId: 'player-b',
      round: {
        id: 'round-1',
        eventId: 'event-1',
        event: {
          id: 'event-1',
          orgId: 'org-1',
        },
      },
    };

    it('should override match result successfully', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.match.update.mockResolvedValue({
        ...mockMatch,
        result: 'PLAYER_B_WIN',
        gamesWonA: 1,
        gamesWonB: 2,
        overriddenBy: 'admin-1',
        overriddenAt: new Date(),
      });

      const result = await service.overrideMatchResult(
        'match-1',
        'PLAYER_B_WIN' as MatchResult,
        1,
        2,
        'admin-1',
        'org-1',
      );

      expect(result.result).toBe('PLAYER_B_WIN');
      expect(result.overriddenBy).toBe('admin-1');
      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: 'match-1' },
        data: expect.objectContaining({
          result: 'PLAYER_B_WIN',
          gamesWonA: 1,
          gamesWonB: 2,
          overriddenBy: 'admin-1',
        }),
      });
    });

    it('should throw NotFoundException if match does not exist', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        service.overrideMatchResult(
          'match-1',
          'PLAYER_A_WIN' as MatchResult,
          2,
          0,
          'admin-1',
          'org-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        round: {
          ...mockMatch.round,
          event: {
            orgId: 'org-2',
          },
        },
      });

      await expect(
        service.overrideMatchResult(
          'match-1',
          'PLAYER_A_WIN' as MatchResult,
          2,
          0,
          'admin-1',
          'org-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('playerReportResult', () => {
    const reportDto = {
      result: 'PLAYER_A_WIN' as MatchResult,
      gamesWonA: 1,
      gamesWonB: 0,
    };

    const mockMatch = {
      id: 'match-1',
      tableNumber: 5,
      playerAId: 'player-a',
      playerBId: 'player-b',
      reportedBy: null,
      confirmedBy: null,
      round: {
        id: 'round-1',
        eventId: 'event-1',
        status: 'ACTIVE',
        event: {
          id: 'event-1',
          orgId: 'org-1',
          game: 'ONE_PIECE_TCG',
        },
        matches: [],
      },
      playerA: { id: 'player-a', name: 'Player A' },
      playerB: { id: 'player-b', name: 'Player B' },
    };

    it('should allow player to report match result', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          match: {
            findUnique: jest.fn().mockResolvedValue(mockMatch),
            update: jest.fn().mockResolvedValue({
              ...mockMatch,
              result: reportDto.result,
              gamesWonA: reportDto.gamesWonA,
              gamesWonB: reportDto.gamesWonB,
              reportedBy: 'player-a',
              confirmedBy: 'player-a',
              playerA: { id: 'player-a', name: 'Player A' },
              playerB: { id: 'player-b', name: 'Player B' },
            }),
          },
        });
      });

      const result = await service.playerReportResult(
        'match-1',
        reportDto,
        'player-a',
        'org-1',
      );

      expect(result.match.reportedBy).toBe('player-a');
      expect(result.match.confirmedBy).toBe('player-a'); // Auto-confirmed
      expect(result.requiresConfirmation).toBe(false);
    });

    it('should throw NotFoundException if match does not exist', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        service.playerReportResult('match-1', reportDto, 'player-a', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        round: {
          ...mockMatch.round,
          event: {
            ...mockMatch.round.event,
            orgId: 'org-2',
          },
        },
      });

      await expect(
        service.playerReportResult('match-1', reportDto, 'player-a', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not a participant', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(
        service.playerReportResult('match-1', reportDto, 'other-user', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if round not active', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        round: {
          ...mockMatch.round,
          status: 'COMPLETED',
        },
      });

      await expect(
        service.playerReportResult('match-1', reportDto, 'player-a', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if match already confirmed', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        confirmedBy: 'player-b',
      });

      await expect(
        service.playerReportResult('match-1', reportDto, 'player-a', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmMatchResult', () => {
    const confirmDto = {
      confirm: true,
    };

    const mockMatch = {
      id: 'match-1',
      tableNumber: 5,
      playerAId: 'player-a',
      playerBId: 'player-b',
      result: 'PLAYER_A_WIN' as MatchResult,
      reportedBy: 'player-a',
      confirmedBy: null,
      round: {
        id: 'round-1',
        eventId: 'event-1',
        status: 'ACTIVE',
        event: {
          id: 'event-1',
          orgId: 'org-1',
        },
        matches: [],
      },
      playerA: { id: 'player-a', name: 'Player A' },
      playerB: { id: 'player-b', name: 'Player B' },
    };

    it('should allow opponent to confirm match result', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          match: {
            findUnique: jest.fn().mockResolvedValue(mockMatch),
            update: jest.fn().mockResolvedValue({
              ...mockMatch,
              confirmedBy: 'player-b',
            }),
          },
        });
      });

      const result = await service.confirmMatchResult(
        'match-1',
        confirmDto,
        'player-b',
        'org-1',
      );

      expect(result.match.confirmedBy).toBe('player-b');
      expect(result.status).toBe('confirmed');
    });

    it('should throw NotFoundException if match does not exist', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmMatchResult('match-1', confirmDto, 'player-b', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user from different org', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        round: {
          ...mockMatch.round,
          event: {
            orgId: 'org-2',
          },
        },
      });

      await expect(
        service.confirmMatchResult('match-1', confirmDto, 'player-b', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not a participant', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(
        service.confirmMatchResult('match-1', confirmDto, 'other-user', 'org-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if user tries to confirm own report', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(mockMatch);

      await expect(
        service.confirmMatchResult('match-1', confirmDto, 'player-a', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no result to confirm', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        reportedBy: null,
        result: null,
      });

      await expect(
        service.confirmMatchResult('match-1', confirmDto, 'player-b', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already confirmed', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockMatch,
        confirmedBy: 'player-b',
      });

      await expect(
        service.confirmMatchResult('match-1', confirmDto, 'player-b', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
