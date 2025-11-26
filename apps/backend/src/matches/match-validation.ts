import { BadRequestException } from '@nestjs/common';
import type { MatchResult } from '@prisma/client';

/**
 * Validate that match result is consistent with game scores
 */
export function validateMatchResult(
  result: MatchResult,
  gamesWonA: number,
  gamesWonB: number,
  isBo3: boolean = false
): void {
  // Non-negative games
  if (gamesWonA < 0 || gamesWonB < 0) {
    throw new BadRequestException('Game scores cannot be negative');
  }

  if (isBo3) {
    // Bo3 validation - Best of 3 format
    if (gamesWonA > 2 || gamesWonB > 2) {
      throw new BadRequestException('Maximum games in Bo3 is 2 per player');
    }
    
    if (gamesWonA === 2 && gamesWonB === 2) {
      throw new BadRequestException(
        'Invalid score: both players cannot win 2 games in Bo3'
      );
    }

    // Total games should be 2 or 3
    const totalGames = gamesWonA + gamesWonB;
    if (totalGames < 2 || totalGames > 3) {
      throw new BadRequestException(
        'Invalid score: total games must be 2 or 3 in Bo3'
      );
    }

    // Winner must have exactly 2 games
    if (result === 'PLAYER_A_WIN' && gamesWonA !== 2) {
      throw new BadRequestException(
        'Player A win in Bo3 requires exactly 2 games won'
      );
    }

    if (result === 'PLAYER_B_WIN' && gamesWonB !== 2) {
      throw new BadRequestException(
        'Player B win in Bo3 requires exactly 2 games won'
      );
    }

    // Draws are typically 1-1, but could be intentional draws
    if (result === 'DRAW' || result === 'INTENTIONAL_DRAW') {
      // Allow draws in Bo3 (though uncommon)
      if (gamesWonA !== gamesWonB) {
        throw new BadRequestException(
          'Draw result requires equal game scores'
        );
      }
    }
  } else {
    // 1v1 validation - Single game format
    if (result === 'PLAYER_A_WIN') {
      if (gamesWonA <= gamesWonB) {
        throw new BadRequestException(
          'Player A win requires gamesWonA > gamesWonB'
        );
      }
      // In 1v1, typically 1-0
      if (gamesWonA > 1 || gamesWonB > 1) {
        throw new BadRequestException(
          '1v1 format: game scores should be 0 or 1'
        );
      }
    }

    if (result === 'PLAYER_B_WIN') {
      if (gamesWonB <= gamesWonA) {
        throw new BadRequestException(
          'Player B win requires gamesWonB > gamesWonA'
        );
      }
      // In 1v1, typically 0-1
      if (gamesWonA > 1 || gamesWonB > 1) {
        throw new BadRequestException(
          '1v1 format: game scores should be 0 or 1'
        );
      }
    }

    if (result === 'DRAW' || result === 'INTENTIONAL_DRAW') {
      // Draws are typically 1-1 in 1v1, but could be 0-0 for intentional draws
      if (gamesWonA !== gamesWonB) {
        throw new BadRequestException(
          'Draw result requires equal game scores'
        );
      }
    }
  }

  // DQ results don't need game validation (often set to 0-0)
  if (result === 'PLAYER_A_DQ' || result === 'PLAYER_B_DQ') {
    // DQ results are valid regardless of game scores
    return;
  }

  // DOUBLE_LOSS doesn't need game validation
  if (result === 'DOUBLE_LOSS') {
    return;
  }
}

/**
 * Determine if a game type uses Bo3 format
 */
export function isBo3Format(gameType: string): boolean {
  // Riftbound uses Bo3, others use 1v1
  return gameType === 'RIFTBOUND';
}

