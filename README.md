# Agrova

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
- **Extract / compile:** `pnpm i18n:extract` → `pnpm i18n:compile` (or rely on `pnpm build`, which compiles catalogs first). Commit both `.po` and generated `src/locales/*/messages.ts`.
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

Quality:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

**shadcn/ui (M0-04):** use non-interactive flags — see [`docs/shadcn-init.md`](./docs/shadcn-init.md).

## Contributing

Solo dev for now; if you land here anyway, read `specs/farm-operations-app.md` top-to-bottom first, then `DESIGN.md`, then pick a milestone.

## License

TBD.
