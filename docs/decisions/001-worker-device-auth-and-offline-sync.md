# ADR-001: Worker device authentication and offline task writes

## Status

Accepted

## Date

2026-04-22

## Context

Agrova’s worker PWA (M3 in [`specs/farm-operations-app.plan.md`](../../specs/farm-operations-app.plan.md)) must satisfy:

- **No SMS/WhatsApp in MVP** — setup is via an owner-copied link only (`/setup/:token`).
- **Field workers** often have no memorable password; we still need a **durable Supabase Auth session** on the device.
- **Offline-first mutations** — start/finish/reassign tasks must not fail when the network drops; the spec calls for Dexie, an **outbox**, and sync on reconnect.
- **RLS** already keys off `people.auth_user_id` and `public.current_person_id()`; workers must link to a `people` row like owners do.

Constraints from the existing stack: single React app, Supabase Auth + Postgres, private Storage for photos.

## Decision

### 1. Claim flow: Edge Function + synthetic device email

- Expose **`claim-setup-token`** (Supabase Edge Function) with **`verify_jwt: false`**: the secret is the **one-time setup token** in the JSON body, not a Bearer JWT. CORS allows browser `POST` from the web app.
- The function (service role): validates `people.setup_token`, rejects owner/inactive/already-claimed/expired, **`auth.admin.createUser`** with email `w{uuid-without-dashes}@device.agrova.app` and a random password, links **`people.auth_user_id`**, clears token fields, then signs in via the **anon** client and returns **`access_token` / `refresh_token`** for the SPA to call `supabase.auth.setSession`.
- **Rationale:** Supabase Auth expects an email-shaped identifier; the synthetic domain keeps workers distinct from owner real-email accounts and makes `isWorkerUser()` a simple suffix check (`@device.agrova.app`).

### 2. Client routing and guard

- **`/m/*`** requires a session; unauthenticated users are redirected to **`/login?worker=true`** (worker-specific copy: no password form).
- Owner sign-in continues to use email/password at `/login` with **`worker: false`** in search params when redirecting from `_owner` routes.

### 3. Offline writes: Dexie outbox + serial drain

- All worker task mutations that must survive offline go through **`enqueueOutbox`** then **`drainOutbox`** (`src/lib/sync.ts`).
- **Kinds:** `task_status`, `task_completion` (optional photo blob in `blobs` store, upload to `issue-photos` then `tasks.completion_photo_url` as **storage object path** — private bucket; owner UI signs URLs at read time), `task_reassign` (existing `reassign_task` RPC).
- **Conflict rule (M3):** before applying a queued patch, read current `tasks.status`; if it no longer matches the intended `fromStatus`, **drop** the outbox row (last-write-wins / no crash). Network errors use bounded backoff in the drain loop.

### 4. Read cache

- **`bootstrapReadCachesForWorker`** populates Dexie (`fields`, `people`, `activities`, `tasks_today`) after load for faster UI and future offline read paths; list/detail queries still use TanStack Query + network when online.

## Alternatives considered

### Magic link / OTP only (no synthetic email)

- Would require email/SMS delivery; **rejected for MVP** per “no product SMS” and copy-link-only setup.

### Anonymous Supabase Auth for workers

- Would complicate linking to `people` and RLS assumptions; **rejected** in favor of a real `auth.users` row per device.

### Direct `supabase.from('tasks').update` from the client without outbox when online

- Simpler but diverges from the spec’s **all writes through outbox** requirement and makes offline behavior a second code path; **rejected** for M3 worker flows.

## Consequences

- Edge Function must have **`SUPABASE_URL`**, **`SUPABASE_SERVICE_ROLE_KEY`**, and **`SUPABASE_ANON_KEY`** available at runtime (platform default for URL/service; confirm **anon** is present for post-`createUser` sign-in).
- Workers **cannot** sign in with password on `/login`; session loss means **new setup link** from the owner (documented in profile).
- **`src/lib/sync.ts` and `src/lib/db.ts`** should carry high test coverage per spec §11; M3-ω may add more tests before calling the milestone fully green.
- Playwright E2E for worker flows expects a **running dev server**; `PLAYWRIGHT_BASE_URL` overrides default `http://localhost:5173` when Vite chooses another port.

## References

- [`specs/farm-operations-app.plan.md`](../../specs/farm-operations-app.plan.md) — M3 tasks M3-02..M3-15, checkpoint M3-ω
- [`specs/farm-operations-app.md`](../../specs/farm-operations-app.md) — product spec
- `supabase/functions/claim-setup-token/index.ts`, `src/lib/sync.ts`, `src/lib/db.ts`
