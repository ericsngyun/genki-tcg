import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class GetHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  cursor?: string; // Last entry ID for cursor-based pagination

  @IsOptional()
  @IsEnum(['MANUAL_ADD', 'MANUAL_DEDUCT', 'PRIZE', 'PURCHASE', 'REFUND', 'EVENT_ENTRY', 'EVENT_REFUND', 'OTHER'])
  reasonCode?: string;

  @IsOptional()
  @IsString()
  startDate?: string; // ISO date string

  @IsOptional()
  @IsString()
  endDate?: string; // ISO date string
}
