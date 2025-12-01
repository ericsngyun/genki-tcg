import { IsBoolean, IsEnum, IsInt, IsOptional, Min, Max, ValidateIf } from 'class-validator';
import { MatchResult } from '@prisma/client';

export class ConfirmMatchResultDto {
  @IsBoolean({ message: 'Confirm must be a boolean (true or false)' })
  confirm: boolean;

  // Counter-result fields are required when confirm is false
  @ValidateIf((o) => o.confirm === false)
  @IsEnum(MatchResult, {
    message: 'Counter-result must be one of: PLAYER_A_WIN, PLAYER_B_WIN, DRAW, INTENTIONAL_DRAW, DOUBLE_LOSS, PLAYER_A_DQ, PLAYER_B_DQ',
  })
  counterResult?: MatchResult;

  @IsOptional()
  @IsInt({ message: 'Counter games won by Player A must be an integer' })
  @Min(0, { message: 'Counter games won by Player A cannot be negative' })
  @Max(3, { message: 'Counter games won by Player A cannot exceed 3' })
  counterGamesWonA?: number;

  @IsOptional()
  @IsInt({ message: 'Counter games won by Player B must be an integer' })
  @Min(0, { message: 'Counter games won by Player B cannot be negative' })
  @Max(3, { message: 'Counter games won by Player B cannot exceed 3' })
  counterGamesWonB?: number;
}
