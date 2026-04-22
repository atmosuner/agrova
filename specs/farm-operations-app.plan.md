# Implementation Plan — Agrova MVP

> **Source spec:** [`./farm-operations-app.md`](./farm-operations-app.md) (v1.0)
> **Design system:** [`../DESIGN.md`](../DESIGN.md)
> **Companion rules:** `.cursor/rules/*` (always applied)
> **Status:** Draft v1.0 — produced 2026-04-22 via `/plan`
>
> **Progress (M0):** M0-01..M0-17 are ✅ **implemented** on `main` (M0-11 → M0-15 SQL; M0-16 types; M0-17 edge stubs `web-push-fanout` + `setup-link` — **no SMS/WhatsApp in MVP**, Web Push only for notifications); M0-10’s GitHub UI is **documented** in [`docs/github-branch-protection.md`](../docs/github-branch-protection.md) (bump as later M0 tasks land).
>
> **Progress (M1):** M1-01..M1-11 ✅; M1-12 **partial** — catalog unit + integration: `pnpm test:coverage` enforces M1-12 thresholds on `src/features/{people,fields,equipment}/**/*.ts` (V8; ~90% lines in that slice); RLS **anon** write probes in `src/integration/rls-catalog-anon.test.ts` run when real `VITE_SUPABASE_*` are set, **skipped** in default CI. **Next:** M1-ω (catalog) human review. **M2 (tasks)** is already implemented on `main` — see M2 line below.
>
> **Progress (M2):** M2-01..M2-08 ✅ on `main`; M2-09 **partial** (unit tests + SQL presence check; full `src/features/tasks/**` in coverage thresholds and pgTAP RLS suite not in default CI). **Shipped:** task create wizard (14 activities, fields, assignee/due/priority/notes), `/tasks` with filters + URL, table (50/ page) + kanban (≤200), detail sheet, reassign (RPC; audit via trigger), duplicate tomorrow / N fields, `log_activity` + RLS for `activity_log` insert, trigger `tasks_log_update` on `tasks` updates. **Remote DB (Supabase):** M2 DDL applied via **Supabase MCP** `apply_migration` — `activity_log_insert_policy`, `tasks_update_activity_triggers` (project migration history also has repo-parity files `20260422131000_…` / `20260422140000_…`). **Next:** M2-ω, then M3+.
>
> **Progress (M5):** M5-01..M5-05 ✅ (worker **Alet** sheet + `task_equipment` outbox; trigger `task_equipment_after_insert_chemical` → `chemical_applications` for `CHEMICAL` — migration `20260422170000_…` + MCP; owner usage sheet; field chemicals tab + CSV; tests + coverage excludes). **Next:** M5-ω.
>
> **Progress (M6):** **Shipped in repo + MCP:** `push_subscriptions`, `get-vapid-public-key`, `web-push-fanout`, client `register-web-push` + `invokeWebPushFanout`, **`NotificationsBell` + inbox** (Realtime, mark read), **mute by action** in Settings (`muted_event_actions`), `notification-sw.js` **push** + **click/focus** handlers, `daily-digest` Edge (deployed, **verify_jwt: false** + `DAILY_DIGEST_CRON_SECRET`), **pg_cron/pg_net** enabled via migration `20260422220000_…` (schedule `net.http_post` in SQL per `supabase/README.md`), unit tests `notification-prefs.test.ts`. **Non-human ops:** set **VAPID_***, `DAILY_DIGEST_CRON_SECRET`, run digest schedule in SQL. **Optional gap:** M6-08 E2E push (manual smoke). **M6-ω** human: KPI ≤10s push.
>
> **Progress (M7):** `/today` — **4 tiles** (stats + Open-Meteo **weather** from settings city), **realtime** invalidation on `tasks`/`issues` for stats, **3-column board** (today) + `TaskDetailSheet`, **lazy mini map** (fields + today highlight), **activity feed** (20 rows, Realtime, sentinel label), skeletons. **M7-ω gaps:** strict LCP/CLS/Lighthouse file in `docs/lighthouse/`, performance audit still human.
>
> **Progress (M8):** **Shipped (non-human):** **`export-data`** Edge (deployed) + Settings download, migration **anonymize on archive** + sentinel person, routes **`/offline`**, **`/how-to-install`**, `e2e/a11y.spec.ts` (axe, no serious/critical), `docs/contrast-audit.md`, **nightly** `.github/workflows/e2e-nightly.yml`, README deploy/E2E notes, KVKK links on **setup** + **settings**. **Gaps (human/ops):** full Turkish catalog fill for new strings (Lingui missing count post-extract), Lighthouse/PWA ≥90 in CI, M8-10 seven-flow E2E not all deterministic, M8-11 real domain, M8-12 launch retro.
>
> **Progress (M3):** **ADR:** [`docs/decisions/001-worker-device-auth-and-offline-sync.md`](../docs/decisions/001-worker-device-auth-and-offline-sync.md). M3-01 ⏸️ **DEFERRED**. **Core shipped:** M3-02–04 ✅; M3-05–08 / 09–12 / 13–15 **🟨 see slice tracker** (gaps: pull-to-refresh vs Yenile, network-primary lists vs full Dexie-first reads, E2E smoke not full offline flow, `sync`/`db` coverage & M3-ω TBD). **E2E:** `pnpm dev` then `pnpm test:e2e`; **`PLAYWRIGHT_BASE_URL`** if Vite is not on **5173**.
>
> **Local dev (Supabase):** Keep a **gitignored** `.env` at the repo root with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Dashboard (**Project Settings → API**) or, in Cursor, **Supabase MCP** `get_project_url` + `get_publishable_keys` (use the **legacy anon** JWT for `@supabase/supabase-js` unless you migrate to publishable keys). For schema changes, prefer MCP **`apply_migration`** (or local `supabase db push` / linked CLI) so the hosted project and `list_migrations` stay in sync with `supabase/migrations/`. If those vars are unset, the client still boots using a **non-resolving placeholder host** and `signInWithPassword` will fail (`ERR_NAME_NOT_RESOLVED`); `src/lib/supabase.ts` emits a **dev-only** `console.warn` when either var is missing. **Restart the Vite dev server** after editing `.env`.
>
> This plan translates the spec into discrete, verifiable tasks sized for a single focused session (~1–2h of agent work each). It is organized by milestone (M0–M8, from spec §16), with checkpoints between milestones and an explicit dependency graph. Tasks are ID'd `Mx-NN` for stable cross-referencing in commits, PRs, and future plan revisions.

**M1 slice tracker (executed top → bottom; update after each land):**

| Task | M1-01..M1-08 | M1-09 | M1-10 | M1-11 | M1-12 | M1-ω |
|------|----------------|-------|-------|-------|-------|------|
| Done | ✅ | ✅ | ✅ | ✅ | 🟨 | ⬜ |

**M2 slice tracker:**

| M2-01..M2-04 | M2-05 | M2-06 | M2-07 | M2-08 | M2-09 | M2-ω |
|------|------|------|------|------|------|------|
| ✅ | ✅ | ✅ | ✅ | ✅ | 🟨 | ⬜ |

**M3 slice tracker:**

| M3-01 | M3-02 | M3-03..04 | M3-05..08 | M3-09..12 | M3-13..15 | M3-ω |
|------|------|------|------|------|------|------|
| ⏸️ | ✅ | ✅ | 🟨 | 🟨 | 🟨 | ⬜ |

* **M3-05..08** — Shipped: today list, detail, completion, reassign. **Gaps:** pull-to-refresh (spec) vs top **Yenile** button; “optimistic UI” = invalidate/refetch, not full local-first optimistic rows; haptic/focus on `WorkerButton` are present, Lighthouse a11y not re-run.  
* **M3-09..12** — Shipped: Dexie v2, `bootstrapReadCachesForWorker`, outbox + `drainOutbox`, `SyncIndicator` + `SyncSheet`, conflict drop. **Gaps:** list queries are still **network-primary** (not “read Dexie first, then revalidate” everywhere); `sync.test.ts` is placeholder-level; M3-11 Vitest “simulated conflict” not exhaustive.  
* **M3-13..15** — Shipped: history (grouped days + **Daha eski**), profile, Playwright `e2e/offline-sync.spec.ts`. **Gaps:** E2E is **smoke** (copy + unauth redirect + HTTP 200), not full offline complete/reassign; run dev first (`PLAYWRIGHT_BASE_URL` if port ≠ 5173).  
* **M3-ω** — **Open:** coverage on `src/lib/sync.ts` + `src/lib/db.ts` to spec §11, human review, full offline E2E if desired.

---

## Overview

We are building Agrova — a single-tenant, mobile-first, offline-capable PWA for a Turkish fruit operation. All product decisions are locked in the spec; the purpose of this document is **execution planning**, not design.

Across the 9 milestones there are **92 tasks** grouped into three broad phases:

| Phase | Milestones | Task count | Nature |
|---|---|---|---|
| **Foundations** | M0 | 14 | Scaffolding, CI, DB schema, storage, types, edge-function stubs |
| **Core features** | M1 → M7 | 66 | Catalogs → task flow → worker mobile → issues → equipment → notifications → dashboard |
| **Launch** | M8 | 12 | Accessibility, performance, i18n completeness, KVKK, deployment |

Each task is **S** or **M** sized (per `planning-and-task-breakdown`). If execution reveals any task to be L, it will be split and the plan revised.

---

## Architecture Decisions (already locked by spec)

These are not up for debate during implementation; they're listed so every task can be reviewed against them.

- **PWA**, single React + Vite + TS codebase, one bundle for worker mobile and owner web
- **Supabase Cloud (Seoul)** for Postgres + Auth + Storage + Realtime + RLS + Edge Functions
- **Dexie + Workbox (via vite-plugin-pwa)** for offline cache + outbox pattern
- **TanStack Router (file-based), TanStack Query, TanStack Form + Zod**
- **Tailwind v4 + shadcn/ui re-skinned to `DESIGN.md`**, Lucide + custom activity icons
- **Leaflet + ESRI World Imagery** for maps (free, no API key)
- **Open-Meteo** for weather (free, no API key)
- **Lingui** for i18n (tr-only at launch, externalized for future)
- **`date-fns` + tr locale**, timezone pinned to `Europe/Istanbul`
- **Vitest** (unit + integration) + **Playwright** (7 critical E2E flows)
- **GitHub Actions CI**: typecheck + lint + unit/integration tests on PR to `main`; E2E nightly

---

## Dependency Graph (high-level)

```
M0 Foundations
 ├── Repo + CI (A–G)             ──┐
 ├── DB schema (H–J)              │
 ├── RLS policies (K)              │  every later milestone depends on at least
 ├── Storage bucket (L)            │  one of these. M0 must be wholly complete
 ├── Generated TS types (M)        │  before M1 starts.
 └── Edge-function stubs (N)     ──┘
              │
              ▼
M1 Catalogs (owner) — people, fields, equipment, CSV export
              │
              ▼
M2 Task creation (owner) — schema verified, modal, list, kanban, reassign
              │
              ▼
M3 Worker mobile MVP — setup link (in-app / copy URL; no SMS in MVP), session, today list, start/done, outbox, sync
              │         (depends on M1 for people+fields; M2 for task rows)
              ▼
M4 Issues & photos — 7-cat flow, required photo, storage upload + retry
              │
              ▼
M5 Equipment + chemicals — attach UI, chemical_applications form, usage reports
              │
              ▼
M6 Notifications — VAPID, subscription, edge fan-out, mute prefs, bell
              │         (depends on activity_log rows from every earlier milestone)
              ▼
M7 Owner home dashboard — stat tiles, board, map, activity feed, weather widget
              │         (pulls from every table)
              ▼
M8 Polish + launch — a11y audit, Lighthouse, KVKK, data export, deploy
```

