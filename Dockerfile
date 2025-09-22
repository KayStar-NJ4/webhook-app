FROM node:20-alpine AS base

# Install dependencies and build
RUN apk add --no-cache libc6-compat dumb-init
WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --silent

# Copy source and build frontend
COPY . .
RUN yarn build:frontend

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache libc6-compat dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

WORKDIR /app

# Copy package files and install production dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production --silent && \
    yarn cache clean

# Copy built application
COPY --from=base --chown=nodejs:nodejs /app/src ./src
COPY --from=base --chown=nodejs:nodejs /app/scripts ./scripts
COPY --from=base --chown=nodejs:nodejs /app/nginx/html ./nginx/html

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/webhook/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]
CMD ["yarn", "start"]