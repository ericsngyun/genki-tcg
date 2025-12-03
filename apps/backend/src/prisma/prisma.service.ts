import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
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
      this.logger.log('Database connected');
    } catch (error) {
      this.connected = false;
      this.logger.warn('Database connection failed:', (error as Error).message);
      this.logger.warn('Application will start without database connectivity');
      this.logger.warn('Set DATABASE_URL environment variable to enable database features');
    }
  }

  async onModuleDestroy() {
    if (this.connected) {
      await this.$disconnect();
      this.logger.log('Database disconnected');
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
