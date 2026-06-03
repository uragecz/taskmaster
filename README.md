# TaskMaster

A full-stack task manager: a Next.js frontend talking to an Express + MikroORM
API backed by PostgreSQL, with cookie-based auth and live updates over
WebSockets. Organized as a pnpm monorepo and fronted by a Caddy reverse proxy.

## Tech stack

| Layer    | Choice                                                                    |
| -------- | ------------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router) + React Query                                     |
| Backend  | Express + TypeScript, layered (route → controller → service → repository) |
| ORM / DB | MikroORM + PostgreSQL                                                     |
| Auth     | JWT in an httpOnly cookie + bcrypt; todos scoped per user                 |
| Realtime | Socket.io (per-user rooms)                                                |
| Gateway  | Caddy reverse proxy (single origin, automatic HTTPS in prod)              |
| Tooling  | pnpm workspaces, Docker, Vitest + Supertest                              |

See [`PLAN.md`](./PLAN.md) for the delivery strategy and [`HANDOVER.md`](./HANDOVER.md)
for the remaining backlog.

## Architecture

```
browser ─→ Caddy (:8080) ─┬─ /api/*  → api:4000   (Caddy strips /api)
                          └─ /*      → web:3000
```

Everything is one origin, so there is no CORS and the auth cookie is same-origin.
The backend owns clean routes (`/todos`, `/auth`, `/health`); the `/api` prefix is
a gateway concern (stripped by Caddy in prod, by a Next.js rewrite in dev).

```
apps/
  web/        Next.js frontend (pure client of the API)
  api/        Express + MikroORM backend
Caddyfile            reverse-proxy routing
docker-compose.yml   postgres + api + web + caddy
```

## Prerequisites

- **Node.js LTS** (v20+, developed on v24) and **pnpm** (via Corepack)
- **Docker** + Docker Compose

## Quick start (Docker)

```bash
docker compose up --build
```

Brings up `postgres`, `api` (runs migrations on start), `web` and `caddy`. Then
open **http://localhost:8080** and **register an account** (or seed the demo user
below).

## Local development

```bash
# 1. install dependencies
pnpm install

# 2. start PostgreSQL
docker compose up -d postgres

# 3. set up the API env + database
cp apps/api/.env.example apps/api/.env
pnpm --filter @taskmaster/api migration:up
pnpm --filter @taskmaster/api seed        # optional: demo@taskmaster.dev / demo1234

# 4. set up the web env
cp apps/web/.env.example apps/web/.env.local

# 5. run both apps
pnpm dev
```

Open http://localhost:3000. In dev a Next.js rewrite forwards `/api/*` to the API
on `:4000`, mirroring the production proxy.

## Tests

```bash
pnpm --filter @taskmaster/api test
```

Integration tests (Vitest + Supertest) cover auth, validation and cross-user
isolation. They run against a dedicated `taskmaster_test` database that is created
automatically (requires the Postgres container).

## Environment variables

**API** (`apps/api/.env`)

| Variable                  | Notes                                                       |
| ------------------------- | ----------------------------------------------------------- |
| `NODE_ENV`                | `development` / `production`                                |
| `PORT`                    | `4000`                                                      |
| `DATABASE_URL`            | `postgresql://taskmaster:taskmaster@localhost:5432/taskmaster` |
| `CORS_ORIGIN`             | web origin (unused with the single-origin proxy)            |
| `JWT_SECRET`              | secret for signing auth tokens (16+ chars)                  |
| `JWT_EXPIRES_IN`          | token lifetime, e.g. `7d`                                   |
| `COOKIE_SECURE`           | `true`/`false`; defaults to on in production (HTTPS)        |
| `SEED_USER_EMAIL/PASSWORD`| demo account created by `pnpm seed` (dev only)              |

**Web** (`apps/web/.env.local`)

| Variable              | Notes                                                          |
| --------------------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | leave empty → the browser calls the API on the same origin (`/api/*`). Set an absolute URL only if the API is on a different origin. Inlined at build time. |

## Deploying to a VM

The whole stack (incl. the proxy) is `docker compose up`, so any Linux VM with
Docker works (Hetzner, DigitalOcean, AWS EC2, …).

1. Provision a VM (e.g. Ubuntu 24.04), open ports `80`/`443`.
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Get the code and point the `Caddyfile` at your domain — replace `:80` with
   `example.com` and Caddy provisions HTTPS automatically.
4. Set production secrets (a real `JWT_SECRET`, drop `COOKIE_SECURE=false` so the
   cookie is `Secure`) and run `docker compose up -d --build`.

> Behind a proxy, set `app.set("trust proxy", 1)` in the API so the per-IP rate
> limiter sees the real client IP (tracked in `HANDOVER.md`).
