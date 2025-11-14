# Railway-specific Dockerfile (must be built from monorepo root)
# Railway should set: Root Directory = / (or leave blank)
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma in builder stage
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copy root package files first
COPY package*.json ./

# Copy workspace package files
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/tournament-logic/package.json ./packages/tournament-logic/
COPY apps/backend/package.json ./apps/backend/

# Install all workspace dependencies
RUN npm ci || npm install

# Copy workspace source code
COPY packages ./packages/
COPY apps/backend ./apps/backend/

# Generate Prisma Client
WORKDIR /app/apps/backend

# Set a dummy DATABASE_URL for build time (Prisma needs it to generate)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

RUN npx prisma generate

# Build the application
RUN npm run build

# Verify build output
RUN ls -la dist/ && echo "Build completed successfully"

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init and other necessary tools
RUN apk add --no-cache dumb-init openssl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy root package.json and workspace structure
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder --chown=nestjs:nodejs /app/packages/tournament-logic/package.json ./packages/tournament-logic/
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./apps/backend/

# Copy built workspace packages source (they're imported as TypeScript, need source)
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages/

# Install production dependencies for all workspaces
RUN npm ci --omit=dev --workspaces || npm install --omit=dev --workspaces

# Copy built backend application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./apps/backend/prisma

# Copy Prisma client from builder (critical!)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy start script
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/start.sh ./apps/backend/start.sh
RUN chmod +x ./apps/backend/start.sh

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
