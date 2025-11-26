import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import {
  CreateNotificationDto,
  CreateAndSendNotificationDto,
  BulkCreateNotificationDto,
  GetNotificationsDto,
  UpdatePreferenceDto,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notifications.dto';
import { NotificationType, NotificationStatus, NotificationPriority, NotificationPlatform } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo: Expo;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private realtimeGateway: RealtimeGateway,
  ) {
    // Initialize Expo SDK
    const accessToken = this.config.get('EXPO_ACCESS_TOKEN');
    if (accessToken) {
      this.expo = new Expo({ accessToken });
      this.logger.log('Expo SDK initialized with access token');
    } else {
      this.expo = new Expo();
      this.logger.warn('Expo SDK initialized without access token');
    }
  }

  /**
   * Create a notification in the database
   */
  async createNotification(dto: CreateNotificationDto) {
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return this.prisma.notification.create({
      data: {
        ...dto,
        expiresAt,
      },
    });
  }

  /**
   * Create and send a notification (with preference checks)
   */
  async createAndSend(dto: CreateAndSendNotificationDto) {
    // Get user preferences for this notification type
    const preference = await this.getUserPreference(dto.userId, dto.orgId, dto.type);

    // Create notification in database
    const notification = await this.createNotification(dto);

    // Send via WebSocket if enabled and requested
    if (preference.enableInApp && dto.sendWebSocket !== false) {
      this.emitNotificationViaWebSocket(dto.userId, notification);
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { sentViaWebSocket: true },
      });
    }

    // Send via Push if enabled and requested
    if (preference.enablePush && dto.sendPush !== false) {
      await this.sendPushNotification(dto.userId, {
        title: dto.title,
        body: dto.body,
        data: {
          notificationId: notification.id,
          type: dto.type,
          ...dto.data,
        },
      });
    }

    return notification;
  }

  /**
   * Create and send bulk notifications
   */
  async createAndSendBulk(dto: BulkCreateNotificationDto) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Fetch preferences for all users
    const preferences = await Promise.all(
      dto.userIds.map((userId) =>
        this.getUserPreference(userId, dto.orgId, dto.type).then((pref) => ({
          userId,
          pref,
        }))
      )
    );

    // Create notifications for all users
    const notifications = await this.prisma.$transaction(
      dto.userIds.map((userId) =>
        this.prisma.notification.create({
          data: {
            userId,
            orgId: dto.orgId,
            type: dto.type,
            priority: dto.priority || NotificationPriority.NORMAL,
            title: dto.title,
            body: dto.body,
            data: dto.data,
            eventId: dto.eventId,
            matchId: dto.matchId,
            roundId: dto.roundId,
            expiresAt,
            sentViaWebSocket: true, // Will be sent via WS below
          },
        })
      )
    );

    // Emit via WebSocket for users with in-app enabled
    preferences.forEach(({ userId, pref }, index) => {
      if (pref.enableInApp) {
        this.emitNotificationViaWebSocket(userId, notifications[index]);
      }
    });

    // Send push notifications for users with push enabled
    const pushUsers = preferences
      .filter(({ pref }) => pref.enablePush)
      .map(({ userId }) => userId);

    if (pushUsers.length > 0) {
      await Promise.all(
        pushUsers.map((userId) =>
          this.sendPushNotification(userId, {
            title: dto.title,
            body: dto.body,
            data: {
              type: dto.type,
              eventId: dto.eventId,
              matchId: dto.matchId,
              roundId: dto.roundId,
              ...dto.data,
            },
          })
        )
      );
    }

    return notifications;
  }

  /**
   * Get user's notification preference for a specific type
   */
  async getUserPreference(userId: string, orgId: string, type: NotificationType) {
    const preference = await this.prisma.userNotificationPreference.findUnique({
      where: {
        userId_orgId_notificationType: {
          userId,
          orgId,
          notificationType: type,
        },
      },
    });

    // Return stored preference or default
    if (preference) {
      return {
        notificationType: preference.notificationType,
        enableInApp: preference.enableInApp,
        enablePush: preference.enablePush,
        enableEmail: preference.enableEmail,
      };
    }

    // Return default preference
    const defaults = DEFAULT_NOTIFICATION_PREFERENCES[type];
    return {
      notificationType: type,
      ...defaults,
    };
  }

  /**
   * Update user's notification preference
   */
  async updatePreference(userId: string, orgId: string, dto: UpdatePreferenceDto) {
    return this.prisma.userNotificationPreference.upsert({
      where: {
        userId_orgId_notificationType: {
          userId,
          orgId,
          notificationType: dto.notificationType,
        },
      },
      update: {
        enableInApp: dto.enableInApp,
        enablePush: dto.enablePush,
        enableEmail: dto.enableEmail,
      },
      create: {
        userId,
        orgId,
        notificationType: dto.notificationType,
        enableInApp: dto.enableInApp ?? true,
        enablePush: dto.enablePush ?? true,
        enableEmail: dto.enableEmail ?? false,
      },
    });
  }

  /**
   * Get all preferences for a user
   */
  async getAllPreferences(userId: string, orgId: string) {
    const storedPreferences = await this.prisma.userNotificationPreference.findMany({
      where: { userId, orgId },
    });

    // Build complete preference list with defaults
    const allTypes = Object.keys(NotificationType) as NotificationType[];
    const preferenceMap = new Map(
      storedPreferences.map((p) => [p.notificationType, p])
    );

    return allTypes.map((type) => {
      const stored = preferenceMap.get(type);
      if (stored) {
        return {
          notificationType: stored.notificationType,
          enableInApp: stored.enableInApp,
          enablePush: stored.enablePush,
          enableEmail: stored.enableEmail,
        };
      }
      return {
        notificationType: type,
        ...DEFAULT_NOTIFICATION_PREFERENCES[type],
      };
    });
  }

  /**
   * Get user's notifications (paginated)
   */
  async getUserNotifications(userId: string, orgId: string, dto: GetNotificationsDto) {
    const where: any = { userId, orgId };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.type) {
      where.type = dto.type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: dto.limit,
        skip: dto.offset,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      limit: dto.limit,
      offset: dto.offset,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, orgId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        orgId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[], userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Security: ensure user owns these notifications
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all user's notifications as read
   */
  async markAllAsRead(userId: string, orgId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        orgId,
        status: NotificationStatus.UNREAD,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    // Ensure user owns this notification
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Register a push notification token
   */
  async registerToken(userId: string, token: string, platform: NotificationPlatform) {
    // Check if this is a valid Expo push token
    if (!Expo.isExpoPushToken(token)) {
      throw new Error(`Invalid Expo push token: ${token}`);
    }

    return this.prisma.notificationToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        updatedAt: new Date(),
      },
      create: {
        userId,
        token,
        platform,
      },
    });
  }

  /**
   * Unregister a push notification token
   */
  async unregisterToken(token: string) {
    return this.prisma.notificationToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Broadcast notification to all participants in an event
   */
  async broadcastToEvent(eventId: string, dto: Omit<BulkCreateNotificationDto, 'userIds'>) {
    // Get all participants in the event
    const entries = await this.prisma.entry.findMany({
      where: { eventId },
      select: { userId: true },
    });

    const userIds = entries.map((e) => e.userId);

    if (userIds.length === 0) {
      this.logger.warn(`No participants found for event ${eventId}`);
      return [];
    }

    return this.createAndSendBulk({
      ...dto,
      userIds,
      eventId,
    });
  }

  /**
   * Notify all admins (owners and staff) in an organization
   */
  async notifyAdmins(orgId: string, dto: Omit<BulkCreateNotificationDto, 'userIds' | 'orgId'>) {
    // Get all owners and staff in the organization
    const memberships = await this.prisma.orgMembership.findMany({
      where: {
        orgId,
        role: { in: ['OWNER', 'STAFF'] },
      },
      select: { userId: true },
    });

    const userIds = memberships.map((m) => m.userId);

    if (userIds.length === 0) {
      this.logger.warn(`No admins found for org ${orgId}`);
      return [];
    }

    return this.createAndSendBulk({
      ...dto,
      userIds,
      orgId,
    });
  }

  /**
   * Cleanup expired notifications (called by cron job)
   */
  async cleanupExpiredNotifications() {
    const result = await this.prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired notifications`);
    return result;
  }

  /**
   * Send reminder notifications for events starting soon
   */
  async sendEventReminders() {
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    // Find events starting in the next 1-2 hours that haven't started yet
    const upcomingEvents = await this.prisma.event.findMany({
      where: {
        startAt: {
          gte: oneHourFromNow,
          lte: twoHoursFromNow,
        },
        status: { in: ['SCHEDULED', 'REGISTRATION_CLOSED'] },
      },
    });

    this.logger.log(`Found ${upcomingEvents.length} events starting soon`);

    // Send reminders for each event
    for (const event of upcomingEvents) {
      await this.broadcastToEvent(event.id, {
        orgId: event.orgId,
        type: NotificationType.EVENT_STARTING_SOON,
        priority: NotificationPriority.HIGH,
        title: 'Event Starting Soon',
        body: `${event.name} starts in less than an hour!`,
      });
    }
  }

  /**
   * Private: Send push notification to a user
   */
  private async sendPushNotification(userId: string, notification: { title: string; body: string; data?: any }) {
    try {
      // Get user's push tokens
      const tokens = await this.prisma.notificationToken.findMany({
        where: { userId },
        select: { token: true },
      });

      if (tokens.length === 0) {
        this.logger.debug(`No push tokens found for user ${userId}`);
        return;
      }

      // Prepare push messages
      const messages: ExpoPushMessage[] = tokens
        .filter((t) => Expo.isExpoPushToken(t.token))
        .map((t) => ({
          to: t.token,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data,
        }));

      if (messages.length === 0) {
        this.logger.warn(`No valid Expo push tokens for user ${userId}`);
        return;
      }

      // Send push notifications in chunks (Expo recommends 100 per batch)
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          this.logger.error(`Error sending push notification chunk: ${error.message}`);
        }
      }

      // Log any errors from tickets
      tickets.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          this.logger.error(
            `Push notification error for token ${messages[index].to}: ${ticket.message}`
          );
        }
      });

      this.logger.debug(`Sent ${messages.length} push notifications to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}: ${error.message}`);
    }
  }

  /**
   * Private: Emit notification via WebSocket
   */
  private emitNotificationViaWebSocket(userId: string, notification: any) {
    try {
      // Emit to user's personal room (format: user:{userId})
      this.realtimeGateway.server.to(`user:${userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        eventId: notification.eventId,
        matchId: notification.matchId,
        roundId: notification.roundId,
        createdAt: notification.createdAt,
      });

      this.logger.debug(`Emitted notification via WebSocket to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to emit notification via WebSocket: ${error.message}`);
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  async sendPush(userId: string, title: string, body: string, data?: any) {
    return this.sendPushNotification(userId, { title, body, data });
  }

  /**
   * Legacy method - updated to use new bulk system
   */
  async broadcastToEventLegacy(eventId: string, title: string, body: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { orgId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.broadcastToEvent(eventId, {
      orgId: event.orgId,
      type: NotificationType.SYSTEM_ERROR, // Default type
      title,
      body,
    });
  }
}
