import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile } from 'passport-discord-auth';

export interface DiscordProfile {
  id: string;
  username: string;
  email: string | null;
  avatar: string | null;
  discriminator: string;
  global_name: string | null;
}

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(private configService: ConfigService) {
    super({
      clientId: configService.get('DISCORD_CLIENT_ID'),
      clientSecret: configService.get('DISCORD_CLIENT_SECRET'),
      callbackUrl: configService.get('DISCORD_CALLBACK_URL'),
      scope: ['identify', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<DiscordProfile> {
    // Return the Discord profile data
    // The actual user creation/lookup happens in the auth service
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email || null,
      avatar: profile.avatar,
      discriminator: profile.discriminator || '0',
      global_name: profile.global_name || null,
    };
  }
}
