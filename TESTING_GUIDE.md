# Complete Testing Guide for Genki TCG

## Testing Strategy

### Test Pyramid
```
        /\
       /  \
      / E2E \
     /--------\
    /  Integration \
   /----------------\
  /   Unit Tests    \
 /--------------------\
```

- **Unit Tests**: 70% - Test individual functions/methods
- **Integration Tests**: 20% - Test API endpoints with real database
- **E2E Tests**: 10% - Test complete user workflows

---

## Setup Testing Infrastructure

### 1. Install Dependencies

```bash
cd apps/backend
npm install --save-dev \
  @nestjs/testing \
  @types/jest \
  @types/supertest \
  supertest \
  jest \
  ts-jest

cd ../admin-web
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom

cd ../mobile
npm install --save-dev \
  @testing-library/react-native \
  jest-expo
```

### 2. Jest Configuration

#### Backend: `apps/backend/jest.config.js`
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

#### Admin Web: `apps/admin-web/jest.config.js`
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
```

---

## Backend Unit Tests

### Authentication Tests

#### `apps/backend/src/auth/auth.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            organization: {
              findUnique: jest.fn(),
            },
            orgMembership: {
              upsert: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('fake-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signup', () => {
    it('should create a new user with hashed password', async () => {
      const mockOrg = { id: 'org1', slug: 'genki', inviteCode: 'GENKI' };
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        memberships: [{
          userId: 'user1',
          orgId: 'org1',
          role: 'PLAYER',
        }],
      };

      jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrg as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await service.signup({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
        inviteCode: 'GENKI',
      });

      expect(result.token).toBe('fake-jwt-token');
      expect(result.user.email).toBe('test@example.com');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw error for invalid invite code', async () => {
      jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(null);

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'Test123!',
          name: 'Test User',
          inviteCode: 'INVALID',
        })
      ).rejects.toThrow('Invalid invite code');
    });

    it('should throw error if user already exists', async () => {
      const mockOrg = { id: 'org1', slug: 'genki', inviteCode: 'GENKI' };
      const existingUser = { id: 'user1', email: 'test@example.com' };

      jest.spyOn(prisma.organization, 'findUnique').mockResolvedValue(mockOrg as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(existingUser as any);

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'Test123!',
          name: 'Test User',
          inviteCode: 'GENKI',
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Test123!', 10),
        memberships: [{
          userId: 'user1',
          orgId: 'org1',
          role: 'PLAYER',
          org: { id: 'org1', slug: 'genki' },
        }],
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@example.com',
        password: 'Test123!',
      });

      expect(result.token).toBe('fake-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        memberships: [],
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Events Service Tests

#### `apps/backend/src/events/events.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            entry: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getEvent', () => {
    it('should return event for valid orgId', async () => {
      const mockEvent = {
        id: 'event1',
        orgId: 'org1',
        name: 'Test Event',
        entries: [],
        rounds: [],
      };

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent as any);

      const result = await service.getEvent('event1', 'org1');

      expect(result).toEqual(mockEvent);
      expect(prisma.event.findUnique).toHaveBeenCalledWith({
        where: { id: 'event1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

      await expect(
        service.getEvent('nonexistent', 'org1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for wrong orgId', async () => {
      const mockEvent = {
        id: 'event1',
        orgId: 'org1',
        name: 'Test Event',
      };

      jest.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEvent as any);

      await expect(
        service.getEvent('event1', 'org2') // Wrong org
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkIn', () => {
    it('should check in player with no entry fee', async () => {
      const mockEntry = {
        id: 'entry1',
        userId: 'user1',
        event: {
          id: 'event1',
          orgId: 'org1',
          entryFeeCents: 0,
        },
        paidAt: null,
      };

      jest.spyOn(prisma.entry, 'findUnique').mockResolvedValue(mockEntry as any);
      jest.spyOn(prisma.entry, 'update').mockResolvedValue({ ...mockEntry, checkedInAt: new Date() } as any);

      const result = await service.checkIn('entry1');

      expect(result.checkedInAt).toBeDefined();
      expect(prisma.entry.update).toHaveBeenCalled();
    });

    it('should throw error if payment required but not paid', async () => {
      const mockEntry = {
        id: 'entry1',
        userId: 'user1',
        event: {
          id: 'event1',
          orgId: 'org1',
          entryFeeCents: 500, // $5
        },
        paidAt: null, // Not paid
      };

      jest.spyOn(prisma.entry, 'findUnique').mockResolvedValue(mockEntry as any);

      await expect(
        service.checkIn('entry1')
      ).rejects.toThrow('Player must pay entry fee before check-in');
    });

    it('should check in player if payment confirmed', async () => {
      const mockEntry = {
        id: 'entry1',
        userId: 'user1',
        event: {
          id: 'event1',
          orgId: 'org1',
          entryFeeCents: 500,
        },
        paidAt: new Date(), // Paid
      };

      jest.spyOn(prisma.entry, 'findUnique').mockResolvedValue(mockEntry as any);
      jest.spyOn(prisma.entry, 'update').mockResolvedValue({ ...mockEntry, checkedInAt: new Date() } as any);

      const result = await service.checkIn('entry1');

      expect(result.checkedInAt).toBeDefined();
    });
  });
});
```

---

## Backend Integration Tests

### `apps/backend/test/auth.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Clean database
    await prisma.creditLedgerEntry.deleteMany();
    await prisma.creditBalance.deleteMany();
    await prisma.entry.deleteMany();
    await prisma.match.deleteMany();
    await prisma.round.deleteMany();
    await prisma.event.deleteMany();
    await prisma.orgMembership.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();

    // Create test organization
    await prisma.organization.create({
      data: {
        slug: 'test-org',
        name: 'Test Org',
        inviteCode: 'TESTCODE',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/auth/signup (POST)', () => {
    it('should create new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'newuser@test.com',
          password: 'Test123!',
          name: 'New User',
          inviteCode: 'TESTCODE',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
          expect(res.body.user.email).toBe('newuser@test.com');
        });
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'weak@test.com',
          password: '123', // Too weak
          name: 'Weak User',
          inviteCode: 'TESTCODE',
        })
        .expect(400);
    });

    it('should reject invalid invite code', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid@test.com',
          password: 'Test123!',
          name: 'Invalid User',
          inviteCode: 'INVALID',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid invite code');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@test.com',
          password: 'Test123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
          expect(res.body.user.email).toBe('newuser@test.com');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@test.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });
});
```

### `apps/backend/test/events.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('EventsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerToken: string;
  let playerToken: string;
  let orgId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Setup test data
    const org = await prisma.organization.create({
      data: {
        slug: 'test-events',
        name: 'Test Events Org',
        inviteCode: 'EVENTS',
      },
    });
    orgId = org.id;

    // Create owner
    const ownerRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'owner@events.com',
        password: 'Owner123!',
        name: 'Event Owner',
        inviteCode: 'EVENTS',
      });
    ownerToken = ownerRes.body.token;

    // Promote to OWNER
    const owner = await prisma.user.findUnique({
      where: { email: 'owner@events.com' },
    });
    await prisma.orgMembership.update({
      where: {
        userId_orgId: {
          userId: owner.id,
          orgId: org.id,
        },
      },
      data: { role: 'OWNER' },
    });

    // Create player
    const playerRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'player@events.com',
        password: 'Player123!',
        name: 'Test Player',
        inviteCode: 'EVENTS',
      });
    playerToken = playerRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/events (POST)', () => {
    it('should create event as OWNER', async () => {
      const res = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Tournament',
          game: 'OPTCG',
          format: 'CONSTRUCTED',
          startAt: new Date(Date.now() + 86400000), // Tomorrow
          maxPlayers: 32,
          entryFeeCents: 500,
        })
        .expect(201);

      expect(res.body.name).toBe('Test Tournament');
      expect(res.body.status).toBe('SCHEDULED');
    });

    it('should reject event creation as PLAYER', () => {
      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          name: 'Unauthorized Event',
          game: 'OPTCG',
          format: 'CONSTRUCTED',
          startAt: new Date(),
        })
        .expect(403);
    });
  });

  describe('/events/:id/register (POST)', () => {
    let eventId: string;

    beforeAll(async () => {
      const event = await prisma.event.create({
        data: {
          orgId,
          name: 'Registration Test',
          game: 'OPTCG',
          format: 'CONSTRUCTED',
          startAt: new Date(Date.now() + 86400000),
          status: 'SCHEDULED',
          createdBy: 'owner-id',
        },
      });
      eventId = event.id;
    });

    it('should register player for event', async () => {
      const res = await request(app.getHttpServer())
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(201);

      expect(res.body.eventId).toBe(eventId);
      expect(res.body.registeredAt).toBeDefined();
    });

    it('should prevent duplicate registration', () => {
      return request(app.getHttpServer())
        .post(`/events/${eventId}/register`)
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(400);
    });
  });

  describe('Cross-organization security', () => {
    it('should prevent access to other org events', async () => {
      // Create second org
      const org2 = await prisma.organization.create({
        data: {
          slug: 'other-org',
          name: 'Other Org',
          inviteCode: 'OTHER',
        },
      });

      // Create event in org2
      const event2 = await prisma.event.create({
        data: {
          orgId: org2.id,
          name: 'Other Org Event',
          game: 'OPTCG',
          format: 'CONSTRUCTED',
          startAt: new Date(),
          status: 'SCHEDULED',
          createdBy: 'someone',
        },
      });

      // Try to access with org1 token
      await request(app.getHttpServer())
        .get(`/events/${event2.id}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(403);
    });
  });
});
```

---

## Frontend Tests

### Admin Web - Component Tests

#### `apps/admin-web/src/components/EventCard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventCard } from './EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: 'event1',
    name: 'Test Tournament',
    game: 'OPTCG',
    format: 'CONSTRUCTED',
    status: 'SCHEDULED',
    startAt: '2024-12-25T18:00:00Z',
    _count: { entries: 16 },
  };

  it('should render event details', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText(/16 players/i)).toBeInTheDocument();
  });

  it('should show correct status badge', () => {
    render(<EventCard event={mockEvent} />);

    const statusBadge = screen.getByText('SCHEDULED');
    expect(statusBadge).toHaveClass('bg-blue-100');
  });

  it('should format game and format correctly', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText(/One Piece TCG/i)).toBeInTheDocument();
    expect(screen.getByText(/Constructed/i)).toBeInTheDocument();
  });
});
```

### Mobile - Component Tests

#### `apps/mobile/app/login.test.tsx`

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from './login';
import { api } from '../lib/api';

jest.mock('../lib/api');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

describe('LoginScreen', () => {
  it('should render login form', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    expect(getByPlaceholderText('player1@test.com')).toBeTruthy();
    expect(getByPlaceholderText('••••••••')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('should show error for empty fields', async () => {
    const { getByText, findByText } = render(<LoginScreen />);

    fireEvent.press(getByText('Sign In'));

    const errorMessage = await findByText('Please enter email and password');
    expect(errorMessage).toBeTruthy();
  });

  it('should call API on valid login', async () => {
    const mockLogin = jest.spyOn(api, 'login').mockResolvedValue({
      token: 'fake-token',
      user: { id: 'user1', email: 'test@test.com' },
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('player1@test.com'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password');
    });
  });
});
```

