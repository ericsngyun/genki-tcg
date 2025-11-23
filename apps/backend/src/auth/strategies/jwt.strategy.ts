import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService, JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {
    const jwtSecret = configService.get('JWT_SECRET');

    // SECURITY: Require JWT_SECRET in production, fail fast
    if (!jwtSecret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use secret from env, only fallback to dev secret in development
      secretOrKey: jwtSecret || 'dev-secret-change-me-in-production',
    });

    if (!jwtSecret) {
      console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET in production!');
    }
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    // Attach orgId and role to request
    return {
      ...user,
      orgId: payload.orgId,
      role: payload.role,
    };
  }
}
