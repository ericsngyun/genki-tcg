import { IsString, IsOptional, IsUrl, MaxLength, ValidateIf } from 'class-validator';
import { Prisma } from '@prisma/client';

export class SubmitDecklistDto {
  @IsString({ message: 'Entry ID must be a string' })
  entryId: string;

  @IsOptional()
  @IsString({ message: 'Deck name must be a string' })
  @MaxLength(100, { message: 'Deck name must not exceed 100 characters' })
  deckName?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Main deck URL must be a valid URL' })
  @MaxLength(500, { message: 'Main deck URL must not exceed 500 characters' })
  mainDeckUrl?: string;

  @IsOptional()
  mainDeckJson?: Prisma.InputJsonValue;
}
