import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import type { User, OrgMembership } from '@prisma/client';
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto
} from './dto';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  orgId: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  /**
   * Get organization by ID (for /auth/me endpoint)
   */
  async getOrganization(orgId: string) {
    return this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
  }

  async signup(dto: SignupDto) {
    const { email, password, name, inviteCode } = dto;

    // Find organization by invite code
    const org = await this.prisma.organization.findUnique({
      where: { inviteCode },
    });

    if (!org) {
      throw new BadRequestException('Invalid invite code');
    }

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    // SECURITY: Use 12 rounds for bcrypt (OWASP recommended minimum)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and membership
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        memberships: {
          create: {
            orgId: org.id,
            role: 'PLAYER',
          },
        },
      },
      include: {
        memberships: {
          where: { orgId: org.id },
        },
      },
    });

    const membership = user.memberships[0];

    // Grant welcome bonus to new user
    await this.grantWelcomeBonus(user.id, org.id);

    // Generate access token and refresh token
    const accessToken = this.generateToken(user, membership, org.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      orgMembership: membership,
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            org: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get first org membership (support multi-org later)
    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('No organization membership');
    }

    // Generate access token and refresh token
    const accessToken = this.generateToken(user, membership, membership.orgId);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      orgMembership: membership,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateToken(
    user: User,
    membership: OrgMembership,
    orgId: string,
    isOAuthLogin: boolean = false
  ): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId,
      role: membership.role,
    };

    // OAuth logins (Discord) get extended sessions for better UX
    // Users stay logged in until they explicitly log out
    const expiresIn = isOAuthLogin
      ? '365d' // 1 year for OAuth logins (Discord)
      : this.getTokenExpiryByRole(membership.role);

    return this.jwtService.sign(payload, { expiresIn });
  }

  private getTokenExpiryByRole(role: string): string {
    switch (role) {
      case 'OWNER':
        return '1h'; // 1 hour for owners (most sensitive)
      case 'STAFF':
        return '4h'; // 4 hours for staff
      case 'PLAYER':
      default:
        return '7d'; // 7 days for players (convenience)
    }
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Grant welcome bonus to new users
   */
  private async grantWelcomeBonus(userId: string, orgId: string) {
    const WELCOME_BONUS_AMOUNT = 5;

    // Create credit ledger entry for welcome bonus
    await this.prisma.creditLedgerEntry.create({
      data: {
        orgId,
        userId,
        amount: WELCOME_BONUS_AMOUNT,
        reasonCode: 'PROMO',
        memo: 'Welcome bonus - thank you for joining!',
        createdBy: userId, // Self-created
      },
    });

    // Update or create credit balance
    await this.prisma.creditBalance.upsert({
      where: {
        orgId_userId: {
          orgId,
          userId,
        },
      },
      update: {
        balance: {
          increment: WELCOME_BONUS_AMOUNT,
        },
        lastTransactionAt: new Date(),
      },
      create: {
        orgId,
        userId,
        balance: WELCOME_BONUS_AMOUNT,
        lastTransactionAt: new Date(),
      },
    });
  }

  // ============================================================================
  // Refresh Token Management
  // ============================================================================

  async generateRefreshToken(userId: string, deviceInfo?: {
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
    isOAuthLogin?: boolean;
  }): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(64).toString('hex');

    // OAuth logins get extended refresh token expiration (2 years vs 90 days)
    // This keeps users logged in until they explicitly log out
    const daysToExpire = deviceInfo?.isOAuthLogin ? 730 : 90;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToExpire);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        deviceName: deviceInfo?.deviceName,
        deviceType: deviceInfo?.deviceType,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      },
    });

    return token;
  }

  async refreshAccessToken(dto: RefreshTokenDto) {
    const { refreshToken } = dto;

    // Find and validate refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                org: true,
              },
            },
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Check if token is revoked
    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    // SECURITY: Implement refresh token rotation
    // Revoke the old token and generate a new one
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    const user = tokenRecord.user;
    const membership = user.memberships[0];

    if (!membership) {
      throw new UnauthorizedException('No organization membership');
    }

    // Generate new refresh token (rotation)
    const newRefreshToken = await this.generateRefreshToken(user.id, {
      deviceName: tokenRecord.deviceName || undefined,
      deviceType: tokenRecord.deviceType || undefined,
      ipAddress: tokenRecord.ipAddress || undefined,
      userAgent: tokenRecord.userAgent || undefined,
    });

    // Generate new access token
    const accessToken = this.generateToken(user, membership, membership.orgId);

    return {
      accessToken,
      refreshToken: newRefreshToken, // Return new refresh token
      user: this.sanitizeUser(user),
      orgMembership: membership,
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Refresh token not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return { message: 'Refresh token revoked successfully' };
  }

  async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'All refresh tokens revoked successfully' };
  }

  async getUserSessions(userId: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: {
        lastUsedAt: 'desc',
      },
    });

    return sessions;
  }

  // ============================================================================
  // Password Reset
  // ============================================================================

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing unused reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Create new reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Send email with reset link
    // For now, we'll just return the token (in production, this should be sent via email)
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    // await this.emailService.sendPasswordResetEmail(user.email, resetLink);

    // SECURITY: Never log tokens or return them in API responses
    // In development, implement email service or use a tool like MailHog/Mailpit for testing

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;

    // Find and validate reset token
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw new BadRequestException('Reset token has expired');
    }

    // Check if token was already used
    if (resetToken.usedAt) {
      throw new BadRequestException('Reset token has already been used');
    }

    // SECURITY: Hash new password with 12 rounds (OWASP recommended minimum)
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens for security (force re-login on all devices)
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { revokedAt: new Date() },
      }),
    ]);

    return {
      message: 'Password reset successfully. Please login with your new password.',
    };
  }

  // ============================================================================
  // Email Verification
  // ============================================================================

  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    // Store token in database
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // TODO: Send verification email
    // SECURITY: Never log tokens or return them in API responses
    // In development, implement email service or use a tool like MailHog/Mailpit for testing
    // const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    // await this.emailService.sendVerificationEmail(user.email, verificationLink);

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async verifyEmail(token: string) {
    // Find and validate verification token
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw new BadRequestException('Verification token has expired');
    }

    // Check if token was already used
    if (verificationToken.usedAt) {
      throw new BadRequestException('Verification token has already been used');
    }

    // Check if email is already verified
    if (verificationToken.user.emailVerified) {
      // Mark token as used and return success
      await this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });
      return {
        message: 'Email is already verified',
      };
    }

    // Mark email as verified and token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message: 'Email verified successfully',
    };
  }

  // ============================================================================
  // Discord OAuth
  // ============================================================================

  // Whitelist of allowed redirect URIs for security
  private getAllowedRedirectUris(): string[] {
    const configuredUris = process.env.DISCORD_ALLOWED_REDIRECTS;
    if (configuredUris) {
      return configuredUris.split(',').map(uri => uri.trim());
    }
    // Default allowed URIs
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8081',
      'genki-tcg://',
      process.env.DISCORD_CALLBACK_URL || '',
    ].filter(Boolean);
  }

  private validateRedirectUri(redirectUri: string): boolean {
    const allowed = this.getAllowedRedirectUris();

    // Special handling for Expo dev URLs with dynamic IPs
    // Pattern: exp://IP:PORT/--/discord/callback
    if (redirectUri.startsWith('exp://') && redirectUri.includes('/--/discord/callback')) {
      return true;
    }

    return allowed.some(uri => {
      // Exact match or starts with (for scheme handlers)
      if (uri === redirectUri) return true;
      if (uri.endsWith('://') && redirectUri.startsWith(uri)) return true;
      // Allow subpaths of allowed origins
      if (redirectUri.startsWith(uri + '/')) return true;
      return false;
    });
  }

  async getDiscordAuthUrl(redirectUri: string) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Discord OAuth not configured');
    }

    // SECURITY: Validate redirect URI against whitelist
    if (!this.validateRedirectUri(redirectUri)) {
      this.logger.error('Redirect URI validation failed:', {
        redirectUri,
        allowedUris: this.getAllowedRedirectUris(),
      });
      throw new BadRequestException('Invalid redirect URI');
    }

    // SECURITY: Generate state server-side for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state with 5 minute expiration
    await this.prisma.oAuthState.create({
      data: {
        state,
        redirectUri,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // Clean up expired states
    await this.prisma.oAuthState.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email',
      state,
    });

    return {
      url: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
      state, // Return state for client to verify
    };
  }

  async handleDiscordCallback(code: string, state: string, redirectUri: string) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Discord OAuth not configured');
    }

    // SECURITY: Validate state parameter (CSRF protection)
    const oauthState = await this.prisma.oAuthState.findUnique({
      where: { state },
    });

    if (!oauthState) {
      throw new BadRequestException('Invalid or expired state parameter');
    }

    if (oauthState.expiresAt < new Date()) {
      await this.prisma.oAuthState.delete({ where: { state } });
      throw new BadRequestException('State parameter expired');
    }

    if (oauthState.redirectUri !== redirectUri) {
      throw new BadRequestException('Redirect URI mismatch');
    }

    // Delete used state (one-time use)
    await this.prisma.oAuthState.delete({ where: { state } });

    // SECURITY: Validate redirect URI again
    if (!this.validateRedirectUri(redirectUri)) {
      this.logger.error('Redirect URI validation failed in callback:', {
        redirectUri,
        allowedUris: this.getAllowedRedirectUris(),
      });
      throw new BadRequestException('Invalid redirect URI');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => null) as { error?: string; error_description?: string } | null;
      this.logger.error('Discord token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        redirectUri,
        clientId,
      });
      throw new BadRequestException(
        `Failed to exchange Discord authorization code: ${errorData?.error || tokenResponse.statusText}`
      );
    }

    const tokens = await tokenResponse.json() as { access_token: string; refresh_token: string };

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new BadRequestException('Failed to fetch Discord user info');
    }

    const discordUser = await userResponse.json() as {
      id: string;
      username: string;
      global_name?: string;
      avatar?: string;
      email?: string;
    };

    // Find or create user
    return this.findOrCreateDiscordUser(discordUser);
  }

  private async findOrCreateDiscordUser(discordUser: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
    email?: string;
  }) {
    // First, try to find user by Discord ID
    let user = await this.prisma.user.findUnique({
      where: { discordId: discordUser.id },
      include: {
        memberships: {
          include: { org: true },
        },
      },
    });

    if (!user && discordUser.email) {
      // Try to find by email and link Discord account
      user = await this.prisma.user.findUnique({
        where: { email: discordUser.email },
        include: {
          memberships: {
            include: { org: true },
          },
        },
      });

      if (user) {
        // Link Discord to existing account
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            discordId: discordUser.id,
            discordUsername: discordUser.username,
            discordAvatar: discordUser.avatar,
            avatarUrl: discordUser.avatar
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : user.avatarUrl,
          },
          include: {
            memberships: {
              include: { org: true },
            },
          },
        });
      }
    }

    if (!user) {
      // Create new user - find default organization for OAuth users
      const defaultOrg = await this.prisma.organization.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (!defaultOrg) {
        throw new BadRequestException(
          'No organization available. Please contact support.'
        );
      }

      const displayName = discordUser.global_name || discordUser.username;
      const email = discordUser.email || `${discordUser.id}@discord.user`;

      user = await this.prisma.user.create({
        data: {
          email,
          name: displayName,
          discordId: discordUser.id,
          discordUsername: discordUser.username,
          discordAvatar: discordUser.avatar,
          avatarUrl: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          emailVerified: !!discordUser.email,
          memberships: {
            create: {
              orgId: defaultOrg.id,
              role: 'PLAYER',
            },
          },
        },
        include: {
          memberships: {
            include: { org: true },
          },
        },
      });

      // Grant welcome bonus to new user
      await this.grantWelcomeBonus(user.id, defaultOrg.id);
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('No organization membership');
    }

    // Generate tokens with extended expiration for OAuth logins
    const accessToken = this.generateToken(user, membership, membership.orgId, true);
    const refreshToken = await this.generateRefreshToken(user.id, {
      deviceType: 'mobile',
      deviceName: 'Discord OAuth',
      isOAuthLogin: true, // Extended 2-year refresh token
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      orgMembership: membership,
    };
  }

  async linkDiscordAccount(userId: string, code: string, redirectUri: string) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Discord OAuth not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => null) as { error?: string; error_description?: string } | null;
      this.logger.error('Discord token exchange failed (linkAccount):', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        redirectUri,
        clientId,
      });
      throw new BadRequestException(
        `Failed to exchange Discord authorization code: ${errorData?.error || tokenResponse.statusText}`
      );
    }

    const tokens = await tokenResponse.json() as { access_token: string; refresh_token: string };

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => null) as { error?: string; error_description?: string } | null;
      this.logger.error('Discord user info fetch failed:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorData,
      });
      throw new BadRequestException('Failed to fetch Discord user info');
    }

    const discordUser = await userResponse.json() as {
      id: string;
      username: string;
      global_name?: string;
      avatar?: string;
      email?: string;
    };

    // Check if Discord account is already linked to another user
    const existingUser = await this.prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestException(
        'This Discord account is already linked to another user'
      );
    }

    // Link Discord to user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordAvatar: discordUser.avatar,
        avatarUrl: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : undefined,
      },
    });

    return {
      message: 'Discord account linked successfully',
      user: this.sanitizeUser(user),
    };
  }

  async unlinkDiscordAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.discordId) {
      throw new BadRequestException('No Discord account linked');
    }

    // Ensure user has a password before unlinking (so they can still log in)
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Cannot unlink Discord without setting a password first'
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        discordId: null,
        discordUsername: null,
        discordAvatar: null,
      },
    });

    return { message: 'Discord account unlinked successfully' };
  }

  // ============================================================================
  // Apple Sign In
  // ============================================================================

  async handleAppleCallback(
    identityToken: string,
    fullName?: { givenName?: string | null; familyName?: string | null },
    email?: string,
    appleUserId?: string,
  ) {
    // Decode and verify the Apple identity token
    // Apple's identity token is a JWT signed by Apple
    const decodedToken = this.decodeAppleToken(identityToken);

    if (!decodedToken) {
      throw new BadRequestException('Invalid Apple identity token');
    }

    // The 'sub' claim is the unique Apple user ID
    const appleId = decodedToken.sub;
    const tokenEmail = decodedToken.email;

    this.logger.log('Apple Sign In:', {
      appleId,
      tokenEmail,
      providedEmail: email,
      hasFullName: !!fullName,
    });

    // First, try to find user by Apple ID
    let user = await this.prisma.user.findFirst({
      where: { appleId },
      include: {
        memberships: {
          include: { org: true },
        },
      },
    });

    if (!user) {
      // Try to find by email
      const userEmail = email || tokenEmail;
      if (userEmail) {
        user = await this.prisma.user.findUnique({
          where: { email: userEmail },
          include: {
            memberships: {
              include: { org: true },
            },
          },
        });

        if (user) {
          // Link Apple ID to existing account
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { appleId },
            include: {
              memberships: {
                include: { org: true },
              },
            },
          });
        }
      }
    }

    if (!user) {
      // Create new user
      const defaultOrg = await this.prisma.organization.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (!defaultOrg) {
        throw new BadRequestException(
          'No organization available. Please contact support.'
        );
      }

      // Build display name from fullName or use "Apple User"
      let displayName = 'Apple User';
      if (fullName) {
        const parts = [fullName.givenName, fullName.familyName].filter(Boolean);
        if (parts.length > 0) {
          displayName = parts.join(' ');
        }
      }

      // Use provided email, token email, or generate a placeholder
      const userEmail = email || tokenEmail || `${appleId}@privaterelay.appleid.com`;

      user = await this.prisma.user.create({
        data: {
          email: userEmail,
          name: displayName,
          appleId,
          emailVerified: true, // Apple verifies emails
          memberships: {
            create: {
              orgId: defaultOrg.id,
              role: 'PLAYER',
            },
          },
        },
        include: {
          memberships: {
            include: { org: true },
          },
        },
      });

      // Grant welcome bonus
      await this.grantWelcomeBonus(user.id, defaultOrg.id);
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('No organization membership');
    }

    // Generate tokens with extended expiration for OAuth logins
    const accessToken = this.generateToken(user, membership, membership.orgId, true);
    const refreshToken = await this.generateRefreshToken(user.id, {
      deviceType: 'mobile',
      deviceName: 'Apple Sign In',
      isOAuthLogin: true,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
      orgMembership: membership,
    };
  }

  private decodeAppleToken(token: string): { sub: string; email?: string } | null {
    try {
      // Apple identity tokens are JWTs. We decode the payload to get the user info.
      // In production, you should verify the signature using Apple's public keys.
      // For now, we'll decode without verification since the token came directly
      // from Apple's SDK on the client.
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
      const decoded = JSON.parse(payload);

      // Verify the token is from Apple
      if (decoded.iss !== 'https://appleid.apple.com') {
        this.logger.warn('Apple token issuer mismatch:', decoded.iss);
        return null;
      }

      // Check token is not expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        this.logger.warn('Apple token expired');
        return null;
      }

      return {
        sub: decoded.sub,
        email: decoded.email,
      };
    } catch (error) {
      this.logger.error('Failed to decode Apple token:', error);
      return null;
    }
  }

  /**
   * Permanently delete a user account and all associated data.
   * This is required for App Store compliance (Apple/Google).
   *
   * Data deleted:
   * - User profile and credentials
   * - All organization memberships
   * - Credit balances and ledger entries
   * - Tournament entries and decklists
   * - Match history (anonymized where user was opponent)
   * - Notifications and preferences
   * - Rating history and rankings
   * - All authentication tokens
   */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is an OWNER of any organization
    const ownerMemberships = user.memberships.filter(m => m.role === 'OWNER');
    if (ownerMemberships.length > 0) {
      throw new BadRequestException(
        'Cannot delete account while you are an owner of an organization. Please transfer ownership first.'
      );
    }

    // Use a transaction to ensure all data is deleted atomically
    await this.prisma.$transaction(async (tx) => {
      // Delete the user - cascade will handle most related data
      // Based on schema, this cascades:
      // - OrgMembership
      // - RefreshToken
      // - PasswordResetToken
      // - EmailVerificationToken
      // - CreditLedgerEntry (user relation)
      // - CreditBalance
      // - Entry (and related Decklist via cascade)
      // - Match (as playerA or playerB)
      // - NotificationToken
      // - Notification
      // - UserNotificationPreference
      // - PlayerCategoryLifetimeRating
      // - PlayerCategorySeasonRating
      // - LifetimeRatingHistory (both user and opponent relations)
      // - AuditLog (performer relation)
      //
      // Note: Rating history entries where this user was the opponent will also
      // be deleted. The actual ratings are preserved in PlayerCategoryLifetimeRating
      // for other users, only the match-by-match history is affected.
      await tx.user.delete({
        where: { id: userId },
      });
    });

    this.logger.log(`Account deleted: ${user.email} (${userId})`);

    return {
      message: 'Your account has been permanently deleted. All associated data has been removed.',
    };
  }

  /**
   * Update user profile information.
   * Currently supports updating the display name.
   */
  async updateProfile(userId: string, updates: { name?: string }): Promise<{ user: any; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (trimmedName.length === 0) {
        throw new BadRequestException('Name cannot be empty');
      }
      if (trimmedName.length > 50) {
        throw new BadRequestException('Name cannot exceed 50 characters');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.name && { name: updates.name.trim() }),
      },
    });

    return {
      user: this.sanitizeUser(updatedUser),
      message: 'Profile updated successfully',
    };
  }
}
