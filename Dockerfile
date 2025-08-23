# Install dependencies only when needed
FROM node:22-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat tzdata
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with optimized settings
RUN pnpm install --frozen-lockfile --prod=false

# Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Copy source code
COPY . .

# Copy environment file if it exists
COPY .env* .env* 2>/dev/null || true

ARG DATABASE_TYPE=postgresql
ARG BASE_PATH
ARG COMMIT_SHA

ENV DATABASE_TYPE=$DATABASE_TYPE
ENV BASE_PATH=$BASE_PATH
ENV COMMIT_SHA=$COMMIT_SHA
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NODE_ENV=production

# Build the application
RUN pnpm run build-docker

# Ensure Prisma client is properly generated
RUN npx prisma generate

# Production image, copy all the files and run next
FROM node:22-alpine AS runner
WORKDIR /app

ARG NODE_OPTIONS
ARG COMMIT_SHA

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV COMMIT_SHA=$COMMIT_SHA
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Add user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install necessary packages
RUN apk add --no-cache \
    curl \
    tzdata && \
    cp /usr/share/zoneinfo/UTC /etc/localtime && \
    echo "UTC" > /etc/timezone && \
    apk del tzdata

# Install pnpm and production dependencies
RUN npm install -g pnpm@9
RUN pnpm add npm-run-all dotenv prisma@6.7.0 --prod

# Set correct permissions
RUN chown -R nextjs:nodejs /app
RUN chown -R nextjs:nodejs node_modules/.pnpm/

# Copy application files with correct permissions
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Custom routes
RUN mv ./.next/routes-manifest.json ./.next/routes-manifest-orig.json

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/heartbeat || exit 1

# Start the application
CMD ["pnpm", "start-docker"]
