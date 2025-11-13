import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestOrg,
  createTestUser,
  createTestEvent,
  cleanupTestData,
} from './helpers';

describe('Tournament Workflow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let orgId: string;
  let ownerToken: string;
  let staffToken: string;
  let player1Token: string;
  let player2Token: string;
  let eventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Setup test data
    const org = await createTestOrg(prisma, { name: 'Test Tournament Org' });
    orgId = org.id;

    const owner = await createTestUser(prisma, {
      email: 'owner@test.com',
      password: 'Password123!',
      name: 'Owner User',
      orgId,
      role: 'OWNER',
    });

    const staff = await createTestUser(prisma, {
      email: 'staff@test.com',
      password: 'Password123!',
      name: 'Staff User',
      orgId,
      role: 'STAFF',
    });

    const player1 = await createTestUser(prisma, {
      email: 'player1@test.com',
      password: 'Password123!',
      name: 'Player One',
      orgId,
      role: 'PLAYER',
    });

    const player2 = await createTestUser(prisma, {
      email: 'player2@test.com',
      password: 'Password123!',
      name: 'Player Two',
      orgId,
      role: 'PLAYER',
    });

    // Get auth tokens
    const ownerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'owner@test.com', password: 'Password123!' });
    ownerToken = ownerLogin.body.accessToken;

    const staffLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'staff@test.com', password: 'Password123!' });
    staffToken = staffLogin.body.accessToken;

    const player1Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'player1@test.com', password: 'Password123!' });
    player1Token = player1Login.body.accessToken;

    const player2Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'player2@test.com', password: 'Password123!' });
    player2Token = player2Login.body.accessToken;
  });

  afterAll(async () => {
    await cleanupTestData(prisma, orgId);
    await app.close();
  });

  describe('Complete Tournament Flow', () => {
    it('1. Owner creates event', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Tournament',
          game: 'OPTCG',
          format: 'CONSTRUCTED',
          maxPlayers: 32,
          entryFeeCents: 1000,
          startDate: new Date().toISOString(),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Tournament');
      eventId = response.body.id;
    });

    it('2. Players register for event', async () => {
      const player1Response = await request(app.getHttpServer())
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${player1Token}`)
        .expect(201);

      expect(player1Response.body).toHaveProperty('id');

      const player2Response = await request(app.getHttpServer())
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${player2Token}`)
        .expect(201);

      expect(player2Response.body).toHaveProperty('id');
    });

    it('3. Staff marks payments as paid', async () => {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { entries: true },
      });

      for (const entry of event.entries) {
        await request(app.getHttpServer())
          .post(`/events/entries/${entry.id}/mark-paid`)
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ amount: 1000 })
          .expect(201);
      }
    });

    it('4. Staff checks in players', async () => {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { entries: true },
      });

      for (const entry of event.entries) {
        await request(app.getHttpServer())
          .post(`/events/entries/${entry.id}/check-in`)
          .set('Authorization', `Bearer ${staffToken}`)
          .expect(201);
      }
    });

    it('5. Staff creates first round', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rounds/events/${eventId}/next`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(201);

      expect(response.body).toHaveProperty('round');
      expect(response.body).toHaveProperty('matches');
      expect(response.body.round.roundNumber).toBe(1);
      expect(response.body.matches.length).toBeGreaterThan(0);
    });

    it('6. Players can view their pairings', async () => {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { rounds: true },
      });

      const round = event.rounds[0];

      const response = await request(app.getHttpServer())
        .get(`/rounds/${round.id}/pairings`)
        .set('Authorization', `Bearer ${player1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('7. Staff reports match results', async () => {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { rounds: { include: { matches: true } } },
      });

      const match = event.rounds[0].matches[0];

      const response = await request(app.getHttpServer())
        .post(`/matches/report`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          matchId: match.id,
          result: 'PLAYER_A_WIN',
          gamesWonA: 2,
          gamesWonB: 0,
        })
        .expect(201);

      expect(response.body.result).toBe('PLAYER_A_WIN');
    });

    it('8. Anyone can view standings', async () => {
      const response = await request(app.getHttpServer())
        .get(`/standings/events/${eventId}`)
        .set('Authorization', `Bearer ${player1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('rank');
      expect(response.body[0]).toHaveProperty('points');
    });

    it('9. Staff can export standings as CSV', async () => {
      const response = await request(app.getHttpServer())
        .get(`/standings/events/${eventId}/export`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.text).toContain('Rank');
      expect(response.text).toContain('Player');
    });

    it('10. Staff distributes prizes', async () => {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { entries: { include: { user: true } } },
      });

      const winner = event.entries[0];

      await request(app.getHttpServer())
        .post(`/events/${eventId}/distribute-prizes`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          distributions: [
            { userId: winner.userId, amount: 1000, placement: 1 },
          ],
        })
        .expect(201);

      // Verify prize was distributed
      const credits = await prisma.creditLedger.findMany({
        where: {
          userId: winner.userId,
          type: 'PRIZE',
        },
      });

      expect(credits.length).toBeGreaterThan(0);
    });
  });

  describe('Organization Isolation', () => {
    it('should prevent cross-org data access', async () => {
      // Create a second organization
      const org2 = await createTestOrg(prisma, { name: 'Other Org' });
      const otherUser = await createTestUser(prisma, {
        email: 'other@test.com',
        password: 'Password123!',
        name: 'Other User',
        orgId: org2.id,
        role: 'OWNER',
      });

      const otherLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'other@test.com', password: 'Password123!' });
      const otherToken = otherLogin.body.accessToken;

      // Try to access event from org 1
      await request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Try to register for event from org 1
      await request(app.getHttpServer())
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Cleanup
      await cleanupTestData(prisma, org2.id);
    });
  });

  describe('Payment Validation', () => {
    it('should prevent check-in without payment', async () => {
      const player3 = await createTestUser(prisma, {
        email: 'player3@test.com',
        password: 'Password123!',
        name: 'Player Three',
        orgId,
        role: 'PLAYER',
      });

      const player3Login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'player3@test.com', password: 'Password123!' });
      const player3Token = player3Login.body.accessToken;

      // Register
      const registerResponse = await request(app.getHttpServer())
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${player3Token}`)
        .expect(201);

      const entryId = registerResponse.body.id;

      // Try to check in without payment
      await request(app.getHttpServer())
        .post(`/events/entries/${entryId}/check-in`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(400);
    });

    it('should prevent underpayment', async () => {
      const player4 = await createTestUser(prisma, {
        email: 'player4@test.com',
        password: 'Password123!',
        name: 'Player Four',
        orgId,
        role: 'PLAYER',
      });

      const player4Login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'player4@test.com', password: 'Password123!' });
      const player4Token = player4Login.body.accessToken;

      // Register
      const registerResponse = await request(app.getHttpServer())
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${player4Token}`)
        .expect(201);

      const entryId = registerResponse.body.id;

      // Try to mark paid with insufficient amount
      await request(app.getHttpServer())
        .post(`/events/entries/${entryId}/mark-paid`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ amount: 500 }) // Required: 1000
        .expect(400);
    });
  });
});
