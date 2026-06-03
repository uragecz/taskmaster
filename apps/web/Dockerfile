# syntax=docker/dockerfile:1

# ---- base: node + pnpm ----
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# ---- build: install + next build (standalone) ----
FROM base AS build
# Flat node_modules so Next's standalone tracer copies real files instead of
# pnpm symlinks (which otherwise yields empty package.json -> ERR_INVALID_PACKAGE_CONFIG).
ENV NPM_CONFIG_NODE_LINKER=hoisted
# NEXT_PUBLIC_* vars are inlined at build time, so the API URL is baked in here.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @taskmaster/web...
COPY apps/web ./apps/web
RUN pnpm --filter @taskmaster/web build

# ---- runtime: minimal standalone server ----
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
# Standalone output (monorepo layout: server.js lives under apps/web).
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
