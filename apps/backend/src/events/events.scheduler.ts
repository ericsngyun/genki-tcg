import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from './events.service';

@Injectable()
export class EventsScheduler {
  private readonly logger = new Logger(EventsScheduler.name);

  constructor(private eventsService: EventsService) {}

  /**
   * Daily cleanup at 2 AM
   * Auto-cancels events that are scheduled but past their start time
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleStaleEventCleanup() {
    this.logger.log('Running stale event cleanup...');
    try {
      const result = await this.eventsService.cancelStaleScheduledEvents();
      this.logger.log(
        `Stale event cleanup complete: ${result.cancelledCount} events auto-cancelled`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stale event cleanup failed: ${message}`);
    }
  }

  /**
   * Run cleanup manually (for testing)
   */
  async runCleanupManually() {
    this.logger.log('Manual stale event cleanup triggered');
    return this.eventsService.cancelStaleScheduledEvents();
  }
}
