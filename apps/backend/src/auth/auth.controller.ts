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
  async getMe(@CurrentUser() user: User) {
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
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
  async getDiscordAuthUrl(
    @Body() body: { redirectUri: string; state?: string },
  ) {
    return this.authService.getDiscordAuthUrl(body.redirectUri, body.state);
  }

  @Post('discord/callback')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 attempts per minute
  async discordCallback(@Body() body: { code: string; redirectUri: string }) {
    return this.authService.handleDiscordCallback(body.code, body.redirectUri);
  }

  @Post('discord/link')
  @UseGuards(JwtAuthGuard)
  async linkDiscord(
    @CurrentUser() user: User,
    @Body() body: { code: string; redirectUri: string },
  ) {
    return this.authService.linkDiscordAccount(
      user.id,
      body.code,
      body.redirectUri,
    );
  }

  @Post('discord/unlink')
  @UseGuards(JwtAuthGuard)
  async unlinkDiscord(@CurrentUser() user: User) {
    return this.authService.unlinkDiscordAccount(user.id);
  }
}
