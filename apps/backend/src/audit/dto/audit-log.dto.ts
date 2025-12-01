import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { AuditAction } from '@prisma/client';

export class AuditLogDto {
  @IsString({ message: 'Organization ID must be a string' })
  orgId: string;

  @IsEnum(AuditAction, {
    message: 'Action must be one of: CREDIT_ADJUST, MATCH_OVERRIDE, ROUND_REPAIR, BYE_ASSIGN, PLAYER_DROP, PLAYER_LATE_ADD, EVENT_CANCEL, DECKLIST_LOCK, RESULT_OVERRIDE',
  })
  action: AuditAction;

  @IsString({ message: 'Performed by (user ID) must be a string' })
  performedBy: string;

  @IsOptional()
  @IsString({ message: 'Target user ID must be a string' })
  targetUserId?: string;

  @IsOptional()
  @IsString({ message: 'Target event ID must be a string' })
  targetEventId?: string;

  @IsOptional()
  @IsString({ message: 'Target match ID must be a string' })
  targetMatchId?: string;

  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: Record<string, any>;
}
