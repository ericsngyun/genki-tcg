import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
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
    },
    organization: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
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

    it('should throw ConflictException if email already exists', async () => {
      const org = { id: 'org-1', name: 'Test Org', inviteCode: 'TEST1234' };
      const existingUser = { id: 'user-1', email: signupDto.email };

      mockPrismaService.organization.findUnique.mockResolvedValue(org);
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.organization.findUnique).toHaveBeenCalledWith({
        where: { inviteCode: signupDto.inviteCode },
      });
    });

    it('should throw UnauthorizedException if invite code is invalid', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.signup(signupDto)).rejects.toThrow(
        UnauthorizedException,
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
        orgId: 'org-1',
        role: 'PLAYER',
      };

      const result = await service.validateUser(user as any);

      expect(result).toEqual(user);
    });
  });
});
