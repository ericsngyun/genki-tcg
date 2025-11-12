import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Send push notification (stub - integrate Expo push later)
   */
  async sendPush(userId: string, title: string, body: string, data?: any) {
    console.log(`📱 Push to ${userId}: ${title} - ${body}`);
    // TODO: Implement Expo push notifications
  }

  async broadcastToEvent(eventId: string, title: string, body: string) {
    const entries = await this.prisma.entry.findMany({
      where: { eventId },
      select: { userId: true },
    });

    await Promise.all(
      entries.map((e) => this.sendPush(e.userId, title, body))
    );
  }
}
