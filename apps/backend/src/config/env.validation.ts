import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsUrl,
  IsOptional,
  validateSync,
  IsNotEmpty,
  Min,
  Max,
  Matches,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Environment Variables Schema with Validation
 *
 * This class defines all required and optional environment variables
 * with strict validation rules. The app will FAIL TO START if any
 * required variable is missing or invalid.
 *
 * Benefits:
 * - Type-safe environment access
 * - Fails fast on startup with clear error messages
 * - Prevents production crashes from misconfiguration
 * - Self-documenting configuration
 */
export class EnvironmentVariables {
  // ============================================================================
  // ENVIRONMENT
  // ============================================================================

  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  // ============================================================================
  // DATABASE
  // ============================================================================

  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required. Format: postgresql://user:pass@host:5432/dbname' })
  @Matches(/^postgresql:\/\/.+/, {
    message: 'DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...)',
  })
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  @Matches(/^postgresql:\/\/.+/, {
    message: 'TEST_DATABASE_URL must be a valid PostgreSQL connection string if provided',
  })
  TEST_DATABASE_URL?: string;

  // ============================================================================
  // REDIS
  // ============================================================================

  @IsString()
  @IsNotEmpty({ message: 'REDIS_URL is required. Format: redis://host:6379' })
  @Matches(/^redis(s)?:\/\/.+/, {
    message: 'REDIS_URL must be a valid Redis connection string (redis://...)',
  })
  REDIS_URL: string;

  // ============================================================================
  // JWT AUTHENTICATION
  // ============================================================================

  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required. Generate with: openssl rand -base64 64' })
  @Matches(/^(?!.*REPLACE).*$/, {
    message: 'JWT_SECRET must be replaced with a real secret (not the placeholder value)',
  })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsString()
  @IsNotEmpty({ message: 'REFRESH_TOKEN_SECRET is required and must be different from JWT_SECRET' })
  @Matches(/^(?!.*REPLACE).*$/, {
    message: 'REFRESH_TOKEN_SECRET must be replaced with a real secret (not the placeholder value)',
  })
  REFRESH_TOKEN_SECRET: string;

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_EXPIRES_IN: string = '7d';

  // ============================================================================
  // DISCORD OAUTH
  // ============================================================================

  @IsString()
  @IsNotEmpty({ message: 'DISCORD_CLIENT_ID is required. Get it from https://discord.com/developers/applications' })
  DISCORD_CLIENT_ID: string;

  @IsString()
  @IsNotEmpty({ message: 'DISCORD_CLIENT_SECRET is required. Get it from https://discord.com/developers/applications' })
  @Matches(/^(?!.*your-discord).*$/, {
    message: 'DISCORD_CLIENT_SECRET must be replaced with your actual Discord client secret',
  })
  DISCORD_CLIENT_SECRET: string;

  @IsString()
  @IsOptional()
  DISCORD_ALLOWED_REDIRECTS?: string;

  // ============================================================================
  // API CONFIGURATION
  // ============================================================================

  @IsNumber()
  @IsOptional()
  @Min(1024, { message: 'API_PORT must be >= 1024' })
  @Max(65535, { message: 'API_PORT must be <= 65535' })
  API_PORT?: number = 3001;

  @IsNumber()
  @IsOptional()
  @Min(1024, { message: 'PORT must be >= 1024' })
  @Max(65535, { message: 'PORT must be <= 65535' })
  PORT?: number;

  @IsUrl({ require_tld: false }, { message: 'API_URL must be a valid URL' })
  @IsOptional()
  API_URL?: string = 'http://localhost:3001';

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string = 'http://localhost:3000,http://localhost:8081,genki-tcg://';

  // ============================================================================
  // OBSERVABILITY
  // ============================================================================

  @IsString()
  @IsOptional()
  SENTRY_DSN?: string;

  @IsString()
  @IsOptional()
  SENTRY_ORG?: string;

  @IsString()
  @IsOptional()
  SENTRY_PROJECT?: string;

  // ============================================================================
  // ORGANIZATION
  // ============================================================================

  @IsString()
  @IsOptional()
  DEFAULT_ORG_SLUG?: string = 'genki';

  @IsString()
  @IsOptional()
  DEFAULT_INVITE_CODE?: string = 'GENKI';

  // ============================================================================
  // EMAIL (Optional - will be required later)
  // ============================================================================

  @IsString()
  @IsOptional()
  SENDGRID_API_KEY?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;

  // ============================================================================
  // PUSH NOTIFICATIONS (Optional)
  // ============================================================================

  @IsString()
  @IsOptional()
  EXPO_ACCESS_TOKEN?: string;
}

/**
 * Validates environment variables and throws detailed errors on failure
 *
 * @param config - Raw process.env object
 * @returns Validated and type-safe configuration object
 * @throws Error with detailed validation messages if any variable is invalid
 */
export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true, // Convert string numbers to actual numbers
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false, // Allow extra env vars (won't be in validated config)
  });

  if (errors.length > 0) {
    // Format errors for human readability
    const errorMessages = errors.map(error => {
      const constraints = error.constraints
        ? Object.values(error.constraints)
        : ['Unknown validation error'];

      return `  L ${error.property}: ${constraints.join(', ')}`;
    });

    throw new Error(
      `\n` +
      `TPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW\n` +
      `Q  L ENVIRONMENT VALIDATION FAILED                                 Q\n` +
      `ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]\n` +
      `\n` +
      `The following environment variables are missing or invalid:\n` +
      `\n` +
      `${errorMessages.join('\n')}\n` +
      `\n` +
      `=Ý Quick Fix:\n` +
      `  1. Copy .env.local.example to .env\n` +
      `  2. Replace all placeholder values with real credentials\n` +
      `  3. For JWT secrets, run: openssl rand -base64 64\n` +
      `\n` +
      `=Ú Documentation: See apps/backend/.env.local.example for details\n` +
      `\n`
    );
  }

  return validatedConfig;
}
