# Testing Guide

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm run test -- auth.service.spec.ts
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test
npm run test:e2e -- tournament-workflow.e2e-spec.ts
```

### Test Coverage
```bash
# Generate coverage report
npm run test:cov

# View coverage report
open coverage/lcov-report/index.html
```

## Test Database Setup

### Option 1: Use Separate Test Database (Recommended)
```bash
# Create a test database
createdb genki_tcg_test

# Set environment variable
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/genki_tcg_test"

# Run migrations on test database
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

### Option 2: Use SQLite for Tests (Faster, Isolated)
```bash
# In .env.test
DATABASE_URL="file:./test.db"
```

## Writing Tests

### Unit Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MyService', () => {
  let service: MyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    myModel: {
      create: jest.fn(),
      findMany: jest.fn(),
      // ... other methods
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ... more tests
});
```

### E2E Test Example
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });
});
```

## Test Helpers

Use the provided test helpers in `test/helpers.ts`:

```typescript
import {
  createTestUser,
  createTestOrg,
  createTestEvent,
  cleanupTestData,
  generateTestToken,
} from '../test/helpers';

// Create test organization
const org = await createTestOrg(prisma, { name: 'Test Org' });

// Create test user
const user = await createTestUser(prisma, {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
  orgId: org.id,
  role: 'OWNER',
});

// Create test event
const event = await createTestEvent(prisma, {
  name: 'Test Tournament',
  orgId: org.id,
  createdBy: user.id,
});

// Generate JWT token for API tests
const token = generateTestToken(jwtService, user);

// Cleanup after tests
await cleanupTestData(prisma, org.id);
```

## Coverage Goals

Target coverage: **70%+**

Current coverage areas:
- ✅ Auth service (login, signup, JWT)
- ✅ Events service (CRUD, registration, check-in)
- ✅ Organization isolation
- ✅ Payment validation
- ⏳ Rounds service (TODO)
- ⏳ Matches service (TODO)
- ⏳ Standings service (TODO)

## Continuous Integration

Tests run automatically on:
- Every PR
- Every push to main
- Before deployment

See `.github/workflows/ci-cd.yml` for CI configuration.

## Troubleshooting

### Tests failing with database connection errors
```bash
# Make sure test database is running and accessible
# Check DATABASE_URL or TEST_DATABASE_URL

# Reset test database
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate reset
```

### Tests timing out
```bash
# Increase timeout in jest.config.js
testTimeout: 30000 // 30 seconds
```

### Mock data not being cleaned up
```bash
# Use cleanDatabase() or cleanupTestData() in afterEach/afterAll
import { cleanDatabase } from '../test/setup';

afterEach(async () => {
  await cleanDatabase();
});
```

## Best Practices

1. **Test isolation**: Each test should be independent
2. **Use factories**: Use test helpers to create data
3. **Mock external services**: Don't call real APIs
4. **Test edge cases**: Not just happy paths
5. **Meaningful descriptions**: Test names should explain what they test
6. **AAA pattern**: Arrange, Act, Assert

## Resources

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest](https://github.com/visionmedia/supertest)
