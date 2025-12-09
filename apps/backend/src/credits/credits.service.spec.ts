import { Test, TestingModule } from '@nestjs/testing';
import { CreditsService } from './credits.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('CreditsService', () => {
  let service: CreditsService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockPrismaService: any = {
    orgMembership: {
      findUnique: jest.fn(),
    },
    creditLedgerEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    creditBalance: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('adjustCredits', () => {
    const adjustDto = {
      userId: 'user-1',
      amount: 1000,
      reasonCode: 'MANUAL_ADD' as any,
      memo: 'Test credit addition',
      relatedEventId: undefined,
    };

    const mockMembership = {
      userId: 'user-1',
      orgId: 'org-1',
      role: 'PLAYER',
    };

    it('should add credits successfully', async () => {
      mockPrismaService.orgMembership.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue({ balance: 500 }),
            upsert: jest.fn().mockResolvedValue({
              orgId: 'org-1',
              userId: 'user-1',
              balance: 1500, // 500 + 1000
            }),
          },
          creditLedgerEntry: {
            create: jest.fn().mockResolvedValue({
              id: 'entry-1',
              orgId: 'org-1',
              userId: 'user-1',
              amount: 1000,
              reasonCode: 'MANUAL_ADD',
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await service.adjustCredits('org-1', adjustDto, 'admin-1');

      expect(result.entry.amount).toBe(1000);
      expect(result.balance.balance).toBe(1500);
      expect(mockAuditService.log).toHaveBeenCalledWith({
        orgId: 'org-1',
        action: 'CREDIT_ADJUST',
        performedBy: 'admin-1',
        targetUserId: 'user-1',
        metadata: expect.objectContaining({
          amount: 1000,
          newBalance: 1500,
        }),
      });
    });

    it('should deduct credits successfully', async () => {
      const deductDto = {
        ...adjustDto,
        amount: -500,
        reasonCode: 'MANUAL_DEDUCT' as any,
      };

      mockPrismaService.orgMembership.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue({ balance: 1000 }),
            upsert: jest.fn().mockResolvedValue({
              orgId: 'org-1',
              userId: 'user-1',
              balance: 500, // 1000 - 500
            }),
          },
          creditLedgerEntry: {
            create: jest.fn().mockResolvedValue({
              id: 'entry-1',
              amount: -500,
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await service.adjustCredits('org-1', deductDto, 'admin-1');

      expect(result.entry.amount).toBe(-500);
      expect(result.balance.balance).toBe(500);
    });

    it('should throw BadRequestException if user not in org', async () => {
      mockPrismaService.orgMembership.findUnique.mockResolvedValue(null);

      await expect(
        service.adjustCredits('org-1', adjustDto, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient credits', async () => {
      const deductDto = {
        ...adjustDto,
        amount: -2000,
      };

      mockPrismaService.orgMembership.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue({ balance: 1000 }),
          },
        };
        // Transaction callback will throw
        try {
          return await callback(mockTx);
        } catch (error) {
          throw error;
        }
      });

      await expect(
        service.adjustCredits('org-1', deductDto, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle creating new balance (first transaction)', async () => {
      mockPrismaService.orgMembership.findUnique.mockResolvedValue(mockMembership);
      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue(null), // No existing balance
            upsert: jest.fn().mockResolvedValue({
              orgId: 'org-1',
              userId: 'user-1',
              balance: 1000, // First credit
            }),
          },
          creditLedgerEntry: {
            create: jest.fn().mockResolvedValue({
              id: 'entry-1',
              amount: 1000,
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await service.adjustCredits('org-1', adjustDto, 'admin-1');

      expect(result.balance.balance).toBe(1000);
    });

    it('should use transaction to prevent race conditions', async () => {
      mockPrismaService.orgMembership.findUnique.mockResolvedValue(mockMembership);
      let transactionCalled = false;

      mockPrismaService.$transaction.mockImplementation(async (callback: any) => {
        transactionCalled = true;
        const mockTx = {
          creditBalance: {
            findUnique: jest.fn().mockResolvedValue({ balance: 1000 }),
            upsert: jest.fn().mockResolvedValue({ balance: 2000 }),
          },
          creditLedgerEntry: {
            create: jest.fn().mockResolvedValue({ id: 'entry-1' }),
          },
        };
        return callback(mockTx);
      });

      await service.adjustCredits('org-1', adjustDto, 'admin-1');

      expect(transactionCalled).toBe(true);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    it('should return balance for user', async () => {
      mockPrismaService.creditBalance.findUnique.mockResolvedValue({
        orgId: 'org-1',
        userId: 'user-1',
        balance: 5000,
      });

      const balance = await service.getBalance('org-1', 'user-1');

      expect(balance).toBe(5000);
      expect(mockPrismaService.creditBalance.findUnique).toHaveBeenCalledWith({
        where: {
          orgId_userId: {
            orgId: 'org-1',
            userId: 'user-1',
          },
        },
      });
    });

    it('should return 0 if no balance record exists', async () => {
      mockPrismaService.creditBalance.findUnique.mockResolvedValue(null);

      const balance = await service.getBalance('org-1', 'user-1');

      expect(balance).toBe(0);
    });
  });

  describe('getBalanceWithHistory', () => {
    it('should return balance with recent transactions', async () => {
      mockPrismaService.creditBalance.findUnique.mockResolvedValue({
        balance: 5000,
      });

      const mockTransactions = [
        { id: 'tx-1', amount: 1000, reasonCode: 'PRIZE', createdAt: new Date() },
        { id: 'tx-2', amount: -500, reasonCode: 'EVENT_ENTRY', createdAt: new Date() },
      ];

      mockPrismaService.creditLedgerEntry.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getBalanceWithHistory('org-1', 'user-1');

      expect(result.balance).toBe(5000);
      expect(result.recentTransactions).toEqual(mockTransactions);
      expect(result.recentTransactions.length).toBe(2);
    });
  });

  describe('getTransactionHistory', () => {
    const mockTransactions = [
      { id: 'tx-1', amount: 1000, reasonCode: 'PRIZE', createdAt: new Date() },
      { id: 'tx-2', amount: -500, reasonCode: 'EVENT_ENTRY', createdAt: new Date() },
      { id: 'tx-3', amount: 2000, reasonCode: 'MANUAL_ADD', createdAt: new Date() },
    ];

    it('should return paginated transaction history', async () => {
      mockPrismaService.creditLedgerEntry.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getTransactionHistory('org-1', 'user-1', {
        limit: 50,
      });

      expect(result.transactions.length).toBe(3);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });

    it('should handle pagination with cursor', async () => {
      mockPrismaService.creditLedgerEntry.findMany.mockResolvedValue([
        mockTransactions[1],
        mockTransactions[2],
      ]);

      const result = await service.getTransactionHistory('org-1', 'user-1', {
        limit: 2,
        cursor: 'tx-1',
      });

      expect(result.transactions.length).toBe(2);
      expect(mockPrismaService.creditLedgerEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 1,
          cursor: { id: 'tx-1' },
        }),
      );
    });

    it('should filter by reason code', async () => {
      const prizeTransactions = [mockTransactions[0]];
      mockPrismaService.creditLedgerEntry.findMany.mockResolvedValue(prizeTransactions);

      const result = await service.getTransactionHistory('org-1', 'user-1', {
        reasonCode: 'PRIZE',
      });

      expect(result.transactions.length).toBe(1);
      expect(mockPrismaService.creditLedgerEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reasonCode: 'PRIZE',
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.creditLedgerEntry.findMany.mockResolvedValue(mockTransactions);

      const startDate = '2025-01-01';
      const endDate = '2025-12-31';

      await service.getTransactionHistory('org-1', 'user-1', {
        startDate,
        endDate,
      });

      expect(mockPrismaService.creditLedgerEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        }),
      );
    });

    it('should indicate hasMore when results exceed limit', async () => {
      // Return limit + 1 items
      const manyTransactions = [...mockTransactions, { id: 'tx-4', amount: 500 }];
      mockPrismaService.creditLedgerEntry.findMany.mockResolvedValue(manyTransactions);

      const result = await service.getTransactionHistory('org-1', 'user-1', {
        limit: 3,
      });

      expect(result.transactions.length).toBe(3);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe('tx-3');
    });
  });
});
