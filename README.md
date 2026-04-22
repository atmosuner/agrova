# Agrova

[![CI](https://github.com/atmosuner/agrova/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/atmosuner/agrova/actions/workflows/ci.yml)

> A mobile-first, offline-capable task management PWA for a Turkish fruit operation.
> Owners plan; foremen, agronomists, and low-literacy field workers execute.

**Status:** Pre-alpha. Spec is locked; implementation is in progress.

---

## What's in this repo (so far)

| Path | What |
|---|---|
| [`specs/farm-operations-app.md`](./specs/farm-operations-app.md) | Full product requirements — objectives, data model, UX, RLS matrix, milestones |
| [`DESIGN.md`](./DESIGN.md) | Design system: color tokens, typography, spacing, components, Turkish-first rules |
| [`.cursor/rules/`](./.cursor/rules/) | Always-applied rules (TDD, incremental-implementation, language-boundary, design-system, code-review, do's-and-don'ts) |
| [`.cursor/MCP-SETUP.md`](./.cursor/MCP-SETUP.md) | How to wire the GitHub + Supabase MCP servers the agent uses |
| [`.cursor/AGENTS.md`](./.cursor/AGENTS.md) | Agent-facing guide (skills, personas, commands) |
| [`docs/decisions/`](./docs/decisions/) | Architecture Decision Records (ADRs) — e.g. [ADR-001: worker device auth + offline sync](./docs/decisions/001-worker-device-auth-and-offline-sync.md) |

## Tech stack (per spec §4)

- **Client:** React 19 + Vite + TypeScript, **Tailwind v4** (`@tailwindcss/vite`) with **DESIGN.md** color tokens in CSS, **shadcn/ui** (Radix + Nova) with shadcn tokens mapped to `--agrova-*` in `src/index.css`, Lingui (tr primary, en second), Leaflet + ESRI World Imagery, Dexie (IndexedDB) for offline cache
- **Backend:** Supabase Cloud (Seoul / `ap-northeast-2`) — Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions, RLS
- **Delivery:** PWA (`vite-plugin-pwa` + Workbox `generateSW`, `workbox-window` for registration), GitHub Actions CI, branch-protected `main`

## Milestones

See [`specs/farm-operations-app.md §16`](./specs/farm-operations-app.md#16-delivery-milestones). In short:

`M0 Foundations → M1 Catalogs → M2 Tasks (owner) → M3 Worker MVP → M4 Issues + photos → M5 Equipment + chemicals → M6 Notifications → M7 Owner home → M8 Polish + launch`

## Routing

- **TanStack Router** (file-based under `src/routes/`, tree in `src/routeTree.gen.ts`).
- **Owner shell** — pathless `_owner/` → URLs like `/today`, `/tasks`, …
- **Worker PWA shell** — under `/m/…` (e.g. `/m/tasks`) so it does not clash with owner `/tasks`. Revisit when role-based routing lands.

## i18n (Lingui)

- **Source strings** in code use Lingui `msg` / `t` template macros in English; **Turkish copy** lives in `src/locales/tr/messages.po` (and English in `en/`). **Default locale** is `tr` (`src/lib/i18n.ts`).
- **Extract / compile:** `pnpm i18n:extract` → optional `pnpm i18n:fill-tr` (fills empty `msgstr` in `tr` via `scripts/fill-tr-po.mjs`) → `pnpm i18n:compile` (or rely on `pnpm build`, which compiles catalogs first). Commit both `.po` and generated `src/locales/*/messages.ts`.
- **Vite:** `@lingui/vite-plugin` + Babel — `@vitejs/plugin-react` is **pinned to v5** (v6 no longer exposes `babel` options; Lingui still needs the macro transform).

## Environment (M0-08)

- Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Dashboard → **Project Settings** → **API**).
- `src/lib/supabase.ts` and `src/lib/db.ts` (Dexie) — see `docs/dev-smoke-tests.md` for quick console checks.

## PWA (M0-07)

- **Manifest** at `/manifest.webmanifest` after `vite build` / `vite preview`; **`start_url` `/`**, **`scope` `/`**, `theme_color` / `background_color` from **DESIGN.md** (`#3F8B4E` / `#FAFAF7`).
- **Icons:** `public/icons/pwa-192.png`, `pwa-512.png`, `pwa-512-maskable.png` (orchard brand solid — replace with a real mark when design lands).
- **Service worker:** Workbox `generateSW` + `registerSW` from `virtual:pwa-register` in `src/main.tsx`. App-shell precache only; **no API/offline data strategies** until later milestones.
- **Verify:** `pnpm build && pnpm preview`, then open `/manifest.webmanifest` and test installability (e.g. Lighthouse PWA, Chrome install banner).

## Running locally

```bash
corepack enable pnpm   # once per machine
pnpm install
pnpm dev                # http://127.0.0.1:5173
```

Quality (match CI):

```bash
pnpm typecheck
pnpm lint
pnpm test:coverage
pnpm build
```

**Supabase (local):** after `supabase link` and a running stack, `pnpm supabase:test` runs `supabase db test` against `supabase/tests/*.sql` (includes `tasks-rls.test.sql` + `rls.test.sql` when your CLI runs the folder). Not part of the default GitHub **quality** job. See `supabase/README.md`.

**Lighthouse (M7-ω):** see [`docs/lighthouse/README.md`](./docs/lighthouse/README.md). After `pnpm build`, start `pnpm preview --port 4173` and run `pnpm lh:report` to refresh `docs/lighthouse/m7-ω.html` (unauthenticated `/today` → login redirect baseline).

**Playwright (optional authed E2E):** set `E2E_OWNER_EMAIL` and `E2E_OWNER_PASSWORD` in `.env` (see `.env.example`). Playwright then runs `e2e/auth.owner.setup.ts`, writes `e2e/.auth/owner.json` (gitignored), and runs `e2e/*.authed.spec.ts`. Without these vars, authed specs are skipped and only public smokes run.

Fast test run without coverage thresholds: `pnpm test:run`. Watch mode: `pnpm test` (Vitest).

**E2E:** `pnpm dev` in one terminal, then `pnpm test:e2e` (or `PLAYWRIGHT_BASE_URL` if the dev server port differs). A **nightly** workflow (`.github/workflows/e2e-nightly.yml`) builds, runs `vite preview`, and executes Playwright — set `VITE_*` secrets in CI if tests need a real Supabase project.

**Production deploy (outline):** Build the static client with `pnpm build`. Host the `dist/` output on **Vercel**, **Cloudflare Pages**, **GitHub Pages**, or similar. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host’s environment (no service role on the client). Point your domain’s DNS to the host; enforce HTTPS. Supabase Edge Functions and DB stay on the Supabase project (Seoul).

**GitHub Pages (project site `/<repo>/`):** In the repo, enable **Settings → Pages → Build and deployment → Source: GitHub Actions**. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as [repository Action secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) (they are the same variables as in `.env.example`). Merges to `main` run `.github/workflows/deploy-github-pages.yml`, which builds with `AGROVA_GITHUB_PAGES=1` (Vite `base` = `/<repo name>/`, TanStack `basepath` from `import.meta.env.BASE_URL`) and copies `index.html` to `404.html` for client-side routes. In Supabase **Authentication → URL configuration**, add your GitHub Pages origin (e.g. `https://<user>.github.io` and the full app URL with path if you use a project page). A root **user/organization** site from a `*.github.io` repository uses `base: '/'` automatically (the workflow still sets `AGROVA_GITHUB_PAGES=1` — `resolveGhpViteBase()` skips the subpath when the repo name ends with `.github.io`).

**shadcn/ui (M0-04):** use non-interactive flags — see [`docs/shadcn-init.md`](./docs/shadcn-init.md).

## Contributing

Solo dev for now; if you land here anyway, read `specs/farm-operations-app.md` top-to-bottom first, then `DESIGN.md`, then pick a milestone.

**Branch protection (M0-10):** after CI has run on `main`, enable rules for `main` — see [`docs/github-branch-protection.md`](./docs/github-branch-protection.md).

**Supabase migrations:** SQL in [`supabase/migrations/`](./supabase/migrations/); see [`supabase/README.md`](./supabase/README.md).

## License

TBD.
