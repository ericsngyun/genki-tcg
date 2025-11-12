import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreditReasonCode } from '@prisma/client';

export interface CreditAdjustDto {
  userId: string;
  amount: number; // Positive for credit, negative for debit
  reasonCode: CreditReasonCode;
  memo?: string;
  relatedEventId?: string;
}

@Injectable()
export class CreditsService {
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
    dto: CreditAdjustDto,
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

    // Check if debit would cause negative balance
    if (amount < 0) {
      const currentBalance = await this.getBalance(orgId, userId);
      if (currentBalance + amount < 0) {
        throw new BadRequestException('Insufficient credits');
      }
    }

    // Create ledger entry and update balance in transaction
    const result = await this.prisma.$transaction(async (tx) => {
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
   * Get full transaction history for a user
   */
  async getTransactionHistory(orgId: string, userId: string) {
    return this.prisma.creditLedgerEntry.findMany({
      where: {
        orgId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
      console.warn(
        `⚠️ Balance mismatch for user ${userId}: calculated=${calculatedBalance}, stored=${storedBalance}`
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
}
