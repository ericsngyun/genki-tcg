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
  });

  afterEach(() => {
    jest.clearAllMocks();
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
        orgId: org.id,
        role: 'PLAYER',
        passwordHash: 'hashed',
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(org);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.signup(signupDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(signupDto.email);
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
    });

    it('should throw UnauthorizedException if invite code is invalid', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.signup(signupDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should hash the password before storing', async () => {
      const org = { id: 'org-1', name: 'Test Org', inviteCode: 'TEST1234' };
      const user = {
        id: 'user-1',
        email: signupDto.email,
        name: signupDto.name,
        orgId: org.id,
        role: 'PLAYER',
        passwordHash: 'hashed',
      };

      mockPrismaService.organization.findUnique.mockResolvedValue(org);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(user);
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
        orgId: 'org-1',
        role: 'PLAYER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user).not.toHaveProperty('passwordHash');
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
        orgId: 'org-1',
        role: 'PLAYER',
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
        orgId: 'org-1',
        role: 'PLAYER',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
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