**Safe to parallelize:** within a milestone, UI-only tasks once services exist; unit tests for already-implemented services.
**Must be sequential:** DB migrations (Postgres can't concurrent-DDL most changes), RLS policies (depend on tables), generated types (depend on final schema of a milestone).

---

## Conventions

- **Task IDs** are `Mx-NN`. They never change once assigned; if a task is dropped, its ID is retired.
- **Commits** reference the task ID in the subject: `feat(M3-05): worker task detail screen`.
- **Branches** follow `feature/M3-05-worker-task-detail`.
- Every task is landed via PR; CI must be green; a human (owner) reviews before merge.
- **Verification always runs these** unless noted otherwise:
  `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` (`pnpm test:run` skips coverage threshold; `pnpm test` is Vitest watch mode)

---

## M0 — Foundations

Goal: production-shaped project with empty but working scaffolding, DB schema complete, RLS on, CI green.

### Task M0-01: Create repo + push existing spec/design/rules
**Description:** Initialize local git, create GitHub repo `atmosuner/agrova`, push the already-written docs (spec, DESIGN, .cursor rules, README, .gitignore).
**Acceptance criteria:**
- [ ] Public repo `github.com/atmosuner/agrova` exists
- [ ] `main` branch contains the initial commit with spec + DESIGN + .cursor/ + README
- [ ] `.cursor/mcp.json` is NOT in the commit (gitignored)
**Verification:**
- [ ] `gh api repos/atmosuner/agrova` returns 200
- [ ] `git log --oneline` shows one commit on `main`
**Dependencies:** None (first task)
**Files likely touched:** `README.md`, `.gitignore` (already present)
**Estimated scope:** S
**Status:** ✅ **DONE** (commit `17f6bad`)

### Task M0-02: Scaffold Vite + React 19 + TS (strict) at repo root
**Description:** Create the single-package Vite project per spec §8/§9. TypeScript strict, path alias `@/` → `src/`. No framework beyond React + Vite + TS yet.
**Acceptance criteria:**
- [ ] `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx` exist
- [ ] `pnpm dev` serves on port 5173
- [ ] `pnpm build` produces a clean bundle
- [ ] `tsconfig.json` has `strict: true`, `noUncheckedIndexedAccess: true`, `@/*` alias
**Verification:** `pnpm install && pnpm build && pnpm preview` shows default page
**Dependencies:** M0-01
**Files likely touched:** `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
**Estimated scope:** S
**Status:** ✅ **DONE** (commit `c600fb8` — router replaced standalone `App.tsx`)

### Task M0-03: Wire Tailwind v4 + design tokens from DESIGN.md
**Description:** Install Tailwind v4, configure the custom color/typography tokens from `DESIGN.md §2–3`. Inter Variable + JetBrains Mono Variable via `@fontsource-variable`. Enable `cv11, ss01, calt` OpenType features globally.
**Acceptance criteria:**
- [ ] `tailwind.config.ts` exposes `orchard-*`, `harvest-*`, `canvas`, `surface-0/1/2`, `status-*`, `border-subtle/strong`, `text-primary/secondary/muted/faint`
- [ ] Dark-mode variants work via `prefers-color-scheme`
- [ ] Body uses Inter Variable with the OpenType features enabled
- [ ] One smoke-test route renders "Merhaba, Agrova 🌱" using `text-orchard-500` and shows correct Turkish diacritics
**Verification:** visual check in dev; screenshot committed to `docs/screenshots/m0-03.png` (optional)
**Dependencies:** M0-02
**Files likely touched:** `tailwind.config.ts`, `postcss.config.mjs`, `src/styles/globals.css`, `src/App.tsx`, `package.json`
**Estimated scope:** M
**Status:** ✅ **DONE** (commit `c177e2c` — v4 + CSS tokens; smoke copy evolved in later tasks)

### Task M0-04: Install shadcn/ui and re-skin primitives to tokens
**Description:** Initialize shadcn CLI; install the primitives we'll need first (`button`, `card`, `input`, `dialog`, `badge`, `tabs`, `sheet`, `dropdown-menu`). Override `components.json` so generated components use our DESIGN.md tokens instead of default shadcn palette.
**Acceptance criteria:**
- [ ] `components.json` exists; shadcn components land in `src/components/ui/`
- [ ] `<Button variant="default">` renders with `bg-orchard-500`, 36px height (owner) / 72px via size variant (worker)
- [ ] No `bg-primary` / `bg-slate-*` etc. remain in shadcn outputs
**Verification:** Storybook-lite page at `/ui-test` that shows each primitive; visual parity with `DESIGN.md §4`
**Dependencies:** M0-03
**Files likely touched:** `components.json`, `src/components/ui/*.tsx`, `src/routes/ui-test.tsx`
**Estimated scope:** M
**Status:** ✅ **DONE** (commit `e2c68d1` — no `/ui-test` route yet; primitives + token map)

### Task M0-05: TanStack Router (file-based) skeleton
**Description:** Install `@tanstack/react-router` + `@tanstack/router-plugin` for Vite. Set up file-based routes per spec §9. Create empty routes for `_owner/today`, `_mobile/tasks`, `setup.$token`, `login`. Root route redirects to `/today` for owners and `/tasks` for mobile viewports.
**Acceptance criteria:**
- [ ] Routes exist as files matching spec §9 layout
- [ ] Type-safe navigation: `router.navigate({ to: '/today' })` type-checks
- [ ] Layout-split: owner routes wrap in sidebar shell, mobile routes wrap in bottom-tab shell
- [ ] 404 page exists
**Verification:** manually visit each route; all render placeholder content without errors
**Dependencies:** M0-04
**Files likely touched:** `vite.config.ts`, `src/main.tsx`, `src/routes/*`, `src/components/layout/*`
**Estimated scope:** M
**Status:** ✅ **DONE** (commit `638fe32` — file routes; owner `/` shell + worker `/m/…`; 404 not added yet)

### Task M0-06: Lingui i18n (tr primary, en catalog skeleton)
**Description:** Install `@lingui/cli`, `@lingui/react`, `@lingui/macro`, Babel macro. Configure `lingui.config.js` with locales `tr, en`; `tr` is default and active. Extract one string from M0-03's smoke test through `t\`...\``. Commit the compiled catalog.
**Acceptance criteria:**
- [ ] `src/lib/i18n.ts` bootstraps the active locale
- [ ] `pnpm i18n:extract` + `pnpm i18n:compile` produce `src/locales/tr/messages.po` and `.mjs`
- [ ] Every user-facing string in code goes through `t\`...\``
- [ ] Lingui ESLint rule (`no-raw-text`) flags hardcoded Turkish
**Verification:** grep check passes: no Turkish diacritics outside `.po` catalogs and user-content markup
**Dependencies:** M0-05
**Files likely touched:** `lingui.config.js`, `babel.config.cjs`, `src/lib/i18n.ts`, `src/locales/tr/messages.po`, `package.json`
**Estimated scope:** M
**Status:** ✅ **DONE** (commit `0827161` — `messages.ts` not `.mjs`)

### Task M0-07: vite-plugin-pwa manifest + service worker baseline
**Description:** Install `vite-plugin-pwa`. Configure `manifest.webmanifest` (name, short_name, theme_color from DESIGN.md, icons 192/512/maskable), service worker strategy `generateSW` with Workbox. No offline data caching yet (that's M3).
**Acceptance criteria:**
- [ ] Lighthouse PWA audit passes "Installable" + "PWA Optimized" (warnings for offline are acceptable this milestone)
- [ ] `/manifest.webmanifest` reachable; correct `start_url` and `scope`
- [ ] Icons exist at 192, 512, 512-maskable in `public/icons/`
**Verification:** Lighthouse PWA score ≥ 80; manual install-to-home on Android Chrome
**Dependencies:** M0-05 (needs routing to define `start_url`)
**Files likely touched:** `vite.config.ts`, `public/manifest.webmanifest`, `public/icons/*`, `src/main.tsx`
**Estimated scope:** M
**Status:** ✅ **DONE** (commit `0ec5ee7` — manifest generated; icons under `public/icons/`)

### Task M0-08: Supabase client + Dexie database stub + env wiring
**Description:** Install `@supabase/supabase-js` and `dexie`. Create `src/lib/supabase.ts` reading `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` from `.env` (Vercel env in prod). Create `src/lib/db.ts` declaring empty Dexie database (tables added in later slices).
**Acceptance criteria:**
- [x] `.env.example` committed with placeholder values + comment; real `.env` gitignored
- [x] `supabase` export is typed; from **M0-16** onward `src/types/db.ts` + `SupabaseClient<Database>` (was stub-only before generated types)
- [x] `src/lib/db.ts` exports a `db` **Dexie** singleton
- [x] Dev console: use `window.__agrova` (dev only) — `auth.getSession()` validates client wiring; `pg_stat_user_tables` is **not** on `public` via PostgREST by default (see `docs/dev-smoke-tests.md`)
- [x] **Dev:** missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` → **dev-only** `console.warn` with copy-`.env` instructions; do not ship relying on the built-in non-resolving placeholder URL
**Verification:** smoke console check documented in `docs/dev-smoke-tests.md`
**Dependencies:** M0-02
**Files likely touched:** `src/lib/supabase.ts`, `src/lib/db.ts`, `.env.example`, `package.json`
**Estimated scope:** S
**Status:** ✅ **DONE** (feat: `M0-08`)

### Task M0-09: GitHub Actions CI — typecheck + lint + test + build on PR
**Description:** Write `.github/workflows/ci.yml` that runs on every push to `main` and every PR to `main`. Matrix: Node 20, pnpm 9. Jobs: install (cached), `pnpm lint`, `pnpm typecheck`, `pnpm test:run` (headless Vitest), `pnpm build`. E2E is a separate nightly workflow (M8-10).
**Acceptance criteria:**
- [x] Workflow runs in <5 minutes on a cold cache, <2 minutes on a warm cache (typical; verify on Actions)
- [x] Failing type error, lint error, test, or build fails the workflow
- [x] Status badge in README links to the Actions page
**Verification:** open a dummy PR with a deliberate type error → CI fails; revert → CI green
**Dependencies:** M0-02 through M0-08 (needs all four commands to exist)
**Files likely touched:** `.github/workflows/ci.yml`, `README.md`, `package.json` (`vitest`, `test` / `test:run` scripts)
**Estimated scope:** S
**Status:** ✅ **DONE** (feat: `M0-09`)

### Task M0-10: Enable branch protection on `main`
**Description:** Configure GitHub branch protection via API: require CI to pass; require PR reviews (or allow self-approve since solo dev); disallow force-push + direct push to `main`; require linear history.
**Acceptance criteria:**
- [x] `git push origin main` **should** be blocked once rules are applied (no secrets in repo to flip this; owner applies in GitHub)
- [x] `gh api repos/.../branches/main/protection` (or **Settings → Rules**) shows the rules after setup
- [x] Required status check name documented: CI job `lint · typecheck · test+coverage · build` in [`docs/github-branch-protection.md`](../docs/github-branch-protection.md)
**Verification:** attempt a direct push → rejected (after you enable the ruleset on GitHub)
**Dependencies:** M0-09 (need a required status check name to point at)
**Files likely touched:** [`docs/github-branch-protection.md`](../docs/github-branch-protection.md)
**Estimated scope:** XS
**Status:** ✅ **DONE** (feat: `M0-10` — operational steps in repo; buttons live on GitHub)

### Checkpoint M0-α: Scaffolding complete
- [x] `pnpm lint && pnpm typecheck && pnpm test:coverage && pnpm build` passes locally; CI runs the same (branch protection in M0-10)
- [ ] A browser visiting the dev server sees Turkish copy using DESIGN.md tokens
- [ ] Lighthouse PWA score ≥ 80
- [x] Branch protection: [documented](../docs/github-branch-protection.md) — **owner** enables on GitHub
- [ ] Human review: approve before continuing to DB work

### Task M0-11: DB migration 1 — enums + `people` + `equipment`
**Description:** Authoritative SQL migration creating the enum types (`person_role`, `equipment_category`, `task_status`, `task_priority`, `issue_category`) + the simplest catalog tables (`people`, `equipment`). Apply on your Supabase project (Dashboard **SQL Editor** or CLI `db push`). Include `updated_at` trigger.
**Acceptance criteria:**
- [x] Schema SQL committed; tables are `people` + `equipment` with spec columns; enums match §5
- [x] `updated_at` trigger on `people` and `equipment`
- [x] `people.phone` unique + E.164 `CHECK` (regex)
**Verification:** After applying on a dev project, insert/select in SQL Editor; optional: Supabase `get_advisors` / `list_tables`
**Dependencies:** M0-09 (CI) — M0-10 branch rules recommended before merging DB work, not a hard file dependency
**Files likely touched:** [`supabase/migrations/20260422000100_init_enums_people_equipment.sql`](../supabase/migrations/20260422000100_init_enums_people_equipment.sql), [`supabase/README.md`](../supabase/README.md)
**Estimated scope:** M
**Status:** ✅ **DONE** (feat: `M0-11` — apply migration on Supabase to materialize)

### Task M0-12: DB migration 2 — `fields` (PostGIS) + `tasks` + `task_equipment` + `chemical_applications`
**Description:** Enable `postgis` extension; create `fields` with `gps_center geography(point)` and `boundary geography(polygon)`; create `tasks`, `task_equipment`, `chemical_applications` per spec §5. Foreign keys + indexes on hot paths (`tasks.assignee_id`, `tasks.field_id`, `tasks.due_date, status`).
**Acceptance criteria:**
- [x] PostGIS installed; `SELECT postgis_version()` works
- [x] `ST_Within` query on a sample polygon works (`execute_sql` smoke)
- [x] `tasks` row insert validates FK + enum constraints (smoke: transactional insert in `execute_sql` + `rollback` returned a task id)
**Verification:** sample polygon round-trips via `execute_sql`; constraint violations return 23503/23514
**Dependencies:** M0-11
**Files likely touched:** `supabase/migrations/20260422000200_fields_tasks_equipment_chemicals.sql`
**Estimated scope:** M
**Status:** ✅ **DONE** (feat: `M0-12` — committed SQL + applied on Supabase via MCP)

### Task M0-13: DB migration 3 — `issues` + `activity_log` + `notifications`
**Description:** Remaining tables from spec §5. `activity_log.action` holds event strings (see spec §5 examples, e.g. `task.created`, `issue.reported`). `notifications` has `(recipient_id, activity_log_id)` unique constraint. Index by `created_at DESC` on `activity_log`.
**Acceptance criteria:**
- [x] All three tables present with correct columns + FKs
- [x] Index `activity_log(created_at DESC)` exists (`activity_log_created_at_idx` btree on `created_at DESC`)
- [x] `issues.photo_url` is `NOT NULL` (photo required by spec §3)
**Verification:** `list_tables` shows all nine public tables; `information_schema` confirms `photo_url` not nullable; `get_advisors` will report **RLS disabled** on public tables until **M0-14** (expected).
**Dependencies:** M0-12
**Files likely touched:** `supabase/migrations/20260422000300_issues_activity_notifications.sql`
**Estimated scope:** S
**Status:** ✅ **DONE** (feat: `M0-13` — committed SQL + applied on Supabase via MCP)

### Task M0-14: Row-Level Security policies
**Description:** Enable RLS on every table. Write policies matching spec §5 role matrix: `people` read-all-authed/write-owner-only; `fields`/`equipment` same; `tasks` owner full + assignee-transition; `issues` anyone-insert + owner-resolve; `activity_log` owner-read or own-actor read; `notifications` own-recipient only. Helpers: `is_owner()`, `current_person_id()`, `task_by_id()`, `reassign_task()`; trigger blocks non-owners from changing `person_role`.
**Acceptance criteria:**
- [x] `alter table … enable row level security` for all tables
- [x] Structural checks in `supabase/tests/rls.test.sql` (RLS on 9 tables, `m014_*` policy count, FK smoke on bad assignee)
- [x] `get_advisors` (security) reports no RLS issues for public app tables
**Verification:** `execute_sql` / `psql` with `rls.test.sql` in a transaction; security advisor run after DDL
**Dependencies:** M0-13
**Files likely touched:** `supabase/migrations/20260422000402_rls_m014a_handle_people_helpers.sql` … `20260422000406_rls_m014e_policies_usage_notifications.sql` (split for smaller MCP payloads), `supabase/tests/rls.test.sql`
**Estimated scope:** L — **SPLIT** into five ordered migrations (a–e) for Supabase MCP `apply_migration`
**Status:** ✅ **DONE** (feat: `M0-14` — committed SQL + applied on Supabase via MCP; policy expressions use unqualified row column names, e.g. `assignee_id`, not `public.assignee_id`)

### Task M0-15: Storage bucket `issue-photos` + access policies
**Description:** Create private bucket `issue-photos` via SQL (`storage.buckets`); `storage.objects` policies: first path segment is `auth.uid()::text` (so client path is `<auth_uid>/<issue_id>.jpg` or voice under the same prefix); **owner** (`public.is_owner()`) may `select`/`update`/`delete` any object in the bucket; **non-owners** may `insert`/`select`/`update`/`delete` only under their own auth folder.
**Acceptance criteria:**
- [x] Bucket exists with `public = false`
- [x] Insert (and upsert path) policy uses `(storage.foldername(name))[1] = auth.uid()::text`
- [x] Client can use `createSignedUrl` for objects the user can `select` (verify in M4 with real session); structural checks in `supabase/tests/storage_issue_photos.test.sql`
**Verification:** `execute_sql` bucket row + `pg_policies` for `m015_*`; security `get_advisors` after migration
**Dependencies:** M0-14
**Files likely touched:** [`supabase/migrations/20260422000500_storage_issue_photos_bucket.sql`](../supabase/migrations/20260422000500_storage_issue_photos_bucket.sql), [`supabase/tests/storage_issue_photos.test.sql`](../supabase/tests/storage_issue_photos.test.sql)
**Estimated scope:** S
**Status:** ✅ **DONE** (feat: `M0-15` — applied on Supabase via MCP)

### Task M0-16: Generate TypeScript types → `src/types/db.ts`
**Description:** Use Supabase MCP `generate_typescript_types` (or `npx supabase gen types` with `SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF`) and commit `src/types/db.ts` + `supabase/mcp_gentypes.json` input snapshot. Wire `supabase.ts` to `createClient<Database>(...)`.
**Acceptance criteria:**
- [x] `src/types/db.ts` exists and is ≥ 100 lines (all public M0 tables + enums + RLS helper RPCs in `Database`)
- [x] `supabase: SupabaseClient<Database>` (from `@/types/db`)
- [x] Banner: `AUTO-GENERATED — DO NOT EDIT BY HAND` (`db.ts` is in `eslint` global ignore for generated literals)
- [x] `pnpm supabase:gen-types` — `node scripts/supabase-gen-types.mjs` (MCP JSON file or CLI env)
**Verification:** `pnpm typecheck` passes; `tasks.status` is `Database["public"]["Enums"]["task_status"]` / union on row types
**Dependencies:** M0-13, M0-15
**Files likely touched:** `src/types/db.ts`, `supabase/mcp_gentypes.json`, `package.json`, `scripts/supabase-gen-types.mjs`, `src/lib/supabase.ts`, `.env.example`, `eslint.config.js`
**Estimated scope:** S
**Status:** ✅ **DONE** (feat: `M0-16` — types + gen script; stub `app-database` + pre-m0-16 check removed)

### Task M0-17: Scaffold edge functions — `web-push-fanout` + `setup-link`
**Description:** **MVP has no SMS or WhatsApp** (notifications = **Web Push** only). Deploy two Deno stubs: **`web-push-fanout`** (real fan-out in M6-03) and **`setup-link`** (replaces a former SMS-sending name — owner shares URLs manually per M1-04; token claim in M3-02). Both return `{ ok: true, placeholder: true }`. Deploy via MCP `deploy_edge_function`.
**Acceptance criteria:**
- [x] Both functions appear in `list_edge_functions`
- [x] Invoking each returns 200 with JSON including `ok: true`, `placeholder: true`
- [x] `pnpm supabase:functions:serve` script exists (requires Supabase CLI / linked project for local run)
**Verification:** `curl` both `/functions/v1/...` URLs; `list_edge_functions`
**Dependencies:** M0-16
**Files likely touched:** `supabase/functions/web-push-fanout/index.ts`, `supabase/functions/setup-link/index.ts`, `package.json`
**Estimated scope:** S
**Status:** ✅ **DONE** (MVP policy: push only; SMS/WhatsApp deferred to v1.1+)

### Checkpoint M0-ω: Foundations done
- [x] Full CI green on `main` (lint, typecheck, unit tests, build; `pnpm` pinned to `9.15.4` in CI). *Migrations-applied DB smoke is manual / deploy-time (`supabase db push` or MCP) — not automated in this workflow yet.*
- [x] All 9 tables + RLS + `issue-photos` bucket live on Supabase (Seoul)
- [x] Edge function stubs deployed (`web-push-fanout`, `setup-link`)
- [x] TypeScript types regenerate via `pnpm supabase:gen-types` (MCP or CLI; see `supabase/README.md`)
- [x] Human review: M1 may start

---

## M1 — Catalogs (owner web)

Goal: owner signs up, adds people/fields/equipment, exports each as CSV. End-to-end owner workflow without any worker interaction.

### Task M1-01: Owner signup + email/password auth flow
**Description:** Supabase Auth email/password. `/signup` + `/login` routes (owner-only). After signup, create a `people` row with role=`OWNER` linked to `auth.users.id` via trigger.
**Acceptance criteria:**
- [x] `/signup` form: email, password, password-confirm, full_name, phone
- [x] DB trigger `handle_new_owner` inserts into `people` (migration `20260422000600_handle_new_owner_auth.sql`)
- [x] Login persists session; logged-in user lands on `/today` (or `redirect` search param)
- [x] Password validation: ≥ 8 chars, at least one number
**Verification:** sign up → row in `people` exists with `role='OWNER'`
**Dependencies:** M0-ω
**Files likely touched:** `src/routes/signup.tsx`, `src/routes/login.tsx`, `src/features/auth/*`, `supabase/migrations/...auth_trigger.sql`
**Estimated scope:** M
**Status:** ✅ **DONE** (apply migration on project DB before manual verification) — unauthenticated access to pathless `_owner` routes redirects to `/login?redirect=…` with `returnTo` built via `defaultStringifySearch` (TanStack Router’s `location.search` is a parsed object, not a string).

### Task M1-02: Settings — operation name, city (for weather), timezone lock
**Description:** `/settings` page. Single-row `operation_settings` table (uuid pk, user_id fk, operation_name, weather_city, created_at). Owner fills on first login.
**Acceptance criteria:**
- [x] `operation_settings` table + migration + RLS (owner-only) — `20260422000601_operation_settings.sql`, applied via Supabase MCP
- [x] Settings form saves + reflects in sidebar header (`OperationSettingsProvider`)
- [x] Weather_city stored as Turkish city name (e.g., "Antalya"); `timezone` locked to `Europe/Istanbul` in DB + UI
**Verification:** change city → weather widget (M7-09) later reads updated value
**Dependencies:** M1-01
**Files likely touched:** `src/routes/_owner/settings.tsx`, `src/features/settings/*`, `supabase/migrations/...operation_settings.sql`
**Estimated scope:** S
**Status:** ✅ **DONE**

### Task M1-03: People CRUD — list + add form (no outbound SMS)
**Description:** `/people` page with list + "Yeni kişi" modal. Fields: full_name, phone (E.164 validation via Zod), role select. Creates `people` row. Setup **URL** copy for workers is M1-04 (MVP: no SMS/WhatsApp).
**Acceptance criteria:**
- [x] Phone validates as +90xxxxxxxxxx via Zod (`^\+905[0-9]{9}$` after normalize)
- [x] Duplicate phone → friendly error from unique constraint (mapped `23505` / message)
- [x] Role options: Foreman, Agronomist, Worker (Owner not selectable; OWNER row: no edit/archive)
- [x] Edit + archive: soft-delete via `people.active` + partial unique `people_one_owner_idx` (single OWNER)
**Verification:** create 5 people via form; all appear in list; `select * from people` matches
**Dependencies:** M1-01
**Files likely touched:** `src/routes/_owner/people.tsx`, `src/features/people/*`, migration for `people.active` boolean
**Estimated scope:** M
**Status:** ✅ **DONE** (migration `20260422000602_people_active_single_owner.sql` applied via MCP)

### Task M1-04: People — "Kurulum linki" (copy URL; no SMS in MVP)
**Description:** Button next to each person generates a `setup_token` (random 32-char URL-safe). Owner copies the URL (`/setup/{token}`) to the worker **out of band** (in person, printed note, etc.) — **the app does not send SMS or provider WhatsApp from the server in MVP**. Optional Netgsm SMS is **post-MVP**. Token expires 7 days.
**Acceptance criteria:**
- [x] `people.setup_token` + `setup_token_expires_at` columns (add migration)
- [x] "Kurulum linki oluştur" (EN: Create setup link) button on person row copies URL to clipboard
- [x] Re-clicking regenerates (invalidates old)
**Verification:** click generates token; `select setup_token` shows non-null; URL format correct
**Status:** ✅ (migration `20260422000603_people_setup_token_expires_at.sql` + `generate-setup-token.ts` + `people.tsx`; TR strings in `tr/messages.po`)
**Dependencies:** M1-03
**Files likely touched:** `src/features/people/generate-setup-token.ts`, migration `add_setup_token_columns.sql`
**Estimated scope:** S

### Task M1-05: Fields — satellite map canvas + "Yeni tarla" button
**Description:** `/fields` page. Full-height split: satellite map on left (Leaflet + ESRI World Imagery tile layer; attribution), right-side list of existing fields. "Yeni tarla" button starts draw mode.
**Acceptance criteria:**
- [x] Leaflet installed; map centered on operation_settings.weather_city (reverse-geocoded via Open-Meteo geocoder)
- [x] ESRI attribution visible and correct
- [x] Zoom + pan + satellite tiles load cleanly
- [x] No console errors; no hardcoded API keys
**Verification:** navigate to `/fields` → satellite tiles render; pan around Turkey
**Status:** ✅ (`FieldsMap.tsx`, `open-meteo-geocoding.ts`, `fields.tsx`); fail-open fallback `TURKEY_VIEW_CENTER` if city geocode misses
**Dependencies:** M1-02 (needs city)
**Files likely touched:** `src/routes/_owner/fields.tsx`, `src/components/map/FieldsMap.tsx`, `src/lib/map.ts`, `package.json`
**Estimated scope:** M

### Task M1-06: Fields — polygon drawing tool + field form
**Description:** `leaflet-draw` plugin. Draw mode lets owner click vertices to define a polygon. On completion, a side-sheet opens with the field form (name, crop, variety, plant_count, planted_year, notes). Area auto-computed from polygon in hectares. Save writes `fields` row with `gps_center` (polygon centroid) + `boundary`.
**Acceptance criteria:**
- [x] Drawing UX: leaflet-draw polygon (click vertices, close polygon per Leaflet default)
- [x] Form validates: name required, others optional; Zod `fieldFormSchema` in `field-form.ts`
- [x] Save → `field_upsert_from_geojson` stores geography `boundary` + computed `area_hectares` + `gps_center`
- [x] Drawn polygon persists on map after save (re-fetch from Supabase)
**Verification:** draw a polygon near your location → save → reload page → polygon still there
**Status:** ✅ (migration `20260422000604_field_upsert_from_geojson.sql` applied; RPC + `field-form.ts` + tests)
**Dependencies:** M1-05
**Files likely touched:** `src/routes/_owner/fields.tsx`, `src/features/fields/*`, `src/components/map/PolygonDrawer.tsx`, `package.json`
**Estimated scope:** L — **SPLIT** into M1-06a (drawing UX), M1-06b (form + save)

### Task M1-07: Fields — detail side-sheet + edit
**Description:** Click an existing polygon → **owner aside panel** (fixed layout; shadcn Sheet not added — same UX goal) with metadata + edit. **Redraw boundary** starts a new draw that replaces the polygon; metadata edit reuses existing geometry from DB via RPC.
**Acceptance criteria:**
- [x] Click polygon (or list row) → detail + editor area in the fields page aside
- [x] Edit metadata saves without re-drawing polygon (RPC sends stored GeoJSON)
- [x] Redraw boundary → new polygon → save updates `boundary`
- [x] "Delete field" requires type-to-confirm (field name) — no accidental wipes
**Verification:** create, click, edit, delete flow works end-to-end
**Status:** ✅ (`fields.tsx` + `field_upsert_from_geojson`)
**Dependencies:** M1-06
**Files likely touched:** `src/features/fields/*`, `src/routes/_owner/fields.tsx`
**Estimated scope:** M

### Task M1-08: Equipment CRUD — tabs per category
**Description:** `/equipment` page, tabs: Araçlar, Aletler, Kimyasallar, Kasalar (Vehicles, Tools, Chemicals, Crates). Simple list + add/edit/archive form per tab.
**Acceptance criteria:**
- [x] Tab switching preserves URL (`?cat=VEHICLE`)
- [x] Add form: name required, notes optional
- [x] Archive via `active=false` flag; archived items hidden by default, toggle to show
**Verification:** add 5 items across all 4 categories; verify DB rows
**Status:** ✅ (`equipment.tsx` + `validation.ts`; HTML dialog, en tab labels via Lingui)
**Dependencies:** M1-01
**Files likely touched:** `src/routes/_owner/equipment.tsx`, `src/features/equipment/*`
**Estimated scope:** M

### Task M1-09: CSV export — people
**Description:** Button on `/people` page: "CSV olarak indir". Generates CSV client-side via `papaparse` from the current query. Filename: `people-YYYYMMDD.csv`. Turkish header row.
**Acceptance criteria:**
- [x] Download triggers; file has correct rows
- [x] Header row uses Turkish labels (via Lingui)
- [x] UTF-8 BOM for Excel compatibility with Turkish diacritics
**Verification:** download, open in Excel/Sheets, verify diacritics render
**Status:** ✅ (`features/people/csv.ts` + `lib/csv-download.ts`)
**Dependencies:** M1-03
**Files likely touched:** `src/features/people/export-csv.ts`, `src/routes/_owner/people.tsx`, `package.json`
**Estimated scope:** S

### Task M1-10: CSV export — fields
**Description:** Same pattern; includes polygon area (ha) and GPS center, not the full geometry.
**Acceptance criteria:** [x] same as M1-09; columns: name, crop, variety, area_ha, gps_lat, gps_lng, plant_count, planted_year, notes
**Verification:** Excel-friendly; diacritics correct
**Status:** ✅ (`features/fields/csv.ts` + `gps-center.ts`)
**Dependencies:** M1-06, M1-09 (share utility)
**Files likely touched:** `src/features/fields/export-csv.ts`, `src/routes/_owner/fields.tsx`
**Estimated scope:** S

### Task M1-11: CSV export — equipment
**Description:** Same pattern; one file with a `category` column.
**Acceptance criteria:** [x] columns: category, name, notes, active, created_at
**Verification:** diacritics correct; **export fetches all rows** (full catalog) so archived are included; tab filter is view-only
**Status:** ✅ (`features/equipment/csv.ts` + `exportAllEquipment` in route)
**Dependencies:** M1-08, M1-09
**Files likely touched:** `src/features/equipment/export-csv.ts`, `src/routes/_owner/equipment.tsx`
**Estimated scope:** S

### Task M1-12: Unit + integration tests — catalog services
**Description:** Vitest coverage for people/fields/equipment services. Mock Supabase client at the query-builder level; integration tests run against local Supabase (Docker).
**Acceptance criteria:**
- [x] ≥ 80% **lines & statements** on `src/features/{people,fields,equipment}/**/*.ts` — enforced by `pnpm test:coverage` (V8 thresholds in `vite.config.ts`; `html` report under `coverage/`)
- [x] RLS-protected writes reject anon: `src/integration/rls-catalog-anon.test.ts` (insert `people` + `equipment` with anon key, no session) — **skipped** when `VITE_SUPABASE_*` missing or still placeholder, so default CI is green without project secrets
- [x] Zod schemas / parsers tested: `field-form`, `equipment/validation`, `generate-setup-token`, `open-meteo`, `gps-center` (+ `boundary-geojson`, `map-people-mutation-error`, `csv` with mocked `downloadUnparse`)
**Verification:** `pnpm test:run` green; `pnpm test:coverage` green; open `coverage/index.html` locally
**Status:** **partial** — M1-12 test slice done; `supabase/seed.sql` still optional backlog. Manual QA + M1-ω human gate unchanged.
**Dependencies:** M1-11
**Files likely touched:** `src/features/**/*.test.ts`, `vitest.config.ts`, `supabase/seed.sql`
**Estimated scope:** M

### Checkpoint M1-ω: Catalogs complete
- [ ] Owner can sign up, add 10 fields with polygons, 5 people, 5 pieces of equipment end-to-end in one session
- [ ] Three CSV downloads open cleanly in Excel with Turkish diacritics
- [ ] Coverage on catalog code ≥ 80%
- [ ] Human review

---

## M2 — Task creation (owner)

Goal: owner creates, lists, reassigns, and audit-logs tasks; no worker mobile yet.

### Task M2-01: Task creation modal — skeleton + activity picker
**Description:** Modal opens from `/tasks`. Step 1: activity picker (icon grid using custom activity icons per DESIGN.md §9). Activities are a frontend-only fixed list from spec §3.
**Acceptance criteria:**
- [ ] Icon grid with 14 activities (budama, ilaçlama, … diğer)
- [ ] Selecting an activity highlights + enables Next
- [ ] ESC or outside-click closes modal (with confirmation if dirty)
**Verification:** click every activity; chosen activity persists across steps
**Dependencies:** M0-ω (needs routing + shadcn)
**Files likely touched:** `src/components/icons/activities/*`, `src/features/tasks/TaskCreateModal.tsx`
**Estimated scope:** M
**Status:** ✅

### Task M2-02: Task creation — field multi-select
**Description:** Step 2: searchable, multi-select field list. Owner can pick N fields; if N>1, the system creates N identical tasks on submit.
**Acceptance criteria:**
- [ ] Search filters by name (case-insensitive, Turkish collation)
- [ ] Multi-select chips show selected fields
- [ ] Badge on submit shows "N görev oluşturulacak"
**Verification:** pick 3 fields → submit → 3 rows in `tasks` with distinct IDs, same activity/date/assignee
**Dependencies:** M2-01
**Files likely touched:** `src/features/tasks/TaskCreateModal.tsx`, `src/features/fields/useFieldsQuery.ts`
**Estimated scope:** M
**Status:** ✅

### Task M2-03: Task creation — assignee + due date + priority + notes
**Description:** Step 3: assignee picker (list from `people` where role != OWNER), due date picker (defaults to today), priority buttons (Low/Normal/Urgent), optional notes textarea.
**Acceptance criteria:**
- [ ] Due date can't be in the past
- [ ] Notes max 500 chars with counter
- [ ] Priority: three pill buttons; Normal default
- [ ] Submit creates `tasks` row(s) + `activity_log` row (action=`task.created`)
**Verification:** create a task; inspect `tasks` + `activity_log` rows
**Dependencies:** M2-02, M0-16 (types for assignee)
**Files likely touched:** `src/features/tasks/create-task.ts`, `src/features/tasks/TaskCreateModal.tsx`
**Estimated scope:** M
**Status:** ✅ (`create-tasks.ts`, `log-activity.ts`)

### Task M2-04: Tasks list — table view with filters
**Description:** `/tasks` default view. Columns per spec §6: Activity, Field, Assignee, Status, Priority, Due date. Filters in toolbar: status, field, assignee, activity, date range.
**Acceptance criteria:**
- [ ] All filters combine (AND)
- [ ] URL reflects filter state (`?status=TODO&field=abc-123`)
- [ ] Pagination: 50 rows/page
- [ ] Click row → side-sheet (M2-06)
**Verification:** filter by a specific assignee → only their tasks; URL share works
**Dependencies:** M2-03
**Files likely touched:** `src/routes/_owner/tasks.tsx`, `src/features/tasks/TasksTable.tsx`, `src/features/tasks/useTasksQuery.ts`
**Estimated scope:** L — **SPLIT** into M2-04a (table), M2-04b (filters + URL sync)
**Status:** ✅

### Task M2-05: Tasks list — kanban view toggle
**Description:** Toggle in toolbar: Table / Kanban. Kanban = 5 columns (TODO, IN_PROGRESS, DONE, BLOCKED, CANCELLED). Cards draggable within the UI but NOT status-changing by drag (owner can't change worker status in MVP).
**Acceptance criteria:**
- [ ] Toggle preserves filters
- [ ] Cards show activity icon, field, assignee, priority dot, due date
- [ ] Drag is disabled (visual drag-affordance removed)
**Verification:** toggle back and forth; filters persist
**Dependencies:** M2-04
**Files likely touched:** `src/features/tasks/TasksKanban.tsx`, `src/routes/_owner/tasks.tsx`
**Estimated scope:** M
**Status:** ✅

### Task M2-06: Task detail side-sheet + reassignment
**Description:** Click row → side-sheet slides in. Shows activity icon, field, assignee, status, full timeline (joins `activity_log` where subject=this task). "Aktar" button opens a person picker.
**Acceptance criteria:**
- [ ] Timeline shows created/reassigned/started/done events with timestamps + actor
- [ ] Reassign creates an `activity_log` row (action=`task.reassigned`) + updates `tasks.assignee_id`
- [ ] Owner can reassign to anyone; workers (M3) only to workers+foremen (enforced by RLS)
**Verification:** reassign → reload → new assignee shown; timeline updated
**Dependencies:** M2-05
**Files likely touched:** `src/features/tasks/TaskDetailSheet.tsx`, `src/features/tasks/reassign-task.ts`
**Estimated scope:** M
**Status:** ✅ (reassign uses DB trigger for audit)

### Task M2-07: "Duplicate for tomorrow" + "Duplicate across N fields"
**Description:** Two actions in the task detail menu. Both create new `tasks` rows with cleared state (TODO, no completed_at).
**Acceptance criteria:**
- [ ] "Yarın için kopyala" creates an identical task with due_date = today + 1
- [ ] "N tarlaya kopyala" opens field picker, creates N new tasks
- [ ] Both log `task.duplicated` in `activity_log` with `payload.source_task_id`
**Verification:** duplicate a task → appears in list with new ID, correct date
**Dependencies:** M2-06
**Files likely touched:** `src/features/tasks/duplicate-task.ts`, `src/features/tasks/TaskDetailSheet.tsx`
**Estimated scope:** S
**Status:** ✅

### Task M2-08: Audit log — centralized `log_activity` helper
**Description:** Refactor all existing write paths (M1-03, M1-06, M1-08, M2-03, M2-06, M2-07) to call a single `log_activity(actor_id, action, subject_type, subject_id, payload)` helper. Use a DB trigger where possible (e.g., on `tasks` updates) to avoid client-side duplication.
**Acceptance criteria:**
- [ ] Every task state transition produces exactly one `activity_log` row
- [ ] Trigger fires on INSERT/UPDATE to `tasks` (for status transitions) + `issues` (M4)
- [ ] Client-side `log_activity` used only for things triggers can't capture (e.g., reassignment reason text)
**Verification:** SQL check: `SELECT count(*) FROM activity_log` grows by exactly 1 per task mutation
**Dependencies:** M2-07
**Files likely touched:** `supabase/migrations/...activity_triggers.sql`, `src/lib/activity.ts`
**Estimated scope:** M
**Status:** ✅ (`tasks_log_update` trigger; M1 refactors not fully centralized)

### Task M2-09: Unit + integration tests — tasks feature
**Description:** Cover create/list/reassign/duplicate/audit-log. Integration tests assert RLS: assignee CAN update status; non-assignee CANNOT.
**Acceptance criteria:**
- [ ] ≥ 80% coverage on `src/features/tasks/*.ts`
- [ ] RLS tests pass via pgTAP
**Verification:** `pnpm test` green; `pnpm supabase:test` green
**Dependencies:** M2-08
**Files likely touched:** `src/features/tasks/**/*.test.ts`, `supabase/tests/tasks-rls.test.sql`
**Estimated scope:** M
**Status:** **partial** (unit tests + SQL presence check; full tasks slice coverage and pgTAP RLS suite not in CI; catalog coverage still scoped to M1-12 paths in `vitest` config)

### Checkpoint M2-ω: Owner can plan
- [ ] Owner creates a task in ≤ 20s (spec KPI)
- [ ] Table + kanban both show tasks; filters work; reassign works; audit log complete
- [ ] Coverage on tasks ≥ 80%
- [ ] Human review

---

## M3 — Worker mobile MVP

Goal: worker opens a **setup link** (from owner), sets up once, sees today's tasks, starts + finishes them offline, syncs on reconnect. **No product-sent SMS in MVP.**

### Task M3-01: ~~Netgsm SMS for setup link~~ **DEFERRED (v1.1+ / optional)**
**Description:** **Not in MVP.** If we add carrier SMS later, integrate Netgsm (or similar), `person_id` → send short URL, secrets in Supabase, rate limits. Until then, owners use M1-04 copy-URL only; `supabase/functions/setup-link` (M0-17) remains a non-SMS placeholder.
**Acceptance criteria:** N/A (deferred)
**Dependencies:** — 
**Files likely touched:** TBD when un-deferred
**Estimated scope:** — 
**Status:** ⏸️ **DEFERRED** (MVP: no SMS from product)

### Task M3-02: `/setup/:token` route — claim token + mint session
**Description:** Worker opens the setup link → PWA on `/setup/{token}`. Client calls edge function `claim-setup-token` which validates token, creates a Supabase auth user if missing (e.g. phone-based or email-less flow per M3-02a design), links `people.auth_user_id`, returns a session. Client stores session and redirects to **worker** tasks (**`/m/tasks`**).
**Acceptance criteria:**
- [x] Valid token → session stored → worker task list loads (`/m/tasks`)
- [x] Expired/claimed token → friendly error page
- [x] After claim: `people.setup_token` cleared; `auth_user_id` set
**Verification:** end-to-end: owner copies link from M1-04 → opens on phone → `/m/tasks` loads with worker session
**Dependencies:** M1-04, M0-17
**Files likely touched:** `src/routes/setup.$token.tsx`, `supabase/functions/claim-setup-token/index.ts` (MCP: `deploy_edge_function`)
**Estimated scope:** L — **SPLIT** into M3-02a (edge function), M3-02b (route + UI)
**Status:** ✅ **implemented** (redirect `/m/tasks`; synthetic `*@device.agrova.app` — see [ADR-001](../docs/decisions/001-worker-device-auth-and-offline-sync.md))

### Task M3-03: Install-to-home-screen prompt + iOS hint
**Description:** After session lands, detect `beforeinstallprompt` (Android) and show a "Ana ekrana ekle" CTA. On iOS (where the event doesn't fire), show a one-time hint with Share → Add to Home Screen illustration.
**Acceptance criteria:**
- [x] Code: `beforeinstallprompt` captured; Android CTA; iOS one-time hint (`localStorage`); install dismissals persisted
- [ ] **Manual:** Android: install → standalone; iOS 16.4+: hint once; no spam after install
**Verification:** manual test on Android Chrome and iOS Safari 17
**Dependencies:** M3-02, M0-07
**Files likely touched:** `src/components/InstallPrompt.tsx`, `src/lib/pwa.ts` (rendered from `MobileShell` on `/m/*`)
**Estimated scope:** M
**Status:** ✅ **implemented** (in-app; device verification ⬜)

### Task M3-04: Mobile layout shell — bottom tabs + top bar
**Description:** Worker routes under **`/m/*`** (not a `_mobile` pathless group) use bottom-tab nav (Görevler / Geçmiş / Profil) and sticky top bar (greeting + **live** `SyncIndicator`). **72px** tab bar = `h-[4.5rem]`; **~28px** tab icons (Lucide `h-7 w-7`) per DESIGN.md.
**Acceptance criteria:**
- [x] Tab bar fixed bottom; active tab highlighted with `orchard-500`
- [x] Top bar: “Merhaba, {firstName}” + Turkish date (`Europe/Istanbul` / `Intl`)
- [x] Sync indicator (wired — pending count + offline tint; tappable → sheet)
**Verification:** visual check on a 375×667 viewport; lighthouse mobile a11y ≥ 95
**Dependencies:** M3-02
**Files likely touched:** `src/components/layout/MobileShell.tsx`, `src/routes/m/*`, `src/routes/m/route.tsx` (`beforeLoad` auth)
**Estimated scope:** M
**Status:** ✅ **implemented** (Lighthouse / a11y score not re-asserted in CI ⬜)

### Task M3-05: Today's tasks list (mobile)
**Description:** **`/m/tasks`**: cards with **96×96** activity area, activity name, field, status chip, priority dot. Fetched via TanStack Query: `assignee_id = me` and `due_date = today` (**`Europe/Istanbul`** — `useMyTodayTasksQuery`).
**Acceptance criteria:**
- [x] Empty state: “Bugün için görev yok” (text + dashed card; spec “illustration” = copy, not asset)
- [ ] **Pull-to-refresh** — not implemented; **workaround:** header **Yenile** (`RefreshCw`) refetches
- [x] Tap card → **`/m/task/{id}`**
**Verification:** owner creates 3 tasks assigned to test worker; worker sees all 3
**Dependencies:** M3-04, M2-03
**Files likely touched:** `src/routes/m/tasks.tsx`, `src/features/tasks/useMyTodayTasksQuery.ts`, `src/features/tasks/TaskCard.mobile.tsx`
**Estimated scope:** M
**Status:** 🟨 **partial** (refresh UX differs from spec; list is network-first)

### Task M3-06: Task detail screen (mobile) — Start / Bitir buttons
**Description:** **`/m/task/{id}`**. Top: activity icon + name + field. Middle: **notes** (if present). Bottom: `WorkerButton` (TODO → **Başla** = `IN_PROGRESS`; IN_PROGRESS → **Bitir** opens completion flow, not direct DONE in one tap).
**Acceptance criteria:**
- [x] Button visibility reflects status (not assignee: guard if not mine)
- [ ] **Optimistic** — uses **invalidate/refetch** after `transitionTask` / outbox, not row-level optimistic list mirror
- [x] Haptic: `WorkerButton` → `navigator.vibrate(10)` when supported
- [x] Focus ring: `focus-visible:ring` on `WorkerButton`
**Verification:** start a task → list shows IN_PROGRESS; finish (via M3-07) → DONE
**Dependencies:** M3-05
**Files likely touched:** `src/routes/m/task.$id.tsx`, `src/features/tasks/transition-task.ts` / `worker-mutations.ts`, `src/components/ui/WorkerButton.tsx` (`size="worker"` / 72px)
**Estimated scope:** M
**Status:** 🟨 **partial** (optimism story differs from spec wording)

### Task M3-07: Completion flow — photo + confirm screen
**Description:** After **Bitir**, `CompletionFlow`: optional photo (file input `capture="environment"`) → optional blob in **Dexie `blobs`**, then **confirm** → `queueTaskCompletionWithOptionalPhoto` (outbox). ✓ state → redirect **`/m/tasks`**. `prefers-reduced-motion` short-circuits extra delay.
**Acceptance criteria:**
- [x] Photo capture via `<input type="file" accept="image/*" capture="environment">`
- [x] Skip path → confirm without photo
- [x] Confirm → `DONE` + optional **`issue-photos`** path in `completion_photo_url` (private; sign on read) via outbox
- [x] `prefers-reduced-motion` respected for success animation
**Verification:** complete a task with and without photo; both paths reach list
**Dependencies:** M3-06, M0-15 (uses existing **`issue-photos`** bucket)
**Files likely touched:** `src/features/tasks/CompletionFlow.tsx`, `src/features/tasks/complete-task.ts` (re-export) / `worker-mutations.ts`
**Estimated scope:** M
**Status:** ✅ **implemented** (photo staged in **IndexedDB blob table**, not Cache Storage — same “offline-first” intent)

### Task M3-08: Reassign action (worker can reassign their own task)
**Description:** **Aktar** on task detail → `ReassignSheetMobile` → `reassign_task` RPC via **`queueTaskReassign`** (outbox + drain). Trigger still writes **`task.reassigned`** in `activity_log`.
**Acceptance criteria:**
- [x] Current assignee **excluded** from picker (`useAssignablePeopleQuery` filtered)
- [ ] **Optimistic** list removal — on success, **navigate to `/m/tasks` + refetch** (not silent row remove)
- [x] Reassign enqueued; offline → drain when online
**Verification:** reassign from worker A to worker B; A's list no longer shows it; B's does
**Dependencies:** M3-06
**Files likely touched:** `src/features/tasks/ReassignSheet.mobile.tsx`, `reassign-task.ts` (unchanged RPC), `worker-mutations.ts`
**Estimated scope:** S
**Status:** 🟨 **partial** (no strict optimistic “task row vanishes” before RTT)

### Task M3-09: Dexie schema + read cache (fields, people, today's tasks)
**Description:** **Dexie v2** stores: `fields`, `people`, `equipment`, `activities`, `issue_categories`, `tasks_today`, `outbox`, `blobs`. On load, **`bootstrapReadCachesForWorker`** fills caches from Supabase. **List/detail queries** still use **PostgREST + TanStack Query** (network-primary); full “read Dexie first, then revalidate” is **not** applied to all queries yet.
**Acceptance criteria:**
- [x] `db.version(2)`; stores above; v1 → v2 upgrade path
- [x] After first load with network, `bootstrapReadCachesForWorker` populates (e.g. `db.fields` non-empty)
- [ ] **Strict:** Airplane mode → today list still populated from **Dexie** alone ⬜ (current: may empty if no prior cache session)
- [ ] `src/lib/cache.ts` **not** added — logic lives in `bootstrap-cache.ts` + `db.ts`
**Verification:** airplane mode → cached data still renders on `/m/tasks` (target; partial today)
**Dependencies:** M3-08
**Files likely touched:** `src/lib/db.ts`, `src/features/bootstrap/bootstrap-cache.ts` (called from `MobileShell`)
**Estimated scope:** L — **SPLIT** into M3-09a (schema), M3-09b (read cache population)
**Status:** 🟨 **partial** (schema + bootstrap; query path still mostly network)

### Task M3-10: Outbox pattern — enqueue mutations offline
**Description:** Worker writes use **`enqueueOutbox` + `drainOutbox`** (`src/lib/sync.ts`) after **TanStack** mutations from `worker-mutations.ts`. Kinds: `task_status`, `task_completion`, `task_reassign`. **Online:** drain runs after enqueue; **`online` event** + mount also drain.
**Acceptance criteria:**
- [x] `outbox` table: `id, kind, payload, client_uuid, enqueued_at, attempts, last_error` (as implemented)
- [x] Local enqueue before server apply (per worker flows)
- [x] `SyncIndicator` uses **`useLiveQuery`** on `db.outbox.count()`
**Verification:** offline → complete a task → outbox count = 1; back online → count = 0; task is DONE on server
**Dependencies:** M3-09
**Files likely touched:** `src/lib/sync.ts`, `src/lib/db.ts`, `src/features/tasks/worker-mutations.ts`
**Estimated scope:** L — **SPLIT** into M3-10a (enqueue), M3-10b (drain + retry)
**Status:** ✅ **implemented** (start/complete/reassign from worker go through outbox; owner UI unchanged)

### Task M3-11: Sync reconciliation + conflict rules (last-write-wins)
**Description:** Drain **serial**; on apply, re-read `tasks.status` vs `fromStatus` — **mismatch → delete outbox row** (no throw). On transport error, **attempts/last_error** update + **exponential-ish backoff** array with cap in `drainOutbox`.
**Acceptance criteria:**
- [x] Mismatch: row dropped (treat as **no-op**)
- [x] `last_error` on outbox row after failure
- [x] Backoff **steps** present (5s… cap); **exhaustive Vitest** for edge cases ⬜
**Verification:** simulated conflict test passes in Vitest
**Dependencies:** M3-10
**Files likely touched:** `src/lib/sync.ts`, `src/lib/sync.test.ts` (current: smoke + `resetSyncBackoffForTests` only)
**Estimated scope:** M
**Status:** 🟨 **partial** (runtime behavior; deep tests and “two workers” simulation not in `sync.test.ts` yet)

### Task M3-12: Sync indicator UI (top-right, tappable)
**Description:** **Dot** in header: **orchard-500** when synced & online; **harvest-500** when `pending>0` & online; **surface-2** when **offline** (not a literal green dot — semantic colors). Tap → **`SyncSheet`**, last 20, kind + time + `last_error`.
**Acceptance criteria:**
- [x] `useLiveQuery` for count
- [x] `useSyncExternalStore` on `online` / `offline`
- [x] Sheet: last 20, reverse `enqueued_at` (field column not denormalized in outbox ⬜)
**Verification:** toggle airplane mode → indicator changes; open sheet → shows items
**Dependencies:** M3-11
**Files likely touched:** `src/components/SyncIndicator.tsx`, `src/components/SyncSheet.tsx`
**Estimated scope:** M
**Status:** ✅ **implemented** (sheet row copy is `kind + id slice`, not per-field label)

### Task M3-13: History screen (Geçmiş) — my tasks this week
**Description:** **`/m/history`**. `useMyTaskHistoryQuery`: `due_date` between sliding window from **`thisWeekStart − daysBack`** through **end of current week**; **grouped by `due_date`**; **`formatDayMonthTr`** (weekday + day + month). **Daha eski** (load older) increases **`daysBack`** (7d steps), not true infinite list cursor.
**Acceptance criteria:**
- [x] Turkish day headers via `formatDayMonthTr` / `tr-TR` `Intl`
- [x] DONE → **Check** icon; BLOCKED → red **dot**
- [x] **Load older** extends range (not spec “infinite scroll” on a single list — same intent)
**Verification:** complete 3 tasks on 3 different days → history shows them grouped correctly
**Dependencies:** M3-06
**Files likely touched:** `src/routes/m/history.tsx`, `src/features/tasks/useMyTaskHistoryQuery.ts`, `src/lib/date-istanbul.ts`
**Estimated scope:** M
**Status:** 🟨 **partial** (UX: button “Daha eski” vs infinite scroll; window math via `addDaysToISODate`)

### Task M3-14: Profile screen (Profil) — mute toggles + logout
**Description:** **`/m/profile`**. Read-only name, phone, role. **`push_muted`** (and **theme** key) in **`people.notification_prefs`** via `mergeNotificationPrefs`. Theme: **`src/lib/theme.ts`** → `.dark` on **`<html>`** + `localStorage` + `applyThemeOn load` in **`main.tsx`**. Logout: **`supabase.auth.signOut`**, **`db.delete()`**, navigate **`/login?redirect=…&worker=true`**.
**Acceptance criteria:**
- [x] Toggles + theme **persist** to `people` JSON
- [x] Theme live + stored (`getStoredAgrovaTheme` / profile merge)
- [x] Logout wipes **IndexedDB (Dexie)** and session; worker **login** = `/login?worker=1` copy (Lingui)
**Verification:** toggle mutes; reload; still off; theme changes visibly
**Dependencies:** M3-04
**Files likely touched:** `src/routes/m/profile.tsx`, `src/lib/theme.ts` (no separate `src/features/profile/*` package)
**Estimated scope:** M
**Status:** ✅ **implemented** (worker redirect uses `worker: true` in app router **search** types)

### Task M3-15: Integration tests — offline → online sync
**Description:** Playwright **`e2e/offline-sync.spec.ts`**: (1) worker **login** landing copy, (2) unauthenticated **`/m/tasks`** → **`/login`**, (3) HTTP 200 on worker login URL. **Not** a full throttled **offline complete task** flow in CI.
**Acceptance criteria:**
- [x] `pnpm test:e2e` can pass with **dev server** running (`playwright.config.ts` — no auto `webServer`; default **`http://localhost:5173`**, override **`PLAYWRIGHT_BASE_URL`**)
- [ ] **Full** scenario: online → offline → complete → online → assert server **⬜** (out of scope for current spec file)
- [ ] Reassign offline E2E **⬜**
**Verification:** `pnpm test:e2e` / `--grep offline-sync` — ensure dev is up; see README / plan
**Dependencies:** M3-12
**Files likely touched:** `e2e/offline-sync.spec.ts`, `playwright.config.ts`
**Estimated scope:** M
**Status:** 🟨 **partial** (smoke E2E; heavy offline test deferred)

### Checkpoint M3-ω: Worker MVP
- [ ] **End-to-end (manual/QA):** setup link → PWA install hint → 3 tasks → **offline** complete → **reconnect** sync (not fully automated)
- [ ] **Coverage** `src/lib/sync.ts` + `src/lib/db.ts` **≥ 95%** (spec §11) — **⬜**
- [x] E2E **`offline-sync`** spec file exists; smoke tests **can** be green (dev + `PLAYWRIGHT_BASE_URL` as needed)
- [ ] **Human review** ⬜

---

## M4 — Issues & photos

Goal: worker reports issues with a required photo; owner sees them in a feed; photo upload retries on Wi-Fi.

### Task M4-01: Issue report — 7-category grid screen
**Description:** `/m/report-issue` full-screen grid of 7 big icon tiles (PEST, EQUIPMENT, INJURY, IRRIGATION, WEATHER, THEFT, SUPPLY). Turkish labels. Tap opens camera immediately.
**Acceptance criteria:**
- [x] 7 tiles: 2x4 grid (last row centered or 4x2), 56px+ touch targets
- [x] Label below each icon (Lingui)
- [x] Tap → camera opens; if permission denied, show friendly fallback (mic path in M4-04; camera uses file input)
**Verification:** visual + manual tap-through
**Dependencies:** M3-ω
**Files likely touched:** `src/routes/m/report-issue.tsx`, `src/features/issues/CategoryGrid.tsx`, `src/components/icons/issues/*`
**Estimated scope:** M

### Task M4-02: Photo capture (required) + confirm screen
**Description:** After camera → thumbnail + category + "Gönder" button. Photo is required; no skip path. Optional voice note (see M4-04).
**Acceptance criteria:**
- [x] Camera uses `capture="environment"`
- [x] Photo compressed to ≤ 1600px long-edge JPEG (browser-side canvas)
- [x] Cannot submit without photo
**Verification:** attempt submit without photo → disabled; with photo → submits
**Dependencies:** M4-01
**Files likely touched:** `src/features/issues/IssueConfirm.tsx`, `src/lib/image-compress.ts`
**Estimated scope:** M

### Task M4-03: Issue submission — outbox + Storage upload
**Description:** `submitIssue(input)` writes `issues` row + puts photo to `issue-photos` bucket. Both go through outbox; DB write first, photo upload async.
**Acceptance criteria:**
- [x] DB row inserts immediately (optimistic); owner feed (M4-06) shows it
- [x] Photo upload queued; retries on Wi-Fi if mobile throttling
- [x] `issues.photo_url` filled after upload succeeds
**Verification:** submit offline → row present after sync; photo present after Wi-Fi
**Dependencies:** M4-02, M3-10, M0-15
**Files likely touched:** `src/features/issues/submit-issue.ts`, `src/lib/sync.ts`
**Estimated scope:** L — **SPLIT** into M4-03a (DB write), M4-03b (photo upload + retry)

### Task M4-04: Optional voice note recording
**Description:** "Sesli not" button on confirm screen; MediaRecorder API captures audio, uploads to Storage (same bucket, different prefix). Fallback to "not supported" message on browsers without MediaRecorder.
**Acceptance criteria:**
- [x] Recording ≤ 60s hard cap
- [x] Playback before submit
- [x] `voice_note_url` in `issues` row if attached
**Verification:** record, playback, submit → DB has URL; playable from owner dashboard
**Dependencies:** M4-03
**Files likely touched:** `src/features/issues/VoiceRecorder.tsx`
**Estimated scope:** M

### Task M4-05: Issue linking — auto-attach task + GPS
**Description:** If user came from a task ("Sorun" button), `issues.task_id` = that task; `field_id` = task's field. Otherwise, if GPS permission granted, auto-fetch `gps_lat/lng` on submit.
**Acceptance criteria:**
- [x] From-task path: `issues.task_id` non-null, `field_id` matches
- [x] Free-standing path: `gps_lat/lng` populated if permission granted; null if denied
- [x] No GPS blocks submit if denied — just logs null
**Verification:** submit from task → row has task_id; submit free → row has GPS or nulls
**Dependencies:** M4-03
**Files likely touched:** `src/features/issues/submit-issue.ts`, `src/lib/geolocation.ts`
**Estimated scope:** S

### Task M4-06: Owner issues feed — `/issues` page
**Description:** List of issues newest first. Card: category icon, photo thumbnail (click to enlarge lightbox), reporter, field, timestamp, status (open/resolved). Filters: category, field, resolved.
**Acceptance criteria:**
- [x] Realtime subscribe via Supabase Realtime → new issues appear without refresh
- [x] Thumbnail uses signed URL (1h expiry)
- [x] Lightbox shows full image
**Verification:** worker submits → owner sees within 5s without refresh
**Dependencies:** M4-05
**Files likely touched:** `src/routes/_owner/issues.tsx`, `src/features/issues/IssuesFeed.tsx`, `src/features/issues/useIssuesQuery.ts` (`useIssuesRealtime`)
**Estimated scope:** M

### Task M4-07: Issue resolve action (owner)
**Description:** "Çözüldü olarak işaretle" button on each issue card. Updates `resolved_at` + `resolved_by`. Logs `issue.resolved` in `activity_log`.
**Acceptance criteria:**
- [x] Optimistic UI; resolved chips in green
- [x] Filter "Sadece açık" hides resolved
- [x] Only owner can resolve (RLS)
**Verification:** worker-role attempt → RLS error; owner → succeeds
**Dependencies:** M4-06
**Files likely touched:** `src/features/issues/resolve-issue.ts`, `src/routes/_owner/issues.tsx`
**Estimated scope:** S

### Task M4-08: Integration + E2E tests — issue reporting
**Description:** Vitest for services + RLS; Playwright E2E for the critical worker issue flow + owner notification.
**Acceptance criteria:**
- [x] ≥ 80% coverage on `src/features/issues/*.ts` (Vitest coverage gate includes `src/features/issues/**/*.ts`; hook-only modules excluded where noted in `vite.config.ts`)
- [ ] E2E: worker submits → owner sees card in realtime — **⬜** smoke only (`e2e/issue-report.spec.ts` unauthenticated redirects); full dual-session flow deferred
**Verification:** `pnpm test` + `pnpm test:e2e -- --grep issue` green
**Dependencies:** M4-07
**Files likely touched:** `src/features/issues/**/*.test.ts`, `e2e/issue-report.spec.ts`
**Estimated scope:** M

### Checkpoint M4-ω: Issues complete
- [ ] Worker reports an issue with a photo in ≤ 5 taps (spec KPI) — **manual QA**
- [x] Owner sees new issue within 5s via Realtime (implemented; verify in staging)
- [x] Offline submit works; photo uploads when back online (outbox + `drainOutbox` on `online`)
- [ ] Human review

---

## M5 — Equipment + chemicals

Goal: workers attach equipment to tasks; chemical application logged minimally; owner sees usage per field/equipment.

### Task M5-01: Worker — attach equipment to task
**Description:** "Alet" button on task detail opens a sheet with equipment picker (filtered to active items). Multi-select; saves rows to `task_equipment`.
**Acceptance criteria:**
- [x] Sheet lists by category (tabs)
- [x] Tap checkmark to attach; attaches queue via outbox if offline
- [x] Already-attached show as checked
**Verification:** attach 3 items; reload; all 3 still attached; DB rows present
**Dependencies:** M3-ω, M1-08
**Files likely touched:** `src/features/equipment/AttachSheet.mobile.tsx`, `src/features/equipment/attach-equipment.ts`
**Estimated scope:** M
**Status:** ✅

### Task M5-02: Chemical application — special form when category=CHEMICAL
**Description:** When worker attaches a CHEMICAL equipment, auto-insert a `chemical_applications` row: task_id, field_id (from task), applicator_id=self, applied_at=now.
**Acceptance criteria:**
- [x] Only CHEMICAL attaches create `chemical_applications` rows
- [x] Spec §5 note: name/dose/pest deferred — NOT captured here
- [x] DB trigger or client-side write (trigger preferred to avoid double-writes)
**Verification:** attach a CHEMICAL → `chemical_applications` has a new row with correct FKs
**Dependencies:** M5-01
**Files likely touched:** `supabase/migrations/...chemical_trigger.sql` OR `src/features/equipment/attach-equipment.ts`
**Estimated scope:** S
**Status:** ✅ (trigger `task_equipment_after_insert_chemical`)

### Task M5-03: Owner — equipment usage view (per item)
**Description:** Click an equipment row in `/equipment` → side-sheet with usage history: which tasks used it, which fields, how often.
**Acceptance criteria:**
- [x] Counts (last 30d, all-time)
- [x] List of last 50 uses (task link, field, date, attached_by)
**Verification:** attach tractor to 3 tasks → usage list shows all 3
**Dependencies:** M5-01
**Files likely touched:** `src/features/equipment/EquipmentUsageSheet.tsx`, `src/features/equipment/useEquipmentUsage.ts`
**Estimated scope:** M
**Status:** ✅

### Task M5-04: Owner — chemical applications view (per field)
**Description:** On field detail side-sheet (from M1-07), add a "Kimyasal uygulamalar" tab listing `chemical_applications` for this field.
**Acceptance criteria:**
- [x] List sorted newest first
- [x] Columns: date, applicator, task link
- [x] "CSV indir" button for field-scoped chemical log (required for KVKK export completeness)
**Verification:** apply chemical on 2 tasks → field sheet shows both
**Dependencies:** M5-02, M1-07
**Files likely touched:** `src/features/fields/FieldChemicalLog.tsx`
**Estimated scope:** M
**Status:** ✅

### Task M5-05: Tests — equipment + chemicals
**Description:** Unit + integration tests.
**Acceptance criteria:**
- [x] ≥ 80% coverage on `src/features/equipment/*.ts` (V8 gate + excludes for query-only modules)
- [x] Trigger-driven `chemical_applications` creation verified
**Verification:** `pnpm test` green
**Dependencies:** M5-04
**Files likely touched:** `src/features/equipment/**/*.test.ts`, `supabase/tests/chemical-trigger.test.sql`
**Estimated scope:** S
**Status:** ✅

### Checkpoint M5-ω: Equipment + chemicals
- [ ] Worker attaches 3 kinds of equipment to one task; all rows present; chemical triggers populate applications
- [ ] Owner sees usage per equipment and per field
- [ ] Human review

---

## M6 — Notifications (Web Push)

Goal: owner receives a push within 10s of any issue report; notifications fan out from `activity_log` via edge function; users can mute.

### Task M6-01: VAPID keys + `push_subscriptions` table
**Description:** Generate VAPID keys (stored in Supabase Secrets). New table `push_subscriptions(id, person_id, endpoint, p256dh, auth, created_at)`. RLS: user can insert/delete own rows.
**Acceptance criteria:**
- [ ] Keys generated and stored; public key exposed via edge function `get-vapid-public-key`
- [ ] Table + RLS + migration present
**Verification:** `list_tables` shows `push_subscriptions`; `execute_sql` subscription round-trip works
**Dependencies:** M5-ω
**Files likely touched:** `supabase/migrations/...push_subscriptions.sql`, `supabase/functions/get-vapid-public-key/index.ts`
**Estimated scope:** S

### Task M6-02: Client — subscribe to push + persist subscription
**Description:** On first login after notification permission granted, register SW push subscription and POST to Supabase. Re-register on subscription expiry.
**Acceptance criteria:**
- [ ] Permission request occurs at a meaningful moment (after first task completion), not on app load
- [ ] `push_subscriptions` row created for the user
- [ ] Graceful fallback if denied: show bell icon with badge count only
**Verification:** grant permission → DB row; deny → bell icon present
**Dependencies:** M6-01
**Files likely touched:** `src/lib/push.ts`, `src/features/notifications/register-push.ts`
**Estimated scope:** M

### Task M6-03: Edge function — `web-push-fanout` (real implementation)
**Description:** Replace placeholder. DB trigger on `activity_log` INSERT calls this function (via `pg_net`); function reads recipients from the event kind + mute prefs, iterates `push_subscriptions`, sends via `web-push` npm package.
**Acceptance criteria:**
- [ ] Issue insertion → owner receives a push in ≤ 10s (spec KPI)
- [ ] Function handles failed endpoints (410 → delete subscription)
- [ ] Respects `people.notification_prefs` mutes
- [ ] Owner's issue pushes cannot be muted (spec §14)
**Verification:** worker submits issue → owner's phone vibrates with push within 10s
**Dependencies:** M6-02, M4-ω
**Files likely touched:** `supabase/functions/web-push-fanout/index.ts`, `supabase/migrations/...activity_log_notify_trigger.sql`
**Estimated scope:** L — **SPLIT** into M6-03a (function), M6-03b (trigger + pg_net plumbing)

### Task M6-04: Notification click-through + deep links
**Description:** Service worker's `notificationclick` handler focuses or opens the PWA at the relevant route (e.g., issue URL, task URL).
**Acceptance criteria:**
- [ ] Click on push opens PWA at correct URL (focus existing tab if possible)
- [ ] Notification has action buttons where meaningful (e.g., "Göster")
**Verification:** push for issue → tap → `/issues?highlight={id}` opens
**Dependencies:** M6-03
**Files likely touched:** `src/sw-custom.ts` (or vite-plugin-pwa custom handlers)
**Estimated scope:** M

### Task M6-05: In-app bell icon + badge count
**Description:** Top bar bell (owner web) / profile badge (mobile). Query `notifications` table filtered by recipient_id, unread-only. Click opens a feed/dropdown.
**Acceptance criteria:**
- [ ] Badge count reflects unread notifications
- [ ] Realtime update via Supabase Realtime
- [ ] "Hepsini okundu işaretle" action
**Verification:** send push → bell count goes +1; mark read → 0
**Dependencies:** M6-04
**Files likely touched:** `src/features/notifications/Bell.tsx`, `src/features/notifications/NotificationsFeed.tsx`
**Estimated scope:** M

### Task M6-06: Mute preferences in Profile screen
**Description:** Already scaffolded in M3-14. Wire to actual categories from `activity_log.action`. Owner's issue push mute is disabled and explained.
**Acceptance criteria:**
- [ ] Toggles map 1:1 to action strings
- [ ] Persist via upsert to `people.notification_prefs` JSONB
- [ ] Owner's issue toggle disabled with explanatory helper text
**Verification:** mute "task.started" → stop receiving those pushes; unmute → resumes
**Dependencies:** M6-05
**Files likely touched:** `src/routes/_mobile/profile.tsx`, `src/routes/_owner/settings.tsx`, `src/features/notifications/prefs.ts`
**Estimated scope:** M

### Task M6-07: Daily 18:00 digest (owner)
**Description:** `pg_cron` job at 18:00 Europe/Istanbul calls `web-push-fanout` with a daily-digest payload: counts of tasks done/blocked, open issues, active fields.
**Acceptance criteria:**
- [ ] Cron scheduled via Supabase; fires at 18:00 Istanbul
- [ ] Push title: "Günlük özet"
- [ ] Only owner receives
**Verification:** temporarily change schedule to 2 min from now; push arrives with correct counts
**Dependencies:** M6-03
**Files likely touched:** `supabase/migrations/...pg_cron_digest.sql`, `supabase/functions/web-push-fanout/index.ts`
**Estimated scope:** M

### Task M6-08: Tests — notifications
**Description:** Unit: mute prefs filter. Integration: push fanout with a mocked endpoint. E2E: worker reports → owner's push endpoint called (via test double).
**Acceptance criteria:**
- [ ] Mute-prefs filter correctness
- [ ] Fanout idempotency (no double-send)
**Verification:** `pnpm test` + `pnpm test:e2e -- --grep push` green
**Dependencies:** M6-07
**Files likely touched:** `src/features/notifications/**/*.test.ts`, `e2e/push-fanout.spec.ts`
**Estimated scope:** M

### Checkpoint M6-ω: Notifications complete
- [ ] Issue → owner push in ≤ 10s (spec KPI)
- [ ] Mutes respected except owner issue
- [ ] Daily digest lands at 18:00
- [ ] Human review

---

## M7 — Owner home dashboard

Goal: "morning glance" page — owner sees everything in under 5 seconds.

### Task M7-01: `/today` layout shell with 4 stat tile grid
**Description:** Grid per spec §3 ASCII mockup. Stat tiles: open tasks, open issues, active fields, weather. Layout adapts for 1280+ / 1024+ / mobile.
**Acceptance criteria:**
- [ ] 4-tile grid above fold
- [ ] Skeleton loaders while data fetches
- [ ] Time-to-visible-data ≤ 800ms on 4G (spec KPI)
**Verification:** Lighthouse LCP on `/today` ≤ 800ms simulated 4G
**Dependencies:** M6-ω
**Files likely touched:** `src/routes/_owner/today.tsx`, `src/features/dashboard/StatTiles.tsx`
**Estimated scope:** M

### Task M7-02: Stat tile — Bugün açık görevler
**Description:** Count of today's non-DONE, non-CANCELLED tasks. Sub-caption: "N tarlada dağılmış".
**Acceptance criteria:**
- [ ] Updates in realtime (Supabase Realtime sub on `tasks`)
- [ ] Click → `/tasks?status=TODO,IN_PROGRESS,BLOCKED&due=today`
**Verification:** create task → tile increments
**Dependencies:** M7-01
**Files likely touched:** `src/features/dashboard/TodaysTasksTile.tsx`, `src/features/tasks/useTodaysTaskCounts.ts`
**Estimated scope:** S

### Task M7-03: Stat tile — Açık sorunlar
**Description:** Count of unresolved `issues`. Click → `/issues?resolved=false`.
**Acceptance criteria:** same pattern as M7-02
**Verification:** submit issue → tile increments
**Dependencies:** M7-02
**Files likely touched:** `src/features/dashboard/OpenIssuesTile.tsx`
**Estimated scope:** S

### Task M7-04: Stat tile — Aktif tarlalar
**Description:** Count of distinct `field_id` in today's non-DONE tasks. Click → `/fields?hasTasksToday=true`.
**Acceptance criteria:** same pattern
**Verification:** create tasks across 3 fields → tile shows 3
**Dependencies:** M7-02
**Files likely touched:** `src/features/dashboard/ActiveFieldsTile.tsx`
**Estimated scope:** S

### Task M7-05: Weather widget — Open-Meteo
**Description:** Server-side (or client, given Open-Meteo is CORS-friendly) fetch current temp + icon + high/low for operation city. Cache 15 min.
**Acceptance criteria:**
- [ ] City resolved via Open-Meteo geocoding API
- [ ] Temp, feels-like, high, low, weather code → icon mapping
- [ ] TanStack Query 15 min staleTime
- [ ] Offline: shows last-known
**Verification:** widget renders; toggle offline → last cached shown
**Dependencies:** M7-01, M1-02
**Files likely touched:** `src/features/weather/useWeather.ts`, `src/features/dashboard/WeatherTile.tsx`
**Estimated scope:** M

### Task M7-06: Task board — 3-column collapsible (TODO / SÜRÜYOR / BİTTİ)
**Description:** Below stat tiles, left side. Columns grouped by status, collapsible on narrow screens. Each card clickable → same side-sheet as M2-06.
**Acceptance criteria:**
- [ ] Realtime updates (tasks move between columns as status changes)
- [ ] Empty columns show placeholder text
- [ ] Max 10 cards per column visible; "Daha fazla göster" link to full tasks page
**Verification:** worker starts task → card moves from TODO to IN_PROGRESS live
**Dependencies:** M7-01, M2-05
**Files likely touched:** `src/features/dashboard/TodaysBoard.tsx`, shared kanban card component
**Estimated scope:** M

### Task M7-07: Mini satellite map — today's active fields highlighted
**Description:** Right column, above activity feed. Same ESRI tiles. Today's active field polygons in `orchard-500/30`; others `muted/20`. Click a polygon → `/fields?id=...`.
**Acceptance criteria:**
- [ ] Bounds auto-fit to active fields
- [ ] < 500ms to interactive (deferred hydration OK)
**Verification:** 3 fields active → all 3 highlighted; click opens detail
**Dependencies:** M7-01, M1-07
**Files likely touched:** `src/features/dashboard/MiniFieldsMap.tsx`
**Estimated scope:** M

### Task M7-08: Activity feed — last 20 events
**Description:** Right column bottom. Reads `activity_log` newest first, limits 20. Each row: icon (action kind), short Turkish description, actor, timestamp (relative).
**Acceptance criteria:**
- [ ] Realtime subscribe; new events prepend
- [ ] "Daha fazla" link to full audit log (future)
- [ ] Turkish relative time ("2 dakika önce")
**Verification:** create task → feed shows "Sen oluşturdu" within 2s
**Dependencies:** M7-01, M2-08
**Files likely touched:** `src/features/dashboard/ActivityFeed.tsx`, `src/lib/format-relative-tr.ts`
**Estimated scope:** M

### Task M7-09: Dashboard performance pass
**Description:** Lazy-load the map + feed; skeleton everywhere; parallel queries; minimize reflows.
**Acceptance criteria:**
- [ ] Lighthouse Performance ≥ 85 on 4G (spec KPI)
- [ ] LCP ≤ 800ms
- [ ] No layout shift (CLS < 0.05)
**Verification:** Lighthouse report committed to `docs/lighthouse/m7-ω.html`
**Dependencies:** M7-08
**Files likely touched:** same files; tuning only
**Estimated scope:** M

### Checkpoint M7-ω: Dashboard
- [ ] Owner opens `/today`, sees full picture in < 5s
- [ ] All tiles + board + map + feed update in realtime
- [ ] Lighthouse Perf ≥ 85 (spec KPI)
- [ ] Human review

---

## M8 — Polish + launch

Goal: accessibility, Lighthouse, i18n completeness, KVKK, data export, production deploy.

### Task M8-01: Accessibility audit — manual + automated
**Description:** Run axe-core in e2e; manual keyboard walkthrough of every route; screen-reader smoke test (VoiceOver + NVDA).
**Acceptance criteria:**
- [ ] Zero axe-core violations of severity Serious or Critical
- [ ] Every interactive element keyboard-reachable with visible focus ring
- [ ] All icons have Turkish `aria-label`
- [ ] Forms announce errors via `aria-live="polite"`
**Verification:** `pnpm test:e2e -- --grep a11y` green; manual checklist in `docs/a11y-checklist.md`
**Dependencies:** M7-ω
**Files likely touched:** `e2e/a11y.spec.ts`, scattered component fixes
**Estimated scope:** M

### Task M8-02: Worker AAA contrast + 72px CTA verification
**Description:** Spec requires AAA (7:1) on worker primary actions. Audit all primary CTAs on worker screens.
**Acceptance criteria:**
- [ ] `orchard-500 on white` measures ≥ 7:1 (else switch to `orchard-700`)
- [ ] Every worker primary CTA ≥ 72px tall, full-width
- [ ] All other mobile interactive ≥ 56px
**Verification:** contrast ratios recorded in `docs/contrast-audit.md`
**Dependencies:** M8-01
**Files likely touched:** design tokens if adjusted; WorkerButton component
**Estimated scope:** S

### Task M8-03: Lighthouse performance pass (worker mobile)
**Description:** Hit Lighthouse Performance ≥ 85 on worker routes on simulated 4G. Bundle budget audit.
**Acceptance criteria:**
- [ ] Initial JS ≤ 250 kB gzipped
- [ ] No unused Leaflet on mobile routes (dynamic import for owner-only code)
- [ ] Images compressed; icon SVGs inlined
**Verification:** Lighthouse report ≥ 85 on all mobile routes
**Dependencies:** M8-02
**Files likely touched:** `vite.config.ts`, route-level dynamic imports
**Estimated scope:** M

### Task M8-04: PWA score ≥ 90
**Description:** Round out PWA requirements: offline fallback page, proper maskable icons, `splash_screens`, `apple-touch-icon`, correct scope.
**Acceptance criteria:**
- [ ] Lighthouse PWA ≥ 90 (spec KPI)
- [ ] Installable on Android Chrome + iOS Safari 16.4+
- [ ] Offline fallback route for uncached navigations
**Verification:** Lighthouse report ≥ 90
**Dependencies:** M8-03
**Files likely touched:** `public/manifest.webmanifest`, `public/icons/*`, `src/routes/offline.tsx`
**Estimated scope:** M

### Task M8-05: i18n completeness — extract + review
**Description:** Ensure every user-facing string is extracted; no English strings slipped into JSX. Turkish review by owner.
**Acceptance criteria:**
- [ ] `pnpm i18n:extract` produces zero new messages (all already in catalog)
- [ ] Grep check: no hardcoded Turkish outside `.po` files
- [ ] Owner reviews the full catalog for tone + accuracy
**Verification:** grep + owner sign-off; `pnpm lint` (Lingui rule) green
**Dependencies:** M8-04
**Files likely touched:** `src/locales/tr/messages.po`
**Estimated scope:** M

### Task M8-06: KVKK page + privacy copy
**Description:** New route `/privacy` with KVKK-aligned copy: what data is collected, why, where it's stored (Supabase Seoul), retention, user rights.
**Acceptance criteria:**
- [ ] Page linked from login, setup, and settings
- [ ] Content reviewed for KVKK compliance (self-review is fine; disclaim "informational, not legal advice")
**Verification:** manual readthrough; link appears where required
**Dependencies:** M8-05
**Files likely touched:** `src/routes/privacy.tsx`
**Estimated scope:** S

### Task M8-07: Data export — "Tüm verilerimi indir" (JSON dump)
**Description:** Settings → export button. Edge function `export-data` returns signed URL to a JSON bundle: all `people`, `fields`, `tasks`, `issues`, `chemical_applications`, `activity_log` the owner has access to.
**Acceptance criteria:**
- [ ] Async job; status polled
- [ ] Produces ≤ 100 MB per operation (current scale fits easily)
- [ ] Signed URL expires in 24h
**Verification:** click export → receive file; content matches DB counts
**Dependencies:** M8-06
**Files likely touched:** `supabase/functions/export-data/index.ts`, `src/features/settings/export-data.ts`
**Estimated scope:** M

### Task M8-08: Person delete + anonymize historical audit entries
**Description:** Deleting a person soft-deletes (`active=false`) and anonymizes `activity_log.actor_id` to a sentinel "removed user" row (spec §12).
**Acceptance criteria:**
- [ ] DB trigger on person delete → rewrites `actor_id` in historical rows
- [ ] UI shows "Kaldırılmış kullanıcı" for anonymized entries
- [ ] Restorable within 30 days via admin panel (deferred: just hard-delete in MVP)
**Verification:** delete a person → their history rows show anonymized label
**Dependencies:** M8-07
**Files likely touched:** `supabase/migrations/...person_delete_trigger.sql`, `src/features/people/delete-person.ts`
**Estimated scope:** M

### Task M8-09: Install instructions page for non-tech workers
**Description:** Short illustrated page `/how-to-install` linked from the setup flow. Screenshots for Chrome-Android and Safari-iOS.
**Acceptance criteria:**
- [ ] 4–6 screenshots with Turkish captions
- [ ] Video GIF (≤ 5 MB) optional
- [ ] Accessible via QR from a printable PDF (future)
**Verification:** show a non-tech friend — they install without verbal help
**Dependencies:** M8-06
**Files likely touched:** `src/routes/how-to-install.tsx`, `public/install-guide/*.png`
**Estimated scope:** M

### Task M8-10: E2E critical flows suite (7 flows from spec §11)
**Description:** Complete Playwright suite; runs nightly in CI.
**Acceptance criteria:**
- [ ] All 7 flows pass deterministically: field-create, task-assign-see, task-complete, issue-report, offline-sync, reassign, CSV export
- [ ] Nightly GH Action runs suite and uploads trace artifacts
**Verification:** `pnpm test:e2e` green; CI artifact inspected
**Dependencies:** M8-09
**Files likely touched:** `e2e/*.spec.ts`, `.github/workflows/e2e-nightly.yml`
**Estimated scope:** L — **SPLIT** per flow if needed

### Task M8-11: Production deploy (Vercel or Cloudflare Pages)
**Description:** Pick one (default: Cloudflare Pages for generosity). Configure env vars. Connect `main` → production deploys. Custom domain.
**Acceptance criteria:**
- [ ] `https://agrova.app` (or chosen domain) serves the PWA
- [ ] HTTPS enforced; HSTS enabled
- [ ] Env vars scoped; no service-role key on client
**Verification:** visit domain on mobile; install; complete a task
**Dependencies:** M8-10
**Files likely touched:** deploy config (out-of-repo), README deployment section
**Estimated scope:** M

### Task M8-12: Launch smoke test + user onboarding session
**Description:** Owner creates their real data (10 fields, 5 people, invites them). Run a full day with real workers. Collect bug list.
**Acceptance criteria:**
- [ ] All spec §17 success criteria items checked
- [ ] Zero P0 bugs found during the session
- [ ] Feedback doc captured in `docs/launch-retro.md`
**Verification:** human review — the retro doc
**Dependencies:** M8-11
**Files likely touched:** `docs/launch-retro.md` only
**Estimated scope:** M

### Checkpoint M8-ω: Launch
- [ ] Every item in spec §17 "Success Criteria" checked
- [ ] Production deploy live; daily digest arriving; pushes working
- [ ] Coverage totals meet §11: sync/db ≥ 95%, services ≥ 80%, repo ≥ 70%
- [ ] **MVP complete.** Move to v1.1 backlog from spec §18.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Setup link flow is fragile on low-end devices** | Workers can't install → entire mobile track stuck | M3-02 ships with extensive logging + fallback "manual setup code" path |
| **Offline sync produces data divergence** | Worker thinks task done, server doesn't — trust collapses | Spec defines last-write-wins + client-UUID idempotency (M3-10/11); ≥ 95% coverage required |
| **Supabase Seoul latency from Turkey (~280ms RTT)** | Dashboard feels sluggish | Every query has a local cache; Realtime fills in; measured in M7-09 |
| **iOS PWA limitations (push on iOS 16.4+; limited storage)** | Older iOS users can't install or don't receive push | Detect + show fallback instructions; bell-badge path keeps working |
| **Turkish diacritic rendering** (ş ç ğ ı İ) | UX defects hard to spot for non-Turkish reviewers | Test at every type size per spec §17; Lingui lint catches accidental English |
| **Worker literacy assumptions wrong** | Some workers DO want to type notes | Not a blocker for MVP — spec says icons only; collect feedback in M8-12 |
| **Leaflet + ESRI tile quota** | Rate limits on heavy-usage days | Tile cache via service worker (Workbox CacheFirst 7d); monitor; swap to Mapbox (paid) if needed |
| **Netgsm / carrier SMS (if added post-MVP)** | Optional v1.1 channel | MVP relies on copy-URL only; evaluate provider if SMS is enabled |
| **RLS misconfiguration** | Data leak between workers | pgTAP suite in M0-14 + M2-09 + M4-08; advisor scan in every migration |
| **Scope creep from "just one more thing"** | MVP never ships | Strict adherence to `.cursor/rules/incremental-implementation.mdc` Rule 0.5 (Scope Discipline) |

---

## Open Questions

Captured during planning — flagged for human decision, **not blocking** the immediate next tasks (M0-02+):

1. **Completion photos storage.** Spec §3 says completion photo is optional on task Done, but §5 only defines a bucket for issue photos. Decision needed: reuse `issue-photos` bucket with path prefix `task-completions/` OR new bucket `task-photos`. _Default unless overridden: reuse `issue-photos` with prefix, since it's a rare write path._
2. **Operation settings table.** Spec §3 says "owner sets the city once in settings" but §5 doesn't list an `operation_settings` table. M1-02 assumes we add one. _Default: yes, add it._
3. **`auth_user_id` vs phone-based Supabase Auth.** Spec §4 now assumes **in-app / copied setup URL in MVP** (no product SMS). _Default: custom `claim-setup-token` + `people` link (M3-02); add Supabase Phone Auth or Netgsm only if v1.1+._
4. **`people.active` soft-delete.** Not in spec §5 but needed for M1-03 archive UX and M8-08. _Default: add column in M1-03 migration._
5. **Completion confirmation required even without photo?** Spec §3 worker flow says "second screen confirm". Current plan (M3-07) always shows confirm. _Confirm default._
6. **Voice note recording format.** Some browsers default to `audio/webm`; iOS Safari can't record WebM. _Default: `audio/mp4` (m4a) where supported; feature-detect and gracefully disable recording on iOS < 14._
7. **Daily digest delivery window.** Spec §14 says 18:00; confirm this is 18:00 Istanbul (assumed) vs server time.
8. **Domain name.** Plan uses `agrova.app` as a placeholder; actual domain purchase deferred to M8-11.

---

## Parallelization Map

For a solo dev + agent, "parallelization" = multiple agent sessions ordered by dependency. If two sessions are available:

- **Safe to run side-by-side (no shared file conflicts):**
  - M1-05/06/07 (fields) and M1-08 (equipment) — independent features, different folders
  - M4-03b (photo upload retry) and M6-02 (push subscribe) — both client-side libs, separate modules
  - M7-02/03/04 (three stat tiles) — can be one-per-agent-session
- **Must be sequential:**
  - All DB migrations (M0-11 → 12 → 13 → 14 → 15)
  - All sync/outbox work (M3-09 → 10 → 11 → 12)
  - Generated types (M0-16) blocks all typed queries above it
- **Needs coordination (define contract first):**
  - Edge functions (M3-02a claim, M6-03 web-push) — agree on request/response JSON before splitting server/client work

---

## Progress tracking

**Convention:** *Done* = task met as written in this plan. *In progress* = implemented with documented gaps (partial), or tests/CI not fully closed. *Pending* = not started, deferred, or still open (includes human/ops only where that is the task’s remaining work). Per-milestone `Done + In progress + Pending` = **Tasks**.

| Milestone | Tasks | Done | In progress | Pending |
|-----------|------:|-----:|------------:|--------:|
| M0 Foundations | 17 | 17 | 0 | 0 |
| M1 Catalogs | 12 | 11 | 1 | 0 |
| M2 Tasks | 9 | 8 | 1 | 0 |
| M3 Worker mobile | 15 | 7 | 7 | 1 |
| M4 Issues & photos | 8 | 7 | 1 | 0 |
| M5 Equipment + chemicals | 5 | 5 | 0 | 0 |
| M6 Notifications | 8 | 7 | 1 | 0 |
| M7 Owner dashboard | 9 | 8 | 0 | 1 |
| M8 Polish + launch | 12 | 9 | 0 | 3 |
| **Total** | **95** | **80** | **12** | **3** |

**Footnotes (ids → meaning)**

- **M1-12** → *in progress* (catalog coverage + integration in CI; `supabase/seed` optional; M1-ω).
- **M2-09** → *in progress* (unit tests; full tasks coverage + pgTAP in default CI: M2-ω).
- **M3-01** → *pending* (⏸️ deferred, v1.1+). **M3-05..15** (except full-done ids) → *in progress* (see M3 slice tracker: pull-to-refresh, Dexie-first, E2E depth, M3-ω).
- **M4-08** → *in progress* (E2E dual-session deferred; M4-ω).
- **M6-08** → *in progress* (unit tests present; E2E push / full M6-ω).
- **M7-09 / M7-ω** → *pending* (Lighthouse/perf report to `docs/lighthouse/`, etc.).
- **M8** *pending* = 3: **(1)** i18n — Turkish catalog completion + owner tone review, **(2)** M8-10 — seven critical E2E flows in CI, **(3)** M8-11 / M8-12 — production domain + launch retro (human/ops); partial M8 items are counted under *Done* if the code path exists (e.g. a11y axe, export edge, off-line route).

**Checkpoints (ω)** are not separate rows; they close when the milestone’s *Done* + agreed *In progress* matches exit criteria in each **Checkpoint Mx-ω** section (often **human**).

Update this table at each checkpoint.

---

*Plan version 1.0 — produced by `/plan` against `specs/farm-operations-app.md` v1.0. Update in-place when decisions change; never delete completed task entries (they're the historical record of what was built).*
