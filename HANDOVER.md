# Handover

The six assignment tasks are implemented end-to-end (production-ready cleanup,
containerization, optimization, database, auth, realtime). This document is the
remaining backlog — actionable cards with acceptance criteria and a starting point
in the codebase.

Estimates are rough person-days (MD) for someone new to the codebase.

## What's already done

- pnpm monorepo (`apps/web` Next.js, `apps/api` Express + MikroORM + PostgreSQL)
- layered backend, zod validation, structured logging (pino)
- JWT-in-httpOnly-cookie auth (bcrypt), todos scoped per user (no IDOR)
- per-user rate limiting behind the proxy (per-IP on public auth routes)
- index `(user_id, created_at)`, stats in a single aggregate query
- smart ordering (unfinished first, then by due date), seed guarded against prod
- realtime updates over Socket.io (per-user rooms)
- Dockerized (multi-stage), single-origin Caddy reverse proxy, compose stack
- integration tests (Vitest + Supertest), clean git history, README

---

## Auth

### Token revocation via refresh tokens
**Priority:** P1  **Estimate:** ~1 MD

Today `logout` only clears the cookie; the JWT stays valid until it expires, so a
leaked token can't be revoked.

**Acceptance criteria**
- [ ] short-lived **access token** (~15 min) + long-lived **refresh token**, both in httpOnly cookies (refresh cookie scoped to the refresh path)
- [ ] `POST /auth/refresh` rotates both tokens
- [ ] refresh tokens are stored server-side and **revoked on logout**
- [ ] `requireAuth` rejects a revoked/rotated token
- [ ] frontend transparently refreshes on a 401, then retries the request

