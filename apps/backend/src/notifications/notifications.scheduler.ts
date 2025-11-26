import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private notificationsService: NotificationsService) {}

  /**
   * Daily cleanup at 3 AM
   * Deletes notifications older than 30 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyCleanup() {
    this.logger.log('Running daily notification cleanup...');
    try {
      const result = await this.notificationsService.cleanupExpiredNotifications();
      this.logger.log(`Daily cleanup complete: ${result.count} notifications deleted`);
    } catch (error) {
      this.logger.error(`Daily cleanup failed: ${error.message}`);
    }
  }

  /**
   * Hourly check for upcoming events
   * Sends reminders for events starting in the next hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleEventReminders() {
    this.logger.log('Checking for upcoming events...');
    try {
      await this.notificationsService.sendEventReminders();
      this.logger.log('Event reminders sent');
    } catch (error) {
      this.logger.error(`Event reminders failed: ${error.message}`);
    }
  }

  /**
   * Run cleanup manually (for testing)
   */
  async runCleanupManually() {
    this.logger.log('Manual cleanup triggered');
    return this.notificationsService.cleanupExpiredNotifications();
  }

  /**
   * Run event reminders manually (for testing)
   */
  async runRemindersManually() {
    this.logger.log('Manual reminders triggered');
    return this.notificationsService.sendEventReminders();
  }
}
