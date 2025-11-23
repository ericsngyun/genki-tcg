# Multi-stage build for production
FROM node:20-alpine AS builder

# Install OpenSSL and other dependencies needed for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages ./packages/

# Install all dependencies (including dev dependencies for build)
# Using --legacy-peer-deps to handle React 18/19 version conflicts between admin-web and mobile
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps/backend ./apps/backend

# Build workspace packages first (they're dependencies of backend)
WORKDIR /app/packages/shared-types
RUN npm run build

WORKDIR /app/packages/tournament-logic
RUN npm run build

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build the backend application
RUN npm run build

# Verify build output location
RUN echo "=== Checking build output ===" && \
    find /app -name "main.js" -type f && \
    ls -la /app/apps/backend/dist/ || true

# Production stage
FROM node:20-alpine

# Install runtime dependencies for Prisma and NestJS
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files and workspace structure
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package*.json ./packages/shared-types/
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/package*.json ./packages/tournament-logic/

# Install production dependencies only
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy compiled workspace packages (dist folders contain compiled JS)
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/dist ./packages/tournament-logic/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/package.json ./packages/tournament-logic/package.json

# Copy built application (NestJS builds to dist/apps/backend/src/* when built from monorepo root)
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/start.sh ./apps/backend/start.sh

# Copy Prisma client (generated in monorepo root node_modules)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Make start script executable
RUN chmod +x ./apps/backend/start.sh

# Switch to non-root user
USER nestjs

WORKDIR /app/apps/backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Run startup script with resilient migration handling
CMD ["./start.sh"]
