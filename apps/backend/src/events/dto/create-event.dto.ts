import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsBoolean,
  IsDate,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { GameType, EventFormat } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MinLength(3, { message: 'Event name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Event name must not exceed 100 characters' })
  name: string;

  @IsEnum(['ONE_PIECE_TCG', 'AZUKI_TCG', 'RIFTBOUND'], {
    message: 'Game must be one of: ONE_PIECE_TCG, AZUKI_TCG, RIFTBOUND',
  })
  game: GameType;

  @IsEnum(
    ['CONSTRUCTED', 'DRAFT', 'SEALED', 'BOOSTER_DRAFT', 'TWO_HEADED_GIANT', 'COMMANDER', 'OTHER'],
    {
      message: 'Format must be a valid event format',
    },
  )
  format: EventFormat;

  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  startAt: Date;

  @IsOptional()
  @IsInt({ message: 'Max players must be an integer' })
  @Min(2, { message: 'Max players must be at least 2' })
  @Max(1000, { message: 'Max players cannot exceed 1000' })
  maxPlayers?: number;

  @IsOptional()
  @IsInt({ message: 'Entry fee must be an integer (in cents)' })
  @Min(0, { message: 'Entry fee cannot be negative' })
  @Max(1000000, { message: 'Entry fee cannot exceed $10,000' })
  entryFeeCents?: number;

  @IsOptional()
  @IsBoolean({ message: 'Requires decklist must be a boolean' })
  requiresDecklist?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Total prize credits must be an integer (in cents)' })
  @Min(0, { message: 'Total prize credits cannot be negative' })
  @Max(10000000, { message: 'Total prize credits cannot exceed $100,000' })
  totalPrizeCredits?: number;
}
