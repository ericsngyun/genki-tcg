import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class RedeemCreditsDto {
  @IsString()
  userId: string;

  @IsNumber()
  @Min(1, { message: 'Redemption amount must be at least 1 credit' })
  @Max(10000, { message: 'Cannot redeem more than 10,000 credits at once' })
  amount: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
