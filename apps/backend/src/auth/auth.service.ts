import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
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
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

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
    const passwordHash = await bcrypt.hash(password, 10);

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
    orgId: string
  ): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId,
      role: membership.role,
    };

    // Role-based token expiry for enhanced security
    // Admins get shorter sessions, players get longer sessions
    const expiresIn = this.getTokenExpiryByRole(membership.role);

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

  // ============================================================================
  // Refresh Token Management
  // ============================================================================

  async generateRefreshToken(userId: string, deviceInfo?: {
    deviceName?: string;
    deviceType?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string> {
    // Generate a secure random token
    const token = crypto.randomBytes(64).toString('hex');

    // Refresh tokens expire in 90 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

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

    // Update last used timestamp
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    });

    const user = tokenRecord.user;
    const membership = user.memberships[0];

    if (!membership) {
      throw new UnauthorizedException('No organization membership');
    }

    // Generate new access token
    const accessToken = this.generateToken(user, membership, membership.orgId);

    return {
      accessToken,
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

    console.log(`Password reset token for ${email}: ${token}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      // REMOVE THIS IN PRODUCTION - only for development
      resetToken: process.env.NODE_ENV === 'development' ? token : undefined,
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

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

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

    // Generate verification token (reuse password reset token structure)
    const token = crypto.randomBytes(32).toString('hex');

    // TODO: Send verification email
    // For now, we'll just log the token
    console.log(`Email verification token for ${user.email}: ${token}`);

    return {
      message: 'Verification email sent',
      // REMOVE THIS IN PRODUCTION
      verificationToken: process.env.NODE_ENV === 'development' ? token : undefined,
    };
  }

  async verifyEmail(token: string) {
    // TODO: Implement email verification token lookup
    // For now, this is a placeholder

    throw new BadRequestException('Email verification not fully implemented');
  }

  // ============================================================================
  // Discord OAuth
  // ============================================================================

  async getDiscordAuthUrl(redirectUri: string, state?: string) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Discord OAuth not configured');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify email',
      ...(state && { state }),
    });

    return {
      url: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
    };
  }

  async handleDiscordCallback(code: string, redirectUri: string) {
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
      const error = await tokenResponse.text();
      console.error('Discord token exchange failed:', error);
      throw new BadRequestException('Failed to exchange Discord authorization code');
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
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException('No organization membership');
    }

    // Generate tokens
    const accessToken = this.generateToken(user, membership, membership.orgId);
    const refreshToken = await this.generateRefreshToken(user.id, {
      deviceType: 'mobile',
      deviceName: 'Discord OAuth',
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
      throw new BadRequestException('Failed to exchange Discord authorization code');
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
}
