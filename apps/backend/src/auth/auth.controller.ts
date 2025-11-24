import { Controller, Post, Body, Get, UseGuards, Delete, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { User } from '@prisma/client';
import type { AuthenticatedUser } from './types/jwt-payload.type';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 signups per hour
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 login attempts per 15 minutes
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    // Fetch organization details
    const org = await this.authService.getOrganization(user.orgId);

    // user object includes orgId and role from JWT strategy
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        discordUsername: user.discordUsername,
        createdAt: user.createdAt,
      },
      // Include organization context for debugging and multi-org support
      organization: {
        id: user.orgId,
        name: org?.name || 'Unknown',
        slug: org?.slug,
        role: user.role,
      },
    };
  }

  // ============================================================================
  // Refresh Token Endpoints
  // ============================================================================

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.revokeRefreshToken(dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: User) {
    return this.authService.revokeAllRefreshTokens(user.id);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: User) {
    return this.authService.getUserSessions(user.id);
  }

  // ============================================================================
  // Password Reset Endpoints
  // ============================================================================

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 requests per hour
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 resets per hour
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ============================================================================
  // Discord OAuth Endpoints
  // ============================================================================

  @Post('discord/url')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  async getDiscordAuthUrl(
    @Body() body: { redirectUri: string }
  ) {
    // State is now generated server-side for security
    return this.authService.getDiscordAuthUrl(body.redirectUri);
  }

  @Post('discord/callback')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  async discordCallback(
    @Body() body: { code: string; state: string; redirectUri: string }
  ) {
    // State validation happens in service
    return this.authService.handleDiscordCallback(body.code, body.state, body.redirectUri);
  }

  @Post('discord/link')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  async linkDiscord(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { code: string; redirectUri: string }
  ) {
    return this.authService.linkDiscordAccount(
      user.id,
      body.code,
      body.redirectUri
    );
  }

  @Post('discord/unlink')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  async unlinkDiscord(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.unlinkDiscordAccount(user.id);
  }
}
