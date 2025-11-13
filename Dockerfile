# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages ./packages/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY apps/backend ./apps/backend

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files and workspace structure
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package*.json ./packages/shared-types/
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/package*.json ./packages/tournament-logic/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=apps/backend && \
    npm cache clean --force

# Copy shared package source (needed at runtime for TypeScript imports)
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types ./packages/shared-types
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic ./packages/tournament-logic

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

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

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
