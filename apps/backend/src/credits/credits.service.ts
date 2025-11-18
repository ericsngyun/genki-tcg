import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  AdjustCreditsDto,
  GetHistoryDto,
  BulkAdjustCreditsDto,
  GetAnalyticsDto,
  CreateRewardTemplateDto,
  UpdateRewardTemplateDto,
  ApplyRewardTemplateDto,
  BulkApplyRewardTemplateDto
} from './dto';

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

  /**
   * Bulk adjust credits for multiple users in a single transaction
   */
  async bulkAdjustCredits(
    orgId: string,
    dto: BulkAdjustCreditsDto,
    performedBy: string
  ) {
    const { adjustments, reasonCode, globalMemo, relatedEventId } = dto;

    // Validate all users are in org first
    const userIds = adjustments.map(adj => adj.userId);
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId,
        userId: { in: userIds },
      },
    });

    if (memberships.length !== userIds.length) {
      const foundUserIds = memberships.map(m => m.userId);
      const missingUsers = userIds.filter(id => !foundUserIds.includes(id));
      throw new BadRequestException(
        `Users not found in organization: ${missingUsers.join(', ')}`
      );
    }

    // Check for negative balance issues
    for (const adjustment of adjustments) {
      if (adjustment.amount < 0) {
        const currentBalance = await this.getBalance(orgId, adjustment.userId);
        if (currentBalance + adjustment.amount < 0) {
          const user = memberships.find(m => m.userId === adjustment.userId);
          throw new BadRequestException(
            `Insufficient credits for user ${adjustment.userId}`
          );
        }
      }
    }

    // Execute all adjustments in a single transaction
    const results = await this.prisma.$transaction(async (tx) => {
      const entries = [];
      const balances = [];

      for (const adjustment of adjustments) {
        const memo = adjustment.memo || globalMemo;

        // Insert ledger entry
        const entry = await tx.creditLedgerEntry.create({
          data: {
            orgId,
            userId: adjustment.userId,
            amount: adjustment.amount,
            reasonCode,
            memo,
            relatedEventId,
            createdBy: performedBy,
          },
        });
        entries.push(entry);

        // Update or create balance
        const balance = await tx.creditBalance.upsert({
          where: {
            orgId_userId: {
              orgId,
              userId: adjustment.userId,
            },
          },
          update: {
            balance: {
              increment: adjustment.amount,
            },
            lastTransactionAt: new Date(),
          },
          create: {
            orgId,
            userId: adjustment.userId,
            balance: adjustment.amount,
            lastTransactionAt: new Date(),
          },
        });
        balances.push(balance);
      }

      return { entries, balances };
    });

    // Audit log for bulk operation
    await this.auditService.log({
      orgId,
      action: 'CREDIT_BULK_ADJUST',
      performedBy,
      metadata: {
        count: adjustments.length,
        reasonCode,
        totalAmount: adjustments.reduce((sum, adj) => sum + adj.amount, 0),
        userIds: adjustments.map(adj => adj.userId),
      },
    });

    return {
      success: true,
      count: adjustments.length,
      entries: results.entries,
    };
  }

  /**
   * Get credit analytics for the organization
   */
  async getAnalytics(orgId: string, filters?: GetAnalyticsDto) {
    const { period = 'month', startDate, endDate } = filters || {};

    // Calculate date range
    let dateFilter: any = {};
    const now = new Date();

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    } else {
      switch (period) {
        case 'day':
          dateFilter.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          };
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter.createdAt = { gte: weekAgo };
          break;
        case 'month':
          dateFilter.createdAt = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          };
          break;
        case 'year':
          dateFilter.createdAt = {
            gte: new Date(now.getFullYear(), 0, 1),
          };
          break;
        case 'all':
          // No filter
          break;
      }
    }

    // Get all transactions in period
    const transactions = await this.prisma.creditLedgerEntry.findMany({
      where: {
        orgId,
        ...dateFilter,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate statistics
    const totalCreditsIssued = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCreditsRedeemed = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netChange = totalCreditsIssued - totalCreditsRedeemed;

    // Get breakdown by reason code
    const byReasonCode = transactions.reduce((acc, t) => {
      const code = t.reasonCode;
      if (!acc[code]) {
        acc[code] = { count: 0, total: 0 };
      }
      acc[code].count++;
      acc[code].total += t.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    // Get current total in circulation
    const allBalances = await this.prisma.creditBalance.aggregate({
      where: { orgId },
      _sum: { balance: true },
    });

    const totalInCirculation = allBalances._sum.balance || 0;

    // Get top users by balance
    const topUsers = await this.prisma.creditBalance.findMany({
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
      take: 10,
    });

    // Daily breakdown for charts
    const dailyBreakdown = this.groupTransactionsByDay(transactions);

    return {
      period,
      totalInCirculation,
      totalCreditsIssued,
      totalCreditsRedeemed,
      netChange,
      transactionCount: transactions.length,
      byReasonCode,
      topUsers: topUsers.map(u => ({
        userId: u.userId,
        userName: u.user.name,
        userEmail: u.user.email,
        balance: u.balance,
      })),
      dailyBreakdown,
    };
  }

  /**
   * Helper: Group transactions by day for chart data
   */
  private groupTransactionsByDay(transactions: any[]) {
    const grouped = transactions.reduce((acc, t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { issued: 0, redeemed: 0, net: 0, count: 0 };
      }
      acc[date].count++;
      if (t.amount > 0) {
        acc[date].issued += t.amount;
      } else {
        acc[date].redeemed += Math.abs(t.amount);
      }
      acc[date].net += t.amount;
      return acc;
    }, {} as Record<string, { issued: number; redeemed: number; net: number; count: number }>);

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  // ===================================================================
  // Reward Templates
  // ===================================================================

  /**
   * Create a new reward template
   */
  async createRewardTemplate(
    orgId: string,
    dto: CreateRewardTemplateDto,
    createdBy: string
  ) {
    const template = await this.prisma.creditRewardTemplate.create({
      data: {
        orgId,
        name: dto.name,
        description: dto.description,
        amount: dto.amount,
        reasonCode: dto.reasonCode,
        isActive: dto.isActive ?? true,
        createdBy,
      },
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

    await this.auditService.log({
      orgId,
      action: 'REWARD_TEMPLATE_CREATE',
      performedBy: createdBy,
      metadata: {
        templateId: template.id,
        name: template.name,
        amount: template.amount,
      },
    });

    return template;
  }

  /**
   * Get all reward templates for an organization
   */
  async getRewardTemplates(orgId: string, activeOnly: boolean = false) {
    const templates = await this.prisma.creditRewardTemplate.findMany({
      where: {
        orgId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return templates;
  }

  /**
   * Get a single reward template
   */
  async getRewardTemplate(orgId: string, templateId: string) {
    const template = await this.prisma.creditRewardTemplate.findFirst({
      where: {
        id: templateId,
        orgId,
      },
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

    if (!template) {
      throw new NotFoundException('Reward template not found');
    }

    return template;
  }

  /**
   * Update a reward template
   */
  async updateRewardTemplate(
    orgId: string,
    templateId: string,
    dto: UpdateRewardTemplateDto,
    updatedBy: string
  ) {
    const existing = await this.getRewardTemplate(orgId, templateId);

    const updated = await this.prisma.creditRewardTemplate.update({
      where: {
        id: templateId,
      },
      data: dto,
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

    await this.auditService.log({
      orgId,
      action: 'REWARD_TEMPLATE_UPDATE',
      performedBy: updatedBy,
      metadata: {
        templateId: updated.id,
        name: updated.name,
        changes: dto,
      },
    });

    return updated;
  }

  /**
   * Delete a reward template
   */
  async deleteRewardTemplate(
    orgId: string,
    templateId: string,
    deletedBy: string
  ) {
    const existing = await this.getRewardTemplate(orgId, templateId);

    await this.prisma.creditRewardTemplate.delete({
      where: {
        id: templateId,
      },
    });

    await this.auditService.log({
      orgId,
      action: 'REWARD_TEMPLATE_DELETE',
      performedBy: deletedBy,
      metadata: {
        templateId,
        name: existing.name,
      },
    });

    return { success: true };
  }

  /**
   * Apply a reward template to a single user
   */
  async applyRewardTemplate(
    orgId: string,
    dto: ApplyRewardTemplateDto,
    performedBy: string
  ) {
    const template = await this.getRewardTemplate(orgId, dto.templateId);

    if (!template.isActive) {
      throw new BadRequestException('This reward template is inactive');
    }

    const memo = dto.memo || `Reward: ${template.name}${template.description ? ` - ${template.description}` : ''}`;

    return this.adjustCredits(
      orgId,
      {
        userId: dto.userId,
        amount: template.amount,
        reasonCode: template.reasonCode,
        memo,
      },
      performedBy
    );
  }

  /**
   * Apply a reward template to multiple users
   */
  async bulkApplyRewardTemplate(
    orgId: string,
    dto: BulkApplyRewardTemplateDto,
    performedBy: string
  ) {
    const template = await this.getRewardTemplate(orgId, dto.templateId);

    if (!template.isActive) {
      throw new BadRequestException('This reward template is inactive');
    }

    const globalMemo = dto.globalMemo || `Reward: ${template.name}${template.description ? ` - ${template.description}` : ''}`;

    const adjustments = dto.userIds.map(userId => ({
      userId,
      amount: template.amount,
    }));

    return this.bulkAdjustCredits(
      orgId,
      {
        adjustments,
        reasonCode: template.reasonCode,
        globalMemo,
      },
      performedBy
    );
  }
}
