# TaskMaster

A full-stack task manager: a Next.js frontend talking to an Express + MikroORM
API backed by PostgreSQL, organized as a pnpm monorepo.

## Tech stack

| Layer    | Choice                                             |
| -------- | -------------------------------------------------- |
| Frontend | Next.js 16 (App Router) + React Query              |
| Backend  | Express + TypeScript, layered (route → controller → service → repository) |
| ORM / DB | MikroORM + PostgreSQL                               |
| Auth     | _planned_ (see `HANDOVER.md`)                      |
| Tooling  | pnpm workspaces, Docker, Vitest + Supertest        |

See [`PLAN.md`](./PLAN.md) for the delivery strategy and the architecture
decision behind a standalone backend (vs. Next.js API routes).

## Repository layout

```
apps/
  web/        Next.js frontend (pure client of the API)
  api/        Express + MikroORM backend
docker-compose.yml   postgres + api + web
```

## Prerequisites

- **Node.js LTS** (v20+, developed on v24) and **pnpm** (via Corepack)
- **Docker** + Docker Compose (for PostgreSQL locally and for the container build)

## Local development

```bash
# 1. install dependencies
pnpm install

# 2. start PostgreSQL
docker compose up -d postgres

# 3. set up the API env + database
cp apps/api/.env.example apps/api/.env
pnpm --filter @taskmaster/api migration:up
pnpm --filter @taskmaster/api seed        # optional demo data

# 4. set up the web env
cp apps/web/.env.example apps/web/.env.local

# 5. run both apps (web :3000, api :4000)
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (`/health`, `/api/todos`)

## Tests

```bash
pnpm --filter @taskmaster/api test
```

Integration tests (Vitest + Supertest) run against a dedicated `taskmaster_test`
database, which is created automatically (requires the Postgres container).

## Running the whole stack in Docker

```bash
docker compose up --build
```

Brings up `postgres`, `api` (runs migrations on start) and `web`, all wired
together. Open http://localhost:3000.

## Environment variables

**API** (`apps/api/.env`)

| Variable       | Example                                                   |
| -------------- | --------------------------------------------------------- |
| `NODE_ENV`     | `development` / `production`                               |
| `PORT`         | `4000`                                                     |
| `DATABASE_URL` | `postgresql://taskmaster:taskmaster@localhost:5432/taskmaster` |
| `CORS_ORIGIN`  | `http://localhost:3000` (the web origin)                  |

**Web** (`apps/web/.env.local`)

| Variable              | Notes                                                |
| --------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL the **browser** uses to reach the API. Inlined at build time. |

> `NEXT_PUBLIC_API_URL` is baked into the client bundle during `next build`, so
> it must be the URL the browser can reach — not an internal Docker hostname.

## Deploying to a VM

The whole stack is just `docker compose up`, so any Linux VM with Docker works
(Hetzner, DigitalOcean, AWS EC2, …).

**1. Provision a VM** (e.g. Ubuntu 24.04) and open ports `80`/`443` (and `22`).

**2. Install Docker:**

```bash
curl -fsSL https://get.docker.com | sh
```

**3. Get the code** (`git clone` the repo, or copy it over).

**4. Configure production values.** The API URL is baked into the web image at
build time, so set it to your public domain. With a reverse proxy serving the
API under the same origin (recommended), web and API share one domain — so CORS
is trivially satisfied:

```yaml
# docker-compose.override.yml
services:
  api:
    environment:
      NODE_ENV: production
      CORS_ORIGIN: https://example.com
  web:
    build:
      args:
        NEXT_PUBLIC_API_URL: https://example.com
```

**5. Start it:**

```bash
docker compose up -d --build
```

**6. Put a reverse proxy in front** for HTTPS. [Caddy](https://caddyserver.com)
gives you automatic TLS — example `Caddyfile`:

```
example.com {
    handle /api/* {
        reverse_proxy localhost:4000
    }
    handle {
        reverse_proxy localhost:3000
    }
}
```

This routes `example.com/api/*` to the API and everything else to the web app,
on one origin behind TLS.

> When running behind a proxy, set `app.set("trust proxy", 1)` in the API so the
> per-IP rate limiter sees the real client IP (tracked in `HANDOVER.md`).
