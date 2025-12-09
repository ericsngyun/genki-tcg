import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Mock the grantWelcomeBonus method (it's a private method that creates credits)
    jest.spyOn(service as any, 'grantWelcomeBonus').mockResolvedValue(undefined);

    // Mock generateRefreshToken method
    jest.spyOn(service as any, 'generateRefreshToken').mockResolvedValue('mock-refresh-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      inviteCode: 'TEST1234',
    };

    it('should create a new user and return tokens', async () => {
      const org = { id: 'org-1', name: 'Test Org', inviteCode: 'TEST1234' };
      const user = {
        id: 'user-1',
        email: signupDto.email,
        name: signupDto.name,
        passwordHash: 'hashed',
        memberships: [
          {
            id: 'membership-1',
            userId: 'user-1',
            orgId: org.id,
            role: 'PLAYER',
          },
        ],
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(org);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(user);
      mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'mock-refresh-token' });
      mockJwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.signup(signupDto);

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('orgMembership');
      expect(result.user.email).toBe(signupDto.email);
      expect(result.orgMembership.role).toBe('PLAYER');
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { inviteCode: signupDto.inviteCode },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists', async () => {
      const org = { id: 'org-1', name: 'Test Org', inviteCode: 'TEST1234' };
      const existingUser = { id: 'user-1', email: signupDto.email };

      mockPrismaService.organization.findUnique.mockResolvedValue(org);
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.signup(signupDto)).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { inviteCode: signupDto.inviteCode },
      });
    });

    it('should throw BadRequestException if invite code is invalid', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.signup(signupDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { inviteCode: signupDto.inviteCode },
      });
    });

    it('should hash the password before storing', async () => {
      const org = { id: 'org-1', name: 'Test Org', inviteCode: 'TEST1234' };
      const user = {
        id: 'user-1',
        email: signupDto.email,
        name: signupDto.name,
        passwordHash: 'hashed',
        memberships: [
          {
            id: 'membership-1',
            userId: 'user-1',
            orgId: org.id,
            role: 'PLAYER',
          },
        ],
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(org);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(user);
      mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'mock-refresh-token' });
      mockJwtService.sign.mockReturnValue('mock-token');

      await service.signup(signupDto);

      const createCall = mockPrismaService.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).toBeDefined();
      expect(createCall.data.passwordHash).not.toBe(signupDto.password);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should return tokens for valid credentials', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: 'user-1',
        email: loginDto.email,
        name: 'Test User',
        passwordHash: hashedPassword,
        memberships: [
          {
            id: 'membership-1',
            userId: 'user-1',
            orgId: 'org-1',
            role: 'PLAYER',
            org: {
              id: 'org-1',
              name: 'Test Org',
              slug: 'test-org',
            },
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'mock-refresh-token' });
      mockJwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('orgMembership');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.orgMembership.role).toBe('PLAYER');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const user = {
        id: 'user-1',
        email: loginDto.email,
        passwordHash: await bcrypt.hash('different-password', 10),
        memberships: [
          {
            id: 'membership-1',
            userId: 'user-1',
            orgId: 'org-1',
            role: 'PLAYER',
            org: {
              id: 'org-1',
              name: 'Test Org',
              slug: 'test-org',
            },
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should not expose passwordHash in response', async () => {
      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const user = {
        id: 'user-1',
        email: loginDto.email,
        name: 'Test User',
        passwordHash: hashedPassword,
        memberships: [
          {
            id: 'membership-1',
            userId: 'user-1',
            orgId: 'org-1',
            role: 'PLAYER',
            org: {
              id: 'org-1',
              name: 'Test Org',
              slug: 'test-org',
            },
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.refreshToken.create.mockResolvedValue({ token: 'mock-refresh-token' });
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('validateUser', () => {
    it('should return user if valid', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        memberships: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser('user-1');

      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
      });
      expect(result).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getOrganization', () => {
    it('should return organization by ID', async () => {
      const org = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(org);

      const result = await service.getOrganization('org-1');

      expect(result).toEqual(org);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    });
  });

  describe('refreshAccessToken', () => {
    const refreshDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should refresh access token with valid refresh token', async () => {
      const tokenRecord = {
        id: 'token-1',
        token: refreshDto.refreshToken,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        revokedAt: null,
        deviceName: 'iPhone',
        deviceType: 'mobile',
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent',
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'hashed',
          memberships: [
            {
              id: 'membership-1',
              userId: 'user-1',
              orgId: 'org-1',
              role: 'PLAYER',
              org: {
                id: 'org-1',
                name: 'Test Org',
              },
            },
          ],
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(tokenRecord);
      mockPrismaService.refreshToken.update.mockResolvedValue({ ...tokenRecord, revokedAt: new Date() });
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken(refreshDto);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: tokenRecord.id },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token expired', async () => {
      const expiredToken = {
        id: 'token-1',
        token: refreshDto.refreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired
        revokedAt: null,
        user: {
          id: 'user-1',
          memberships: [],
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaService.refreshToken.delete.mockResolvedValue(expiredToken);

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token revoked', async () => {
      const revokedToken = {
        id: 'token-1',
        token: refreshDto.refreshToken,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(), // Already revoked
        user: {
          id: 'user-1',
          memberships: [],
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(revokedToken);

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user has no membership', async () => {
      const tokenRecord = {
        id: 'token-1',
        token: refreshDto.refreshToken,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          memberships: [], // No memberships
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(tokenRecord);
      mockPrismaService.refreshToken.update.mockResolvedValue({ ...tokenRecord, revokedAt: new Date() });

      await expect(service.refreshAccessToken(refreshDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token', async () => {
      const tokenRecord = {
        id: 'token-1',
        token: 'test-token',
        userId: 'user-1',
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(tokenRecord);
      mockPrismaService.refreshToken.update.mockResolvedValue({ ...tokenRecord, revokedAt: new Date() });

      const result = await service.revokeRefreshToken('test-token');

      expect(result).toEqual({ message: 'Refresh token revoked successfully' });
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: tokenRecord.id },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if token not found', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.revokeRefreshToken('invalid-token')).rejects.toThrow(
        'Refresh token not found',
      );
    });
  });

  describe('revokeAllRefreshTokens', () => {
    it('should revoke all refresh tokens for a user', async () => {
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.revokeAllRefreshTokens('user-1');

      expect(result).toEqual({ message: 'All refresh tokens revoked successfully' });
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getUserSessions', () => {
    it('should return active user sessions', async () => {
      const sessions = [
        {
          id: 'session-1',
          deviceName: 'iPhone',
          deviceType: 'mobile',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
        {
          id: 'session-2',
          deviceName: 'Chrome',
          deviceType: 'web',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
      ];

      mockPrismaService.refreshToken.findMany.mockResolvedValue(sessions);

      const result = await service.getUserSessions('user-1');

      expect(result).toEqual(sessions);
      expect(result.length).toBe(2);
      expect(mockPrismaService.refreshToken.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          revokedAt: null,
          expiresAt: {
            gte: expect.any(Date),
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
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto = {
      email: 'test@example.com',
    };

    it('should create password reset token for valid user', async () => {
      const user = {
        id: 'user-1',
        email: forgotPasswordDto.email,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.passwordResetToken.create.mockResolvedValue({
        id: 'reset-1',
        userId: user.id,
        token: 'reset-token',
        expiresAt: new Date(),
      });

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toEqual({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      expect(mockPrismaService.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: user.id,
          usedAt: null,
        },
      });
      expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalled();
    });

    it('should return generic message if user not found (security)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toEqual({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      // Should not create token if user doesn't exist
      expect(mockPrismaService.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'NewPassword123!',
    };

    beforeEach(() => {
      mockPrismaService.$transaction = jest.fn((operations) => Promise.all(operations));
    });

    it('should reset password with valid token', async () => {
      const resetToken = {
        id: 'reset-1',
        userId: 'user-1',
        token: resetPasswordDto.token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        usedAt: null,
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      };

      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(resetToken);
      mockPrismaService.user.update = jest.fn().mockResolvedValue({ id: 'user-1' });
      mockPrismaService.passwordResetToken.update = jest.fn().mockResolvedValue({ ...resetToken, usedAt: new Date() });
      mockPrismaService.refreshToken.updateMany = jest.fn().mockResolvedValue({ count: 2 });

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toEqual({
        message: 'Password reset successfully. Please login with your new password.',
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if token not found', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should throw BadRequestException if token expired', async () => {
      const expiredToken = {
        id: 'reset-1',
        userId: 'user-1',
        token: resetPasswordDto.token,
        expiresAt: new Date(Date.now() - 1000), // Expired
        usedAt: null,
      };

      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(expiredToken);
      mockPrismaService.passwordResetToken.delete.mockResolvedValue(expiredToken);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Reset token has expired',
      );
    });

    it('should throw BadRequestException if token already used', async () => {
      const usedToken = {
        id: 'reset-1',
        userId: 'user-1',
        token: resetPasswordDto.token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: new Date(), // Already used
      };

      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(usedToken);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Reset token has already been used',
      );
    });
  });

  describe('login - edge cases', () => {
    it('should throw UnauthorizedException if user has no membership', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        memberships: [], // No memberships
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(
        service.login({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow('No organization membership');
    });

    it('should throw UnauthorizedException if user has no passwordHash', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: null, // OAuth user without password
        memberships: [
          {
            id: 'membership-1',
            userId: 'user-1',
            orgId: 'org-1',
            role: 'PLAYER',
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(
        service.login({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