---

## Running Tests

### Backend
```bash
cd apps/backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.service.spec.ts

# Run in watch mode
npm test -- --watch

# Run e2e tests
npm run test:e2e
```

### Admin Web
```bash
cd apps/admin-web

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Mobile
```bash
cd apps/mobile

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## Test Coverage Goals

- **Overall**: 80%+
- **Critical paths** (auth, payments): 95%+
- **Business logic** (tournaments, standings): 90%+
- **UI components**: 70%+

---

## Continuous Integration

### GitHub Actions: `.github/workflows/test.yml`

```yaml
name: Test

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: genki_tcg_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd apps/backend
          npm ci

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/genki_tcg_test
        run: |
          cd apps/backend
          npx prisma migrate deploy

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/genki_tcg_test
          JWT_SECRET: test-secret-key-for-ci
        run: |
          cd apps/backend
          npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: apps/backend/coverage/lcov.info

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd apps/admin-web
          npm ci

      - name: Run tests
        run: |
          cd apps/admin-web
          npm test -- --coverage
```

---

## Next Steps

1. **Set up test infrastructure** (2-3 hours)
2. **Write unit tests for critical paths** (8-10 hours)
3. **Write integration tests for API endpoints** (6-8 hours)
4. **Write E2E tests for key workflows** (4-6 hours)
5. **Set up CI/CD pipeline** (2-3 hours)

**Total Time**: 22-30 hours

After testing setup, aim for:
- 80%+ code coverage
- All critical paths tested
- CI/CD running on every commit
