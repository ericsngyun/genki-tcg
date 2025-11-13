import { PrismaClient } from '@prisma/client';

// Extend Jest timeout for database operations
jest.setTimeout(30000);

// Global test database client
let prisma: PrismaClient;

// Setup before all tests
beforeAll(async () => {
  // Use a separate test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  prisma = new PrismaClient();
  await prisma.$connect();
});

// Cleanup after all tests
afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

// Clean database between tests (optional - can be enabled per test file)
export async function cleanDatabase() {
  if (!prisma) return;

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
}

export { prisma };
