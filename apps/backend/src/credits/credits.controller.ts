import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Query,
  Param,
  Res,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Response } from 'express';
import { CreditsService } from './credits.service';
import {
  AdjustCreditsDto,
  RedeemCreditsDto,
  GetHistoryDto,
  BulkAdjustCreditsDto,
  GetAnalyticsDto,
  CreateRewardTemplateDto,
  UpdateRewardTemplateDto,
  ApplyRewardTemplateDto,
  BulkApplyRewardTemplateDto
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  /**
   * Get current user's balance and recent transactions
   */
  @Get('me')
  async getMyBalance(@CurrentUser() user: any) {
    return this.creditsService.getBalanceWithHistory(user.orgId, user.id);
  }

  /**
   * Get balance for specific user (staff only)
   */
  @Get('balance/:userId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getBalance(
    @CurrentUser() user: any,
    @Param('userId') userId: string
  ) {
    return this.creditsService.getBalanceWithHistory(user.orgId, userId);
  }

  /**
   * Get full transaction history with pagination and filtering (staff only)
   */
  @Get('history/:userId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getHistory(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Query() filters: GetHistoryDto
  ) {
    return this.creditsService.getTransactionHistory(user.orgId, userId, filters);
  }

  /**
   * Export transaction history to CSV (staff only)
   */
  @Get('history/:userId/export')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportHistory(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Query() filters: GetHistoryDto,
    @Res() res: Response
  ) {
    const csv = await this.creditsService.exportTransactionHistory(
      user.orgId,
      userId,
      filters
    );

    // Get user info for filename
    const userInfo = await this.creditsService.getBalanceWithHistory(user.orgId, userId);
    const filename = `credits-history-${userId}-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Get all user balances for the organization (staff only)
   */
  @Get('all-balances')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getAllBalances(@CurrentUser() user: any) {
    return this.creditsService.getAllBalances(user.orgId);
  }

  /**
   * Adjust credits (staff/owner only)
   */
  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async adjustCredits(@CurrentUser() user: any, @Body() dto: AdjustCreditsDto) {
    return this.creditsService.adjustCredits(user.orgId, dto, user.id);
  }

  /**
   * Redeem credits (staff/owner only)
   */
  @Post('redeem')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async redeemCredits(
    @CurrentUser() user: any,
    @Body() dto: RedeemCreditsDto
  ) {
    return this.creditsService.redeemCredits(
      user.orgId,
      dto.userId,
      dto.amount,
      user.id,
      dto.memo
    );
  }

  /**
   * Reconcile balance (owner only, for data integrity)
   */
  @Post('reconcile/:userId')
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  async reconcileBalance(
    @CurrentUser() user: any,
    @Param('userId') userId: string
  ) {
    return this.creditsService.reconcileBalance(user.orgId, userId);
  }

  /**
   * Bulk adjust credits for multiple users (staff/owner only)
   */
  @Post('bulk-adjust')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async bulkAdjustCredits(
    @CurrentUser() user: any,
    @Body() dto: BulkAdjustCreditsDto
  ) {
    return this.creditsService.bulkAdjustCredits(user.orgId, dto, user.id);
  }

  /**
   * Get credit analytics for the organization (staff/owner only)
   */
  @Get('analytics')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAnalytics(
    @CurrentUser() user: any,
    @Query() filters: GetAnalyticsDto
  ) {
    return this.creditsService.getAnalytics(user.orgId, filters);
  }

  // ===================================================================
  // Reward Templates
  // ===================================================================

  /**
   * Get all reward templates (staff/owner only)
   */
  @Get('templates')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getRewardTemplates(
    @CurrentUser() user: any,
    @Query('activeOnly') activeOnly?: string
  ) {
    return this.creditsService.getRewardTemplates(
      user.orgId,
      activeOnly === 'true'
    );
  }

  /**
   * Get a single reward template (staff/owner only)
   */
  @Get('templates/:templateId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getRewardTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string
  ) {
    return this.creditsService.getRewardTemplate(user.orgId, templateId);
  }

  /**
   * Create a new reward template (staff/owner only)
   */
  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async createRewardTemplate(
    @CurrentUser() user: any,
    @Body() dto: CreateRewardTemplateDto
  ) {
    return this.creditsService.createRewardTemplate(user.orgId, dto, user.id);
  }

  /**
   * Update a reward template (staff/owner only)
   */
  @Put('templates/:templateId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateRewardTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateRewardTemplateDto
  ) {
    return this.creditsService.updateRewardTemplate(
      user.orgId,
      templateId,
      dto,
      user.id
    );
  }

  /**
   * Delete a reward template (staff/owner only)
   */
  @Delete('templates/:templateId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async deleteRewardTemplate(
    @CurrentUser() user: any,
    @Param('templateId') templateId: string
  ) {
    return this.creditsService.deleteRewardTemplate(
      user.orgId,
      templateId,
      user.id
    );
  }

  /**
   * Apply a reward template to a single user (staff/owner only)
   */
  @Post('templates/apply')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async applyRewardTemplate(
    @CurrentUser() user: any,
    @Body() dto: ApplyRewardTemplateDto
  ) {
    return this.creditsService.applyRewardTemplate(user.orgId, dto, user.id);
  }

  /**
   * Apply a reward template to multiple users (staff/owner only)
   */
  @Post('templates/bulk-apply')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async bulkApplyRewardTemplate(
    @CurrentUser() user: any,
    @Body() dto: BulkApplyRewardTemplateDto
  ) {
    return this.creditsService.bulkApplyRewardTemplate(
      user.orgId,
      dto,
      user.id
    );
  }
}
