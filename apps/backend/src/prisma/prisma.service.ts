import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private connected = false;

  constructor() {
    super({
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    // Try to connect to database, but don't crash if it fails
    try {
      await this.$connect();
      this.connected = true;
      console.log('✅ Database connected');
    } catch (error) {
      this.connected = false;
      console.warn('⚠️  Database connection failed:', error.message);
      console.warn('⚠️  Application will start without database connectivity');
      console.warn('⚠️  Set DATABASE_URL environment variable to enable database features');
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect();
      console.log('❌ Database disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Clean all tables (for testing)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key !== '_engineConfig' && typeof key === 'string'
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof PrismaService];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          return (model as any).deleteMany();
        }
      })
    );
  }
}
