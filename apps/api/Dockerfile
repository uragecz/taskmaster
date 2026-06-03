# syntax=docker/dockerfile:1

# ---- base: node + pnpm ----
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- build: install (incl. dev), compile TS to dist ----
FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @taskmaster/api...
COPY apps/api ./apps/api
RUN pnpm --filter @taskmaster/api build

# ---- prod-deps: only production node_modules ----
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --prod --filter @taskmaster/api...

# ---- runtime: slim image with prod deps + built app ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/api
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
EXPOSE 4000
# Run pending migrations, then start the server.
CMD ["sh", "-c", "node dist/migrate.js && node dist/server.js"]
