import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max, IsJSON, IsArray } from 'class-validator';
import { NotificationType, NotificationStatus, NotificationPriority } from '@prisma/client';
import { Type } from 'class-transformer';

/**
 * DTO for creating a notification
 */
export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsString()
  orgId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  data?: any;

  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  matchId?: string;

  @IsString()
  @IsOptional()
  roundId?: string;
}

/**
 * DTO for creating and sending a notification (includes preference checks)
 */
export class CreateAndSendNotificationDto extends CreateNotificationDto {
  @IsBoolean()
  @IsOptional()
  sendWebSocket?: boolean;

  @IsBoolean()
  @IsOptional()
  sendPush?: boolean;
}

/**
 * DTO for bulk notification creation
 */
export class BulkCreateNotificationDto {
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  orgId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  data?: any;

  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  matchId?: string;

  @IsString()
  @IsOptional()
  roundId?: string;
}

/**
 * DTO for querying notifications
 */
export class GetNotificationsDto {
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;
}

/**
 * DTO for marking notifications as read
 */
export class MarkAsReadDto {
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

/**
 * DTO for updating notification preference
 */
export class UpdatePreferenceDto {
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsBoolean()
  @IsOptional()
  enableInApp?: boolean;

  @IsBoolean()
  @IsOptional()
  enablePush?: boolean;

  @IsBoolean()
  @IsOptional()
  enableEmail?: boolean;
}

/**
 * DTO for registering a push notification token
 */
export class RegisterTokenDto {
  @IsString()
  token: string;

  @IsEnum(['IOS', 'ANDROID', 'WEB'])
  platform: 'IOS' | 'ANDROID' | 'WEB';
}

/**
 * Interface for notification preferences with defaults
 */
export interface NotificationPreference {
  notificationType: NotificationType;
  enableInApp: boolean;
  enablePush: boolean;
  enableEmail: boolean;
}

/**
 * Default notification preferences (all enabled except email)
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Record<NotificationType, Omit<NotificationPreference, 'notificationType'>> = {
  EVENT_PUBLISHED: { enableInApp: true, enablePush: true, enableEmail: false },
  EVENT_STARTING_SOON: { enableInApp: true, enablePush: true, enableEmail: false },
  PAIRINGS_POSTED: { enableInApp: true, enablePush: true, enableEmail: false },
  ROUND_STARTED: { enableInApp: true, enablePush: true, enableEmail: false },
  MATCH_RESULT_CONFIRMED: { enableInApp: true, enablePush: true, enableEmail: false },
  TOURNAMENT_COMPLETED: { enableInApp: true, enablePush: true, enableEmail: false },
  PRIZES_DISTRIBUTED: { enableInApp: true, enablePush: true, enableEmail: false },
  EVENT_CANCELLED: { enableInApp: true, enablePush: true, enableEmail: false },
  EVENT_UPDATED: { enableInApp: true, enablePush: true, enableEmail: false },
  MATCH_RESULT_REPORTED: { enableInApp: true, enablePush: true, enableEmail: false },
  PLAYER_REGISTERED: { enableInApp: true, enablePush: true, enableEmail: false },
  ALL_PLAYERS_CHECKED_IN: { enableInApp: true, enablePush: true, enableEmail: false },
  MATCH_DISPUTED: { enableInApp: true, enablePush: true, enableEmail: false },
  ROUND_COMPLETION_READY: { enableInApp: true, enablePush: true, enableEmail: false },
  PLAYER_DROPPED: { enableInApp: true, enablePush: false, enableEmail: false },
  SYSTEM_ERROR: { enableInApp: true, enablePush: true, enableEmail: false },
};
