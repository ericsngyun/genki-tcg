import { IsEnum, IsInt, Min, Max } from 'class-validator';
import { MatchResult } from '@prisma/client';

export class PlayerReportResultDto {
  @IsEnum(MatchResult, {
    message: 'Result must be one of: PLAYER_A_WIN, PLAYER_B_WIN, DRAW, INTENTIONAL_DRAW, DOUBLE_LOSS, PLAYER_A_DQ, PLAYER_B_DQ',
  })
  result: MatchResult;

  @IsInt({ message: 'Games won by Player A must be an integer' })
  @Min(0, { message: 'Games won by Player A cannot be negative' })
  @Max(3, { message: 'Games won by Player A cannot exceed 3' })
  gamesWonA: number;

  @IsInt({ message: 'Games won by Player B must be an integer' })
  @Min(0, { message: 'Games won by Player B cannot be negative' })
  @Max(3, { message: 'Games won by Player B cannot exceed 3' })
  gamesWonB: number;
}
