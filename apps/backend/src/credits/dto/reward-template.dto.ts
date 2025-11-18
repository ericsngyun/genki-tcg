import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max, MaxLength } from 'class-validator';
import type { CreditReasonCode } from '@prisma/client';

export class CreateRewardTemplateDto {
  @IsString()
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @IsNumber()
  @Min(-10000, { message: 'Amount must be between -10,000 and 10,000' })
  @Max(10000, { message: 'Amount must be between -10,000 and 10,000' })
  amount: number;

  @IsEnum(['MANUAL_ADD', 'MANUAL_DEDUCT', 'PRIZE', 'PURCHASE', 'REFUND', 'EVENT_ENTRY', 'EVENT_REFUND'], {
    message: 'Invalid reason code',
  })
  reasonCode: CreditReasonCode;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRewardTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(-10000, { message: 'Amount must be between -10,000 and 10,000' })
  @Max(10000, { message: 'Amount must be between -10,000 and 10,000' })
  amount?: number;

  @IsOptional()
  @IsEnum(['MANUAL_ADD', 'MANUAL_DEDUCT', 'PRIZE', 'PURCHASE', 'REFUND', 'EVENT_ENTRY', 'EVENT_REFUND'], {
    message: 'Invalid reason code',
  })
  reasonCode?: CreditReasonCode;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ApplyRewardTemplateDto {
  @IsString()
  templateId: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Memo must not exceed 200 characters' })
  memo?: string;
}

export class BulkApplyRewardTemplateDto {
  @IsString()
  templateId: string;

  @IsString({ each: true })
  userIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Memo must not exceed 200 characters' })
  globalMemo?: string;
}
