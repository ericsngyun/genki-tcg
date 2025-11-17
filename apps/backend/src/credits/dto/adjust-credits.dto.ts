import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import type { CreditReasonCode } from '@prisma/client';

export class AdjustCreditsDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(-10000, { message: 'Cannot deduct more than 10,000 credits at once' })
  @Max(10000, { message: 'Cannot add more than 10,000 credits at once' })
  amount: number;

  @IsEnum(['MANUAL_ADD', 'MANUAL_DEDUCT', 'PRIZE', 'PURCHASE', 'REFUND', 'EVENT_ENTRY', 'EVENT_REFUND', 'OTHER'], {
    message: 'Invalid reason code',
  })
  reasonCode: CreditReasonCode;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsOptional()
  @IsString()
  relatedEventId?: string;
}
