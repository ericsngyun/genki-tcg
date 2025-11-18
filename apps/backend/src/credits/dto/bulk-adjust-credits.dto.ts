import { IsArray, ValidateNested, IsString, IsNumber, IsOptional, IsEnum, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import type { CreditReasonCode } from '@prisma/client';

export class BulkCreditAdjustmentDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(-10000, { message: 'Cannot deduct more than 10,000 credits at once' })
  @Max(10000, { message: 'Cannot add more than 10,000 credits at once' })
  amount: number;

  @IsOptional()
  @IsString()
  memo?: string;
}

export class BulkAdjustCreditsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user must be specified' })
  @ArrayMaxSize(100, { message: 'Cannot adjust more than 100 users at once' })
  @ValidateNested({ each: true })
  @Type(() => BulkCreditAdjustmentDto)
  adjustments: BulkCreditAdjustmentDto[];

  @IsEnum(['MANUAL_ADD', 'MANUAL_DEDUCT', 'PRIZE', 'PURCHASE', 'REFUND', 'EVENT_ENTRY', 'EVENT_REFUND'], {
    message: 'Invalid reason code',
  })
  reasonCode: CreditReasonCode;

  @IsOptional()
  @IsString()
  globalMemo?: string;

  @IsOptional()
  @IsString()
  relatedEventId?: string;
}
