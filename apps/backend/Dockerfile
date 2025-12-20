# Railway-specific Dockerfile (must be built from monorepo root)
# Railway should set: Root Directory = / (or leave blank)
# Using Debian slim instead of Alpine for better Prisma compatibility
# REBUILD: 2025-12-19 - Force cache bust for deployment
FROM node:20-slim AS builder

# Install OpenSSL and required libraries for Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files first
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy ALL workspace package files (required for npm ci with root package-lock.json)
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/tournament-logic/package.json ./packages/tournament-logic/
COPY apps/backend/package.json ./apps/backend/
COPY apps/admin-web/package.json ./apps/admin-web/
COPY apps/mobile/package.json ./apps/mobile/
COPY apps/website/package.json ./apps/website/

# Install all workspace dependencies
# npm ci requires ALL workspace package.json files to match package-lock.json
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy workspace source code
COPY packages ./packages/
COPY apps/backend ./apps/backend/

# Build workspace packages first (they're dependencies of backend)
WORKDIR /app/packages/shared-types
RUN npm run build

WORKDIR /app/packages/tournament-logic
RUN npm run build

# Generate Prisma Client
WORKDIR /app/apps/backend

# Set a dummy DATABASE_URL for build time (Prisma needs it to generate)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Force clean Prisma generation with correct binary target
RUN rm -rf node_modules/.prisma node_modules/@prisma/client 2>/dev/null || true
RUN npx prisma generate --schema=./prisma/schema.prisma

# Verify Prisma binary was generated correctly
RUN echo "Verifying Prisma client generation..." && \
    ls -la /app/node_modules/.prisma/client/ && \
    echo "Prisma client generated successfully"

# Build the application
RUN npm run build

# Verify build output with detailed paths
RUN echo "=== Build Verification ===" && \
    pwd && \
    ls -la dist/ && \
    find /app -name "main.js" -type f && \
    echo "Build completed successfully"

# Production stage
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules

# Install dumb-init, OpenSSL, and required runtime libraries
RUN apt-get update && apt-get install -y \
    dumb-init \
    openssl \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nestjs

# Copy root package.json and workspace structure
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/package.json ./packages/tournament-logic/
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/

# Copy compiled workspace packages (dist folders contain compiled JS)
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/dist ./packages/tournament-logic/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/package.json ./packages/tournament-logic/package.json

# Copy node_modules from builder instead of reinstalling
# This ensures all dependencies from the monorepo are available
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built backend application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./apps/backend/prisma

# Copy Prisma client from builder (critical!)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Verify rxjs is properly available (critical for NestJS)
RUN echo "=== Verifying rxjs installation ===" && \
    ls -la /app/node_modules/rxjs/ && \
    node -e "require('rxjs'); require('rxjs/operators'); console.log('✅ rxjs verified successfully');"

# Copy start script
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/start.sh ./apps/backend/start.sh
RUN chmod +x ./apps/backend/start.sh

# Verify all files are in place before switching user
RUN echo "=== Production Image Verification ===" && \
    ls -la /app/apps/backend/ && \
    echo "=== Checking dist directory ===" && \
    ls -la /app/apps/backend/dist/ && \
    echo "=== Finding main.js ===" && \
    find /app/apps/backend/dist -name "main.js" -type f || echo "main.js location check"

# Switch to non-root user
USER nestjs

WORKDIR /app/apps/backend

# Expose port
EXPOSE 3000

# Health check with longer timeout for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Use the start script which handles migrations gracefully
CMD ["./start.sh"]
