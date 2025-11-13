import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    entry: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvent', () => {
    it('should return event if user has access', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
        entries: [],
        rounds: [],
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      const result = await service.getEvent('event-1', 'org-1');

      expect(result).toEqual(event);
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if event does not exist', async () => {
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.getEvent('event-1', 'org-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user from different org', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(service.getEvent('event-1', 'org-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('registerForEvent', () => {
    it('should create entry if user has access', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };
      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(null);
      mockPrismaService.entry.create.mockResolvedValue(entry);

      const result = await service.registerForEvent('event-1', 'user-1', 'org-1');

      expect(result).toEqual(entry);
      expect(mockPrismaService.entry.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if event in different org', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.registerForEvent('event-1', 'user-1', 'org-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already registered', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };
      const existingEntry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(existingEntry);

      await expect(
        service.registerForEvent('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkIn', () => {
    it('should check in player if payment not required', async () => {
      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        paidAt: null,
        checkedInAt: null,
        event: {
          id: 'event-1',
          orgId: 'org-1',
          entryFeeCents: 0,
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);
      mockPrismaService.entry.update.mockResolvedValue({
        ...entry,
        checkedInAt: new Date(),
      });

      const result = await service.checkIn('entry-1', 'org-1');

      expect(result.checkedInAt).toBeDefined();
      expect(mockPrismaService.entry.update).toHaveBeenCalled();
    });

    it('should check in player if payment made', async () => {
      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        paidAt: new Date(),
        checkedInAt: null,
        event: {
          id: 'event-1',
          orgId: 'org-1',
          entryFeeCents: 1000,
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);
      mockPrismaService.entry.update.mockResolvedValue({
        ...entry,
        checkedInAt: new Date(),
      });

      const result = await service.checkIn('entry-1', 'org-1');

      expect(result.checkedInAt).toBeDefined();
    });

    it('should throw BadRequestException if payment required but not made', async () => {
      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        paidAt: null,
        checkedInAt: null,
        event: {
          id: 'event-1',
          orgId: 'org-1',
          entryFeeCents: 1000,
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);

      await expect(service.checkIn('entry-1', 'org-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if entry in different org', async () => {
      const entry = {
        id: 'entry-1',
        event: {
          orgId: 'org-1',
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);

      await expect(service.checkIn('entry-1', 'org-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAsPaid', () => {
    it('should mark entry as paid with valid amount', async () => {
      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        paidAt: null,
        event: {
          id: 'event-1',
          orgId: 'org-1',
          entryFeeCents: 1000,
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);
      mockPrismaService.entry.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.entry.findUnique.mockResolvedValue({
        ...entry,
        paidAt: new Date(),
        paidAmount: 1000,
      });

      const result = await service.markAsPaid('entry-1', 'staff-1', 'org-1', 1000);

      expect(mockPrismaService.entry.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'entry-1',
          paidAt: null,
        },
        data: expect.objectContaining({
          paidAmount: 1000,
          paidBy: 'staff-1',
        }),
      });
    });

    it('should throw BadRequestException if amount less than required', async () => {
      const entry = {
        id: 'entry-1',
        event: {
          orgId: 'org-1',
          entryFeeCents: 1000,
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);

      await expect(
        service.markAsPaid('entry-1', 'staff-1', 'org-1', 500),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already paid (race condition)', async () => {
      const entry = {
        id: 'entry-1',
        event: {
          orgId: 'org-1',
          entryFeeCents: 1000,
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);
      mockPrismaService.entry.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.markAsPaid('entry-1', 'staff-1', 'org-1', 1000),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if entry in different org', async () => {
      const entry = {
        id: 'entry-1',
        event: {
          orgId: 'org-1',
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);

      await expect(
        service.markAsPaid('entry-1', 'staff-1', 'org-2', 1000),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('distributePrizes', () => {
    it('should distribute prizes if valid', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        prizesDistributed: false,
        totalPrizeCredits: 10000,
        entries: [
          { userId: 'user-1' },
          { userId: 'user-2' },
        ],
      };

      const distributions = [
        { userId: 'user-1', amount: 6000, placement: 1 },
        { userId: 'user-2', amount: 4000, placement: 2 },
      ];

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback(mockPrismaService);
      });

      await service.distributePrizes('event-1', distributions, 'staff-1', 'org-1');

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if already distributed', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        prizesDistributed: true,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.distributePrizes('event-1', [], 'staff-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if total exceeds prize pool', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        prizesDistributed: false,
        totalPrizeCredits: 5000,
        entries: [
          { userId: 'user-1' },
        ],
      };

      const distributions = [
        { userId: 'user-1', amount: 6000, placement: 1 },
      ];

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.distributePrizes('event-1', distributions, 'staff-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if recipient not in event', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        prizesDistributed: false,
        totalPrizeCredits: 10000,
        entries: [
          { userId: 'user-1' },
        ],
      };

      const distributions = [
        { userId: 'user-2', amount: 5000, placement: 1 },
      ];

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.distributePrizes('event-1', distributions, 'staff-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
