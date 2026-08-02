# ---- Build Stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime Stage ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Tooling required by the agent runtime (PHP linting, git commits)
RUN apk add --no-cache git php83

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Runtime data dirs (bind-mount volumes here)
RUN mkdir -p /app/data /app/workspace

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health > /dev/null 2>&1 || exit 1

CMD ["node", "dist/server.cjs"]
