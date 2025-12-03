import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AdjustCreditsDto, GetHistoryDto } from './dto';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  /**
   * Adjust credits for a user (idempotent if called with same params)
   * Ensures transactional consistency between ledger and balance
   */
  async adjustCredits(
    orgId: string,
    dto: AdjustCreditsDto,
    performedBy: string
  ) {
    const { userId, amount, reasonCode, memo, relatedEventId } = dto;

    // Validate user is in org
    const membership = await this.prisma.orgMembership.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('User not found in organization');
    }

    // Create ledger entry and update balance in transaction
    // IMPORTANT: Balance check is inside transaction to prevent race conditions
    const result = await this.prisma.$transaction(async (tx) => {
      // Check if debit would cause negative balance (inside transaction for atomicity)
      if (amount < 0) {
        const currentBalance = await tx.creditBalance.findUnique({
          where: {
            orgId_userId: {
              orgId,
              userId,
            },
          },
        });

        const balance = currentBalance?.balance || 0;
        if (balance + amount < 0) {
          throw new BadRequestException('Insufficient credits');
        }
      }

      // Insert ledger entry
      const entry = await tx.creditLedgerEntry.create({
        data: {
          orgId,
          userId,
          amount,
          reasonCode,
          memo,
          relatedEventId,
          createdBy: performedBy,
        },
      });

      // Update or create balance
      const balance = await tx.creditBalance.upsert({
        where: {
          orgId_userId: {
            orgId,
            userId,
          },
        },
        update: {
          balance: {
            increment: amount,
          },
          lastTransactionAt: new Date(),
        },
        create: {
          orgId,
          userId,
          balance: amount,
          lastTransactionAt: new Date(),
        },
      });

      return { entry, balance };
    });

    // Audit log
    await this.auditService.log({
      orgId,
      action: 'CREDIT_ADJUST',
      performedBy,
      targetUserId: userId,
      metadata: {
        amount,
        reasonCode,
        memo,
        newBalance: result.balance.balance,
      },
    });

    return result;
  }

  /**
   * Get current balance for a user
   */
  async getBalance(orgId: string, userId: string): Promise<number> {
    const balance = await this.prisma.creditBalance.findUnique({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
    });

    return balance?.balance || 0;
  }

  /**
   * Get detailed balance with recent transactions
   */
  async getBalanceWithHistory(orgId: string, userId: string) {
    const balance = await this.getBalance(orgId, userId);

    const recentTransactions = await this.prisma.creditLedgerEntry.findMany({
      where: {
        orgId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return {
      balance,
      recentTransactions,
    };
  }

  /**
   * Get full transaction history for a user with pagination and filtering
   */
  async getTransactionHistory(
    orgId: string,
    userId: string,
    filters?: GetHistoryDto
  ) {
    const { limit = 50, cursor, reasonCode, startDate, endDate } = filters || {};

    const where: any = {
      orgId,
      userId,
    };

    if (reasonCode) {
      where.reasonCode = reasonCode;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const entries = await this.prisma.creditLedgerEntry.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1, // Take one extra to check if there are more
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const hasMore = entries.length > limit;
    const transactions = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? transactions[transactions.length - 1].id : null;

    return {
      transactions,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };
  }

  /**
   * Reconcile balance from ledger (for data integrity checks)
   */
  async reconcileBalance(orgId: string, userId: string) {
    const entries = await this.prisma.creditLedgerEntry.findMany({
      where: {
        orgId,
        userId,
      },
    });

    const calculatedBalance = entries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    const storedBalance = await this.getBalance(orgId, userId);

    if (calculatedBalance !== storedBalance) {
      this.logger.warn(
        `Balance mismatch for user ${userId}: calculated=${calculatedBalance}, stored=${storedBalance}`
      );

      // Fix the balance
      await this.prisma.creditBalance.update({
        where: {
          orgId_userId: {
            orgId,
            userId,
          },
        },
        data: {
          balance: calculatedBalance,
        },
      });

      return {
        reconciled: true,
        previousBalance: storedBalance,
        correctedBalance: calculatedBalance,
      };
    }

    return {
      reconciled: false,
      balance: storedBalance,
    };
  }

  /**
   * Redeem credits (staff-initiated, e.g., scanning QR)
   */
  async redeemCredits(
    orgId: string,
    userId: string,
    amount: number,
    staffId: string,
    memo?: string
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Redemption amount must be positive');
    }

    return this.adjustCredits(
      orgId,
      {
        userId,
        amount: -amount, // Negative for debit
        reasonCode: 'PURCHASE',
        memo: memo || 'Credit redemption',
      },
      staffId
    );
  }

  /**
   * Export transaction history to CSV format
   */
  async exportTransactionHistory(
    orgId: string,
    userId: string,
    filters?: GetHistoryDto
  ): Promise<string> {
    const { transactions } = await this.getTransactionHistory(orgId, userId, {
      ...filters,
      limit: 10000, // Export max 10k transactions
    });

    // CSV header
    const headers = ['Date', 'Amount', 'Balance After', 'Type', 'Memo', 'Created By'];
    const csvLines = [headers.join(',')];

    // CSV rows
    let runningBalance = await this.getBalance(orgId, userId);
    for (const entry of transactions.reverse()) {
      const date = entry.createdAt.toISOString();
      const amount = entry.amount;
      const reasonCode = entry.reasonCode;
      const memo = (entry.memo || '').replace(/"/g, '""'); // Escape quotes
      const createdBy = (entry.createdByUser?.name || 'System').replace(/"/g, '""');

      const row = [
        date,
        amount.toString(),
        runningBalance.toString(),
        reasonCode,
        `"${memo}"`,
        `"${createdBy}"`,
      ];
      csvLines.push(row.join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Get all user balances for an organization
   */
  async getAllBalances(orgId: string) {
    const balances = await this.prisma.creditBalance.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        balance: 'desc',
      },
    });

    return balances.map(b => ({
      userId: b.userId,
      userName: b.user.name,
      userEmail: b.user.email,
      balance: b.balance,
      lastTransactionAt: b.lastTransactionAt,
    }));
  }
}
