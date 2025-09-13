FROM node:22-alpine AS base

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app/dashboard
COPY dashboard/package.json dashboard/package-lock.json* ./
RUN npm ci

# Development runner image
FROM base AS runner
WORKDIR /app/dashboard
ENV NODE_ENV development
# Improve file watching inside Docker
ENV CHOKIDAR_USEPOLLING=1
ENV WATCHPACK_POLLING=true

# Bring node_modules from deps stage
COPY --from=deps /app/dashboard/node_modules ./node_modules

# Copy source (will be overridden by volume in compose)
COPY dashboard ./

# Run as root during development to avoid volume permission issues
USER root

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "run", "dev"]