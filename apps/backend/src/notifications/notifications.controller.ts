import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type';
import {
  GetNotificationsDto,
  MarkAsReadDto,
  UpdatePreferenceDto,
  RegisterTokenDto,
} from './notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * Get user's notifications (paginated)
   * GET /notifications?status=UNREAD&limit=20&offset=0
   */
  @Get()
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationsService.getUserNotifications(
      user.sub,
      user.orgId,
      query
    );
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.getUnreadCount(
      user.sub,
      user.orgId
    );
    return { count };
  }

  /**
   * Mark specific notifications as read
   * PATCH /notifications/read
   * Body: { notificationIds: string[] }
   */
  @Patch('read')
  async markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MarkAsReadDto,
  ) {
    await this.notificationsService.markAsRead(dto.notificationIds, user.sub);
    return { success: true };
  }

  /**
   * Mark all notifications as read
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markAllAsRead(user.sub, user.orgId);
    return { success: true };
  }

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async deleteNotification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') notificationId: string,
  ) {
    await this.notificationsService.deleteNotification(notificationId, user.sub);
    return { success: true };
  }

  /**
   * Get all notification preferences
   * GET /notifications/preferences
   */
  @Get('preferences')
  async getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getAllPreferences(user.sub, user.orgId);
  }

  /**
   * Update notification preference
   * PATCH /notifications/preferences
   * Body: { notificationType, enableInApp?, enablePush?, enableEmail? }
   */
  @Patch('preferences')
  async updatePreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.notificationsService.updatePreference(
      user.sub,
      user.orgId,
      dto
    );
  }

  /**
   * Register a push notification token
   * POST /notifications/tokens
   * Body: { token: string, platform: 'IOS' | 'ANDROID' | 'WEB' }
   */
  @Post('tokens')
  async registerToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificationsService.registerToken(
      user.sub,
      dto.token,
      dto.platform as any
    );
  }

  /**
   * Unregister a push notification token
   * DELETE /notifications/tokens/:token
   */
  @Delete('tokens/:token')
  async unregisterToken(@Param('token') token: string) {
    await this.notificationsService.unregisterToken(token);
    return { success: true };
  }
}