**Where to start:** the auth code is `apps/api/src/modules/auth/` (`jwt.ts`,
`cookie.ts`, `controller.ts`, `service.ts`) and `middleware/requireAuth.ts`. You
need to store refresh tokens server-side so they can be revoked — create a **new**
entity + table for them (same approach as the `User` entity was created; it
doesn't exist yet). On the frontend, the "refresh on a 401 and retry" logic goes
into the `request()` helper in `apps/web/lib/api.ts`.

---

### Password reset + email verification
**Priority:** P3  **Estimate:** ~1.5 MD

**Acceptance criteria**
- [ ] email verification on registration (token link)
- [ ] forgot/reset password flow with a single-use, expiring token

**Where to start:** create a **new** entity + table to hold the single-use
verify/reset tokens (it doesn't exist yet — add it the same way the `User` entity
and its migration were created). Add the reset/verify endpoints in
`apps/api/src/modules/auth/`, send the emails through a provider (Resend / SMTP)
configured via an env var, and add the matching forms next to
`apps/web/app/auth-form.tsx`.

---

## Scaling & Ops

### Move rate-limit counters to a shared store (Redis)
**Priority:** P2  **Estimate:** ~1 MD

Limiting is already per-user / per-IP, but the counters live in memory, so each
replica counts separately.

**Acceptance criteria**
- [ ] counters stored in Redis (`rate-limit-redis`) so limits hold across replicas
- [ ] (prerequisite for the horizontal-scaling card)

**Where to start:** the limiters are in `apps/api/src/middleware/rateLimiters.ts`;
swap the store and add a `redis` service to `docker-compose.yml`.

---

### Run migrations as a separate step (not in the API container CMD)
**Priority:** P2  **Estimate:** ~0.5 MD

The API runs `migrate` on start; with multiple replicas they would race.

**Acceptance criteria**
- [ ] a one-shot migration job/service (compose profile or CI deploy step)
- [ ] the API start command no longer migrates
- [ ] documented in the deploy guide

**Where to start:** the CMD is in `apps/api/Dockerfile`
(`node dist/migrate.js && node dist/server.js`); the runner is
`apps/api/src/migrate.ts`. Move migrate into its own compose service / CI step.

---

### Horizontal scaling
**Priority:** P3  **Estimate:** ~2 MD

Auth (JWT) and data (shared DB) are stateless, but two pieces of **per-instance
state** must move to a shared store before scaling: the in-memory rate-limit
counters and the Socket.io connections/rooms. Caddy can already load-balance.

**Acceptance criteria**
- [ ] `docker compose up --scale api=3` behind Caddy, load spread across replicas
- [ ] depends on Redis rate-limit + migrations-as-a-step
- [ ] Socket.io works across replicas: Redis adapter **and** the multi-node
      transport solved (sticky sessions on Caddy, or force websocket-only)
- [ ] realtime verified across replicas (a change on one replica reaches a client
      connected to another)

**Where to start:** add the Socket.io Redis adapter (`@socket.io/redis-adapter`)
in `apps/api/src/realtime.ts`, and configure Caddy to load-balance across the
`api` replicas (`reverse_proxy` to the scaled service). Mind the Socket.io
multi-node gotcha: the polling handshake breaks across replicas without **sticky
sessions** (LB session affinity) — either enable those in Caddy or force
`transports: ["websocket"]`. The API service has no host-port binding, so remove
any fixed `container_name` and test with `--scale api=3`.

---

### Observability: error tracking + metrics
**Priority:** P2  **Estimate:** ~2 MD

Structured logs exist (pino), but there is no error tracking or metrics, so a
production problem is invisible until someone reads the logs.

**Acceptance criteria**
- [ ] error tracking (e.g. Sentry) on both apps, capturing unhandled errors and 5xx
- [ ] basic API metrics (request rate, latency, error rate), e.g. a Prometheus `/metrics` endpoint
- [ ] the request id from `pino-http` is attached to errors for correlation

**Where to start:**

- _Error tracking:_ API errors all pass through
  `apps/api/src/middleware/errorHandler.ts` (hook the tracker there); `pino-http`
  already sets `req.id` for correlation. On the frontend, hook the QueryClient
  error handler in `apps/web/app/providers.tsx`.
- _Metrics:_ add `prom-client`, register a request-duration histogram + counter
  in a small middleware in `apps/api/src/app.ts` (labels: method / route /
  status), and expose `GET /metrics`. Add `prometheus` (+ `grafana`) services to
  `docker-compose.yml` that scrape `api:4000/metrics`; keep `/metrics` internal
  (do not route it through Caddy).

---

### Infra / deployment (out of app scope)

Handled at the hosting/platform layer, not in the app code — listed so they're
not forgotten when going live:

- **TLS / HTTPS** — terminate at the proxy (Caddy does automatic certs for a real
  domain); compose currently serves plain HTTP on `:80`.
- **Database backups** — automated backup + restore (a managed Postgres usually
  provides this).
- **Secrets management** — `JWT_SECRET` etc. come from a secret store / injected
  env, never committed (compose uses plaintext env for local dev only).

---

## Frontend

### Break up the monolithic page.tsx
**Priority:** P2  **Estimate:** ~1 MD

`apps/web/app/page.tsx` is one ~650-line client component holding all the state,
data fetching, mutations, the add/edit form and the whole render tree. It's hard to
read, reuse and test.

**Acceptance criteria**
- [ ] split into focused components (todo list, todo item, add/edit form, filter bar, stats bar, header)
- [ ] move the pile of `useState` + data hooks out of the component into a context/provider or small hooks (e.g. a `useTodos` hook) instead of one giant component
- [ ] the form is its own component and uses `react-hook-form` (+ a zod resolver) instead of manual `useState` + handlers
- [ ] behaviour unchanged; the React Query data layer stays

**Where to start:** `apps/web/app/page.tsx`. Pull the add/edit form and the filter
bar into their own components first, then the todo item; swap the form's `useState`
for `react-hook-form`. The query/mutation/`useRealtimeTodos` logic can move into a
single `useTodos` hook.

---

### Pagination + list virtualization
**Priority:** P3  **Estimate:** ~1 MD

Per-user lists are small, but a power user with thousands of todos would bloat the
DOM and the response.

**Acceptance criteria**
- [ ] "load more" / infinite scroll on `GET /todos` via `limit`/`offset` — append batches, not numbered pages (cursor only if lists ever get huge)
- [ ] virtualized list (e.g. `react-window`) on the frontend

**Where to start:** read `limit`/`offset` from the query (zod) and pass them into
`findWithFilters` in `apps/api/src/modules/todos/repository.ts` — MikroORM's
`find` already takes `{ limit, offset }`. On the frontend swap the `useQuery` for
`useInfiniteQuery` and wrap the `todos.map` in `apps/web/app/page.tsx` with a
virtualization lib (`react-window` / `@tanstack/react-virtual`).

---

### Manual drag-and-drop ordering (Trello-style)
**Priority:** P3  **Estimate:** ~1 MD

Todos are ordered by due date / creation. A `position` column was considered and
dropped as out of scope; manual reordering would bring it back, done properly.

**Acceptance criteria**
- [ ] `position` stored as a fractional index (LexoRank / `fractional-indexing`) so reordering never renumbers the whole list
- [ ] reorder endpoint (move between two neighbours)
- [ ] drag-and-drop on the frontend (`dnd-kit`)

**Where to start:** add `position` to `entities/Todo.ts` + a migration, order by it
in `repository.ts`, add a reorder handler in the todos module; on the frontend wrap
the list in `page.tsx` with `dnd-kit`.

---

## Developer experience

### Frontend tests
**Priority:** P2  **Estimate:** ~1 MD

Only the API is tested (Vitest + Supertest). `apps/web` has no tests at all.

**Acceptance criteria**
- [ ] component tests (React Testing Library) for the auth form and the todo list/item
- [ ] runs in CI

**Where to start:** add Vitest + React Testing Library to `apps/web`, mirroring the
API test setup in `apps/api`. (A Playwright e2e flow is a separate concern — its own
card.)

---

### ESLint + Prettier + CI
**Priority:** P2  **Estimate:** ~0.5 MD

There is no linter/formatter, and tests run manually.

**Acceptance criteria**
- [ ] ESLint + Prettier configured for both apps
- [ ] CI runs typecheck + lint + tests + build on every PR

**Where to start:** add configs at the repo root; a GitHub Actions workflow runs
`pnpm install`, `tsc --noEmit`, `pnpm -r test`, and the builds.

---

## Product backlog (out of scope for production-readiness)

Ideas to grow the product — **not** required to reach a production-ready state, and
each needs product/UX input before it becomes a real card (acceptance criteria,
data model, design). Listed here as direction, to discuss with product:

- user settings (profile, change password, delete account)
- custom categories / tags instead of the fixed list
- list sharing / collaboration between users
- due-date reminders / notifications
- archive instead of delete
