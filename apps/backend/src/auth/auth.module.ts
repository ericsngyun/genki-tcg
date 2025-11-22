import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DiscordStrategy } from './strategies/discord.strategy';
import { OrgsModule } from '../orgs/orgs.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get('JWT_SECRET');
        if (!secret || secret === 'dev-secret-change-me') {
          throw new Error(
            'JWT_SECRET environment variable must be set to a secure value. ' +
            'Generate one with: openssl rand -base64 64'
          );
        }
        return {
          secret,
          signOptions: {
            expiresIn: config.get('JWT_EXPIRES_IN') || '7d',
          },
        };
      },
    }),
    OrgsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, DiscordStrategy],
  exports: [AuthService, JwtStrategy, DiscordStrategy, PassportModule],
})
export class AuthModule {}
