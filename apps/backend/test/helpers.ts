import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

/**
 * Create a test user with hashed password
 */
export async function createTestUser(
  prisma: PrismaService,
  data: {
    email: string;
    name: string;
    password: string;
    orgId: string;
    role?: 'OWNER' | 'STAFF' | 'PLAYER';
  },
) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      orgId: data.orgId,
      role: data.role || 'PLAYER',
    },
  });
}

/**
 * Create a test organization
 */
export async function createTestOrg(
  prisma: PrismaService,
  data: {
    name: string;
    inviteCode?: string;
  },
) {
  return prisma.organization.create({
    data: {
      name: data.name,
      inviteCode: data.inviteCode || generateInviteCode(),
    },
  });
}

/**
 * Create a test event
 */
export async function createTestEvent(
  prisma: PrismaService,
  data: {
    name: string;
    orgId: string;
    createdBy: string;
    game?: string;
    format?: string;
    maxPlayers?: number;
    entryFeeCents?: number;
  },
) {
  return prisma.event.create({
    data: {
      name: data.name,
      orgId: data.orgId,
      createdBy: data.createdBy,
      game: data.game || 'OPTCG',
      format: data.format || 'CONSTRUCTED',
      maxPlayers: data.maxPlayers || 32,
      entryFeeCents: data.entryFeeCents || 0,
      status: 'SCHEDULED',
      startDate: new Date(),
    },
  });
}

/**
 * Generate JWT token for testing
 */
export function generateTestToken(jwtService: JwtService, user: any) {
  return jwtService.sign({
    sub: user.id,
    email: user.email,
    orgId: user.orgId,
    role: user.role,
  });
}

/**
 * Generate random invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Setup test application with all modules
 */
export async function setupTestApp(moduleMetadata: any): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule(
    moduleMetadata,
  ).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(prisma: PrismaService, orgId: string) {
  // Delete in correct order due to foreign key constraints
  await prisma.creditLedger.deleteMany({ where: { orgId } });
  await prisma.decklist.deleteMany({ where: { entry: { event: { orgId } } } });
  await prisma.match.deleteMany({ where: { round: { event: { orgId } } } });
  await prisma.round.deleteMany({ where: { event: { orgId } } });
  await prisma.entry.deleteMany({ where: { event: { orgId } } });
  await prisma.event.deleteMany({ where: { orgId } });
  await prisma.user.deleteMany({ where: { orgId } });
  await prisma.organization.delete({ where: { id: orgId } });
}

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout = 5000,
): Promise<void> {
  const startTime = Date.now();
  while (!(await condition())) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
