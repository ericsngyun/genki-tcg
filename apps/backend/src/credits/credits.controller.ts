import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { CreditsService, CreditAdjustDto } from './credits.service';
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
   * Get full transaction history (staff only)
   */
  @Get('history/:userId')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async getHistory(
    @CurrentUser() user: any,
    @Param('userId') userId: string
  ) {
    return this.creditsService.getTransactionHistory(user.orgId, userId);
  }

  /**
   * Adjust credits (staff/owner only)
   */
  @Post('adjust')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async adjustCredits(@CurrentUser() user: any, @Body() dto: CreditAdjustDto) {
    return this.creditsService.adjustCredits(user.orgId, dto, user.id);
  }

  /**
   * Redeem credits (staff/owner only)
   */
  @Post('redeem')
  @UseGuards(RolesGuard)
  @Roles('OWNER', 'STAFF')
  async redeemCredits(
    @CurrentUser() user: any,
    @Body() body: { userId: string; amount: number; memo?: string }
  ) {
    return this.creditsService.redeemCredits(
      user.orgId,
      body.userId,
      body.amount,
      user.id,
      body.memo
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
