# Configuration System

This directory contains the centralized, type-safe configuration system for the backend API.

## 📋 Overview

The configuration system provides:
- ✅ **Type-safe environment variables** - Full TypeScript support with autocomplete
- ✅ **Startup validation** - App fails fast with clear errors if config is invalid
- ✅ **Self-documenting** - All variables documented in validation schema
- ✅ **Production-safe** - Prevents crashes from misconfiguration

## 📁 Files

### `env.validation.ts`
Defines the schema for all environment variables with validation rules.

**Key Features:**
- Uses `class-validator` decorators for validation
- Validates data types, formats, and required vs optional
- Provides clear error messages for invalid values
- Prevents placeholder values from reaching production

**Example:**
```typescript
@IsString()
@IsNotEmpty({ message: 'DATABASE_URL is required' })
@Matches(/^postgresql:\/\/.+/, {
  message: 'DATABASE_URL must be a valid PostgreSQL connection string',
})
DATABASE_URL: string;
```

### `configuration.ts`
Exports a structured configuration object loaded from validated environment variables.

**Benefits:**
- Centralized configuration access
- Nested structure for organization
- Type-safe access via `ConfigService`

**Usage in Services:**
```typescript
import { ConfigService } from '@nestjs/config';

constructor(private config: ConfigService) {}

// Type-safe access with autocomplete
const jwtSecret = this.config.get('jwt.secret');
const port = this.config.get('port');
```

## 🚀 How It Works

### 1. Startup Validation

When the app starts, the configuration system:

1. Loads environment variables from `.env` file
2. Validates all variables against the schema
3. Transforms string values to correct types (numbers, booleans, etc.)
4. **Throws detailed error if validation fails**
5. Provides type-safe config object to all modules

### 2. Validation Flow

```
┌─────────────────┐
│  .env file      │
│  (raw values)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  plainToClass() │  ← Transforms to EnvironmentVariables class
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  validateSync() │  ← Validates using class-validator
└────────┬────────┘
         │
         ▼
    ┌───────┬──────────┐
    │ FAIL  │  SUCCESS │
    ▼       ▼          │
 ❌ Throw  ✅ Return   │
 detailed  validated  │
 error     config     │
```

### 3. Error Messages

If validation fails, you'll see detailed, actionable error messages:

```
╔═══════════════════════════════════════════════════════════════════╗
║  ❌ ENVIRONMENT VALIDATION FAILED                                 ║
╚═══════════════════════════════════════════════════════════════════╝

The following environment variables are missing or invalid:

  ❌ JWT_SECRET: JWT_SECRET must be replaced with a real secret (not the placeholder value)
  ❌ DATABASE_URL: DATABASE_URL is required. Format: postgresql://user:pass@host:5432/dbname
  ❌ REDIS_URL: REDIS_URL must be a valid Redis connection string (redis://...)

📝 Quick Fix:
  1. Copy .env.local.example to .env
  2. Replace all placeholder values with real credentials
  3. For JWT secrets, run: openssl rand -base64 64

📚 Documentation: See apps/backend/.env.local.example for details
```

## 🛠️ Adding New Environment Variables

To add a new environment variable:

### Step 1: Add to validation schema (`env.validation.ts`)

```typescript
@IsString()
@IsNotEmpty({ message: 'MY_NEW_VAR is required' })
MY_NEW_VAR: string;
```

### Step 2: Add to configuration loader (`configuration.ts`)

```typescript
export default () => ({
  // ... existing config
  myFeature: {
    newVar: process.env.MY_NEW_VAR,
  },
});
```

### Step 3: Document in `.env.local.example`

```bash
# ============================================================================
# MY FEATURE
# ============================================================================
# Description of what this variable does
MY_NEW_VAR="default-value"
```

### Step 4: Use in your services

```typescript
constructor(private config: ConfigService) {}

const myVar = this.config.get('myFeature.newVar');
```

## 📚 Validation Decorators

