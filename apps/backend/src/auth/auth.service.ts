import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import type { User, OrgMembership } from '@prisma/client';
import { SignupDto, LoginDto } from './dto';

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

    // Generate JWT
    const token = this.generateToken(user, membership, org.id);

    return {
      user: this.sanitizeUser(user),
      token,
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

    const token = this.generateToken(user, membership, membership.orgId);

    return {
      user: this.sanitizeUser(user),
      token,
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

    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
