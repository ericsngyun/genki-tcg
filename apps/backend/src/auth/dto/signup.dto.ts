import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    },
  )
  password: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsString()
  @MinLength(6, { message: 'Invite code must be at least 6 characters' })
  @MaxLength(20, { message: 'Invite code must not exceed 20 characters' })
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Invite code must contain only uppercase letters and numbers',
  })
  inviteCode: string;
}
