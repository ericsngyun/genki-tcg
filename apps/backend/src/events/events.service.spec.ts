import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;
  let notificationsService: NotificationsService;

  const mockPrismaService: any = {
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
      count: jest.fn(),
      delete: jest.fn(),
    },
    creditLedgerEntry: {
      create: jest.fn(),
    },
    creditBalance: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  const mockNotificationsService = {
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
    createAndSend: jest.fn().mockResolvedValue(undefined),
    broadcastToEvent: jest.fn().mockResolvedValue(undefined),
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
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
        name: 'Test Event',
        orgId: 'org-1',
      };
      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
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

    it('should throw BadRequestException if amount is negative', async () => {
      const entry = {
        id: 'entry-1',
        event: {
          orgId: 'org-1',
          entryFeeCents: 1000,
        },
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);

      await expect(
        service.markAsPaid('entry-1', 'staff-1', 'org-1', -500),
      ).rejects.toThrow(BadRequestException);
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
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
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

    it('should throw BadRequestException if duplicate placements', async () => {
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
        { userId: 'user-1', amount: 5000, placement: 1 },
        { userId: 'user-2', amount: 5000, placement: 1 }, // Duplicate placement
      ];

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.distributePrizes('event-1', distributions, 'staff-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if negative prize amount', async () => {
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
        { userId: 'user-1', amount: -1000, placement: 1 },
      ];

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.distributePrizes('event-1', distributions, 'staff-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createEvent', () => {
    it('should create event with valid data', async () => {
      const dto = {
        name: 'Test Tournament',
        game: 'ONE_PIECE_TCG',
        format: 'SWISS',
        startAt: new Date(),
        entryFeeCents: 1000,
      };

      const createdEvent = {
        id: 'event-1',
        ...dto,
        orgId: 'org-1',
        createdBy: 'user-1',
        status: 'SCHEDULED',
      };

      mockPrismaService.event.create.mockResolvedValue(createdEvent);

      const result = await service.createEvent('org-1', 'user-1', dto as any);

      expect(result).toEqual(createdEvent);
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          orgId: 'org-1',
          createdBy: 'user-1',
          status: 'SCHEDULED',
        },
      });
    });

    it('should send notification to admins after creating event', async () => {
      const dto = {
        name: 'Test Tournament',
        game: 'ONE_PIECE_TCG',
        format: 'SWISS',
        startAt: new Date(),
      };

      const createdEvent = {
        id: 'event-1',
        name: 'Test Tournament',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      mockPrismaService.event.create.mockResolvedValue(createdEvent);

      await service.createEvent('org-1', 'user-1', dto as any);

      expect(mockNotificationsService.notifyAdmins).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          title: 'New Event Published',
          eventId: 'event-1',
        }),
      );
    });
  });

  describe('updateEvent', () => {
    it('should update event with valid data', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      const dto = {
        name: 'Updated Tournament',
        entryFeeCents: 1500,
      };

      const updatedEvent = {
        ...event,
        ...dto,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.event.update.mockResolvedValue(updatedEvent);

      const result = await service.updateEvent('event-1', 'org-1', dto as any);

      expect(result).toEqual(updatedEvent);
      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: dto,
      });
    });

    it('should throw ForbiddenException if event in different org', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.updateEvent('event-1', 'org-2', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if event is completed', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'COMPLETED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.updateEvent('event-1', 'org-1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event is cancelled', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'CANCELLED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.updateEvent('event-1', 'org-1', {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should broadcast update notification to registered players', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      const updatedEvent = {
        ...event,
        name: 'Updated Tournament',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.event.update.mockResolvedValue(updatedEvent);

      await service.updateEvent('event-1', 'org-1', { name: 'Updated Tournament' } as any);

      expect(mockNotificationsService.broadcastToEvent).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({
          title: 'Event Updated',
        }),
      );
    });
  });

  describe('cancelEvent', () => {
    it('should cancel event successfully', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
        status: 'SCHEDULED',
        _count: { entries: 5 },
      };

      const cancelledEvent = {
        ...event,
        status: 'CANCELLED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.event.update.mockResolvedValue(cancelledEvent);

      const result = await service.cancelEvent('event-1', 'org-1', 'user-1');

      expect(result.status).toBe('CANCELLED');
      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: 'event-1' },
        data: { status: 'CANCELLED' },
      });
    });

    it('should throw ForbiddenException if event in different org', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.cancelEvent('event-1', 'org-2', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if event already completed', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'COMPLETED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.cancelEvent('event-1', 'org-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if event already cancelled', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'CANCELLED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.cancelEvent('event-1', 'org-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should notify registered players if event has entries', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
        status: 'SCHEDULED',
        _count: { entries: 10 },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.event.update.mockResolvedValue({ ...event, status: 'CANCELLED' });

      await service.cancelEvent('event-1', 'org-1', 'user-1', 'Weather conditions');

      expect(mockNotificationsService.broadcastToEvent).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({
          title: 'Event Cancelled',
          body: expect.stringContaining('Weather conditions'),
        }),
      );
    });
  });

  describe('selfCheckIn', () => {
    it('should allow player to self-check-in if no payment required', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        entryFeeCents: 0,
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: null,
        droppedAt: null,
        event,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);
      mockPrismaService.entry.update.mockResolvedValue({
        ...entry,
        checkedInAt: new Date(),
      });

      const result = await service.selfCheckIn('event-1', 'user-1', 'org-1');

      expect(result.checkedInAt).toBeDefined();
      expect(mockPrismaService.entry.update).toHaveBeenCalled();
    });

    it('should allow player to self-check-in if payment made', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        entryFeeCents: 1000,
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: null,
        droppedAt: null,
        paidAt: new Date(),
        event,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);
      mockPrismaService.entry.update.mockResolvedValue({
        ...entry,
        checkedInAt: new Date(),
      });

      const result = await service.selfCheckIn('event-1', 'user-1', 'org-1');

      expect(result.checkedInAt).toBeDefined();
    });

    it('should throw ForbiddenException if event in different org', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.selfCheckIn('event-1', 'user-1', 'org-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if player not registered', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(null);

      await expect(
        service.selfCheckIn('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already checked in', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: new Date(),
        droppedAt: null,
        event,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);

      await expect(
        service.selfCheckIn('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if player has dropped', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: null,
        droppedAt: new Date(),
        event,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);

      await expect(
        service.selfCheckIn('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if payment required but not made', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        entryFeeCents: 1000,
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: null,
        droppedAt: null,
        paidAt: null,
        event,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);

      await expect(
        service.selfCheckIn('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('playerDrop', () => {
    it('should allow player to withdraw from SCHEDULED event before check-in', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: null,
        droppedAt: null,
        user: {
          name: 'Test Player',
        },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);
      mockPrismaService.entry.delete.mockResolvedValue(entry);

      const result = await service.playerDrop('event-1', 'user-1', 'org-1');

      expect(mockPrismaService.entry.delete).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
      });
      expect(result).toEqual(entry);
    });

    it('should throw BadRequestException if trying to withdraw after check-in', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: new Date(),
        droppedAt: null,
        user: {
          name: 'Test Player',
        },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);

      await expect(
        service.playerDrop('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark player as dropped for IN_PROGRESS event', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
        status: 'IN_PROGRESS',
        currentRound: 3,
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        droppedAt: null,
        user: {
          name: 'Test Player',
        },
      };

      const updatedEntry = {
        ...entry,
        droppedAt: new Date(),
        droppedAfterRound: 3,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);
      mockPrismaService.entry.update.mockResolvedValue(updatedEntry);

      const result = await service.playerDrop('event-1', 'user-1', 'org-1');

      expect(result.droppedAt).toBeDefined();
      expect(result.droppedAfterRound).toBe(3);
      expect(mockPrismaService.entry.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if event in different org', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.playerDrop('event-1', 'user-1', 'org-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if player not registered', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'SCHEDULED',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(null);

      await expect(
        service.playerDrop('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if player already dropped', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
        status: 'IN_PROGRESS',
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        droppedAt: new Date(),
        user: {
          name: 'Test Player',
        },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(entry);

      await expect(
        service.playerDrop('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerForEvent - capacity limits', () => {
    it('should throw BadRequestException if event is at max capacity', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
        maxPlayers: 8,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(null);
      mockPrismaService.entry.count.mockResolvedValue(8);

      await expect(
        service.registerForEvent('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow registration if below max capacity', async () => {
      const event = {
        id: 'event-1',
        name: 'Test Event',
        orgId: 'org-1',
        maxPlayers: 8,
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        user: {
          name: 'Test Player',
        },
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(null);
      mockPrismaService.entry.count.mockResolvedValue(7);
      mockPrismaService.entry.create.mockResolvedValue(entry);

      const result = await service.registerForEvent('event-1', 'user-1', 'org-1');

      expect(result).toEqual(entry);
      expect(mockPrismaService.entry.create).toHaveBeenCalled();
    });
  });

  describe('dropPlayer', () => {
    it('should allow staff to drop player from event', async () => {
      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        droppedAt: null,
        event: {
          id: 'event-1',
          name: 'Test Event',
          orgId: 'org-1',
        },
        user: {
          name: 'Test Player',
        },
      };

      const updatedEntry = {
        ...entry,
        droppedAt: new Date(),
        droppedAfterRound: 2,
      };

      mockPrismaService.entry.findUnique.mockResolvedValue(entry);
      mockPrismaService.entry.update.mockResolvedValue(updatedEntry);

      const result = await service.dropPlayer('entry-1', 'org-1', 2);

      expect(result.droppedAt).toBeDefined();
      expect(result.droppedAfterRound).toBe(2);
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
        service.dropPlayer('entry-1', 'org-2', 2),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addLatePlayer', () => {
    it('should add late player with auto-check-in', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };

      const entry = {
        id: 'entry-1',
        eventId: 'event-1',
        userId: 'user-1',
        checkedInAt: new Date(),
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);
      mockPrismaService.entry.findFirst.mockResolvedValue(null);
      mockPrismaService.entry.create.mockResolvedValue(entry);

      const result = await service.addLatePlayer('event-1', 'user-1', 'org-1');

      expect(result.checkedInAt).toBeDefined();
      expect(mockPrismaService.entry.create).toHaveBeenCalledWith({
        data: {
          eventId: 'event-1',
          userId: 'user-1',
          checkedInAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenException if event in different org', async () => {
      const event = {
        id: 'event-1',
        orgId: 'org-1',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(event);

      await expect(
        service.addLatePlayer('event-1', 'user-1', 'org-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if player already registered', async () => {
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
        service.addLatePlayer('event-1', 'user-1', 'org-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