Common decorators from `class-validator`:

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@IsString()` | Must be a string | `@IsString() NAME: string` |
| `@IsNumber()` | Must be a number | `@IsNumber() PORT: number` |
| `@IsUrl()` | Must be a valid URL | `@IsUrl() API_URL: string` |
| `@IsEnum(Enum)` | Must be one of enum values | `@IsEnum(Environment) NODE_ENV` |
| `@IsNotEmpty()` | Cannot be empty | `@IsNotEmpty() SECRET: string` |
| `@IsOptional()` | Variable is optional | `@IsOptional() FEATURE?: string` |
| `@Min(n)` | Min value for numbers | `@Min(1024) PORT: number` |
| `@Max(n)` | Max value for numbers | `@Max(65535) PORT: number` |
| `@Matches(regex)` | Must match regex | `@Matches(/^postgresql/) URL` |

## 🔒 Security Best Practices

### ✅ DO:
- Use strong validation rules
- Reject placeholder values (e.g., "REPLACE_WITH_...")
- Validate format (URLs, connection strings, etc.)
- Fail fast on startup if config is invalid
- Document all variables with examples

### ❌ DON'T:
- Allow placeholder values to reach production
- Use weak or missing validation
- Hard-code sensitive values in code
- Ignore validation errors

## 🧪 Testing Configuration

To test that validation works:

1. **Remove a required variable** from `.env`:
   ```bash
   # DATABASE_URL="postgresql://..."  # Comment out
   ```

2. **Start the app**:
   ```bash
   npm run dev:backend
   ```

3. **You should see**:
   ```
   ❌ DATABASE_URL: DATABASE_URL is required...
   ```

4. **App should NOT start** until you fix the config

## 📖 Examples

### Example 1: Required String with Format Validation
```typescript
@IsString()
@IsNotEmpty({ message: 'DATABASE_URL is required' })
@Matches(/^postgresql:\/\/.+/, {
  message: 'DATABASE_URL must start with postgresql://',
})
DATABASE_URL: string;
```

### Example 2: Optional Number with Range
```typescript
@IsNumber()
@IsOptional()
@Min(1024, { message: 'PORT must be >= 1024' })
@Max(65535, { message: 'PORT must be <= 65535' })
PORT?: number = 3001; // Default value
```

### Example 3: Enum Validation
```typescript
enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

@IsEnum(Environment)
@IsOptional()
NODE_ENV: Environment = Environment.Development;
```

### Example 4: Preventing Placeholder Values
```typescript
@IsString()
@IsNotEmpty()
@Matches(/^(?!.*REPLACE).*$/, {
  message: 'JWT_SECRET must be replaced with a real secret',
})
JWT_SECRET: string;
```

## 🚨 Common Issues

### Issue: "Cannot find module './config/configuration'"
**Solution:** Ensure both files exist:
- `src/config/env.validation.ts`
- `src/config/configuration.ts`

### Issue: Validation passes but values are undefined
**Solution:** Make sure variables are listed in both:
1. `env.validation.ts` schema
2. `configuration.ts` loader

### Issue: Type errors when accessing config
**Solution:** The config object structure must match what you defined in `configuration.ts`:
```typescript
// If you defined:
export default () => ({
  jwt: { secret: process.env.JWT_SECRET }
});

// Access it as:
this.config.get('jwt.secret');  // ✅ Correct
this.config.get('JWT_SECRET');   // ❌ Wrong
```

## 📚 Related Documentation

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [class-validator](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)

## ✅ Checklist for Production

Before deploying to production, verify:

- [ ] All required environment variables are set
- [ ] No placeholder values remain (REPLACE_WITH_...)
- [ ] Secrets are cryptographically strong (use `openssl rand -base64 64`)
- [ ] Database URLs point to production database
- [ ] Redis URL points to production Redis
- [ ] CORS_ORIGINS includes all production frontend URLs
- [ ] Sentry DSN is configured for error tracking
- [ ] Email service is configured (SENDGRID_API_KEY)
- [ ] NODE_ENV is set to "production"

---

**Last Updated:** December 12, 2025
