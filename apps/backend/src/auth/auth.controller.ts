import { Controller, Post, Body, Get, UseGuards, Delete, Patch, Param, Query, Logger, Res, Headers } from '@nestjs/common';
import { Response } from 'express';
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
  private readonly logger = new Logger(AuthController.name);

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

  /**
   * Permanently delete the authenticated user's account.
   * Required for App Store compliance (Apple/Google).
   *
   * This action is irreversible and will delete:
   * - User profile and credentials
   * - All organization memberships
   * - Credit balances and history
   * - Tournament entries and decklists
   * - Match history
   * - Notifications and preferences
   * - Rating history and rankings
   */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1 deletion per minute (prevent accidents)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.deleteAccount(user.id);
  }

  /**
   * Update the authenticated user's profile.
   * Currently supports updating the display name.
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 updates per minute
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updates: { name?: string },
  ) {
    return this.authService.updateProfile(user.id, updates);
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

  // Mobile-specific OAuth callback endpoint
  // Discord redirects here -> we exchange code -> we redirect to deep link
  @Get('discord/mobile-callback')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async discordMobileCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string | undefined,
    @Headers('user-agent') userAgent: string,
    @Res() res: Response,
  ) {
    this.logger.log('=== Discord Mobile Callback Received ===');
    this.logger.log('Has code:', !!code);
    this.logger.log('Has state:', !!state);
    this.logger.log('Error:', error);
    this.logger.log('User-Agent:', userAgent);

    // This is the mobile-specific callback endpoint, so ALWAYS use HTTP 302 redirect
    // User agent detection is unreliable with Chrome Custom Tabs and in-app browsers
    const isMobileDevice = true;

    // Handle OAuth errors (user cancelled, etc.)
    if (error) {
      this.logger.log('OAuth error, redirecting with error:', error);
      const errorMessage = error === 'access_denied' ? 'Discord login cancelled' : error;
      return this.handleMobileRedirect(res, { error: errorMessage }, isMobileDevice);
    }

    if (!code || !state) {
      this.logger.error('Missing code or state in callback');
      return this.handleMobileRedirect(res, { error: 'Invalid callback - missing code or state' }, isMobileDevice);
    }

    try {
      // Use the backend callback URL as redirect URI since that's what Discord called
      const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/auth/discord/mobile-callback`;
      this.logger.log('Exchanging code with redirect URI:', redirectUri);

      const result = await this.authService.handleDiscordCallback(code, state, redirectUri);

      this.logger.log('Token exchange successful, redirecting to app');
      this.logger.log('User:', result.user.email);

      // Redirect to app with tokens via HTTP 302 (most reliable for mobile)
      return this.handleMobileRedirect(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }, isMobileDevice);
    } catch (err: any) {
      this.logger.error('Mobile Discord callback error:', err);
      return this.handleMobileRedirect(res, { error: err.message || 'Discord login failed' }, isMobileDevice);
    }
  }

  // Handle mobile redirect - use HTTP 302 for mobile, HTML for web
  private handleMobileRedirect(
    res: Response,
    params: { accessToken?: string; refreshToken?: string; error?: string },
    isMobileDevice: boolean,
  ) {
    const deepLinkParams = new URLSearchParams();
    if (params.accessToken) deepLinkParams.set('accessToken', params.accessToken);
    if (params.refreshToken) deepLinkParams.set('refreshToken', params.refreshToken);
    if (params.error) deepLinkParams.set('error', params.error);

    const deepLink = `genki-tcg://auth/callback?${deepLinkParams.toString()}`;

    if (isMobileDevice) {
      // MOBILE: Use HTTP 302 redirect to deep link
      // This works better with in-app browsers than JavaScript redirects
      this.logger.log('Using HTTP 302 redirect to:', deepLink);
      return res.redirect(302, deepLink);
    } else {
      // WEB: Return HTML that posts message to opener window
      return res.send(this.generateDeepLinkRedirect(params));
    }
  }

  // Helper to generate HTML that opens deep link or posts message to opener (for web)
  private generateDeepLinkRedirect(params: {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
  }) {
    const deepLinkParams = new URLSearchParams();
    if (params.accessToken) deepLinkParams.set('accessToken', params.accessToken);
    if (params.refreshToken) deepLinkParams.set('refreshToken', params.refreshToken);
    if (params.error) deepLinkParams.set('error', params.error);

    const deepLink = `genki-tcg://auth/callback?${deepLinkParams.toString()}`;

    // For web compatibility, we'll post a message to the opener window
    const authData = JSON.stringify({
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      error: params.error,
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Genki TCG - Redirecting...</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
            }
            .spinner {
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-top: 4px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .message {
              font-size: 18px;
              margin-bottom: 1rem;
            }
            .note {
              font-size: 14px;
              opacity: 0.8;
            }
            a {
              color: white;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <div class="message">
              ${params.error ? 'Login failed' : 'Login successful!'}
            </div>
            <div class="note">
              ${params.error
                ? `Error: ${params.error}`
                : 'Redirecting to Genki TCG...'
              }
            </div>
            <div class="note" style="margin-top: 1rem;">
              If you're not redirected automatically,
              <a href="${deepLink}">click here</a>.
            </div>
          </div>
          <script>
            const authData = ${authData};
            const deepLinkUrl = ${JSON.stringify(deepLink)};

            // Detect if this is a mobile deep link (genki-tcg://)
            const isMobile = deepLinkUrl.startsWith('genki-tcg://');

            if (isMobile) {
              // MOBILE: Open deep link and close browser
              // Immediately try to open the deep link
              window.location.href = deepLinkUrl;

              // Fallback methods in case first attempt fails
              setTimeout(() => {
                window.location.href = deepLinkUrl;
              }, 100);

              setTimeout(() => {
                const link = document.createElement('a');
                link.href = deepLinkUrl;
                link.click();
              }, 200);

              // Auto-close after short delay
              setTimeout(() => {
                window.close();
              }, 500);
            } else if (window.opener && !window.opener.closed) {
              // WEB: Post message to opener window
              const message = { type: 'DISCORD_AUTH_CALLBACK', ...authData };
              window.opener.postMessage(message, '*');

              // Retry to ensure it's received
              setTimeout(() => {
                window.opener.postMessage(message, '*');
              }, 100);

              // Auto-close after message is sent
              setTimeout(() => {
                window.close();
              }, 1000);
            } else {
              // FALLBACK: Show manual link (no opener and not mobile)
            }
          </script>
        </body>
      </html>
    `;
  }
}
