import {
  Controller,
  Get,
  Post,
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
import { AdjustCreditsDto, RedeemCreditsDto, GetHistoryDto } from './dto';
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
}
