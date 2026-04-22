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

- **Client:** React 19 + Vite + TypeScript, Tailwind + shadcn/ui re-skinned to DESIGN.md, Lingui (tr primary, en second), Leaflet + ESRI World Imagery, Dexie (IndexedDB) for offline cache
- **Backend:** Supabase Cloud (Seoul / `ap-northeast-2`) — Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions, RLS
- **Delivery:** PWA (single codebase serves owner web + worker mobile), GitHub Actions CI, branch-protected `main`

## Milestones

See [`specs/farm-operations-app.md §16`](./specs/farm-operations-app.md#16-delivery-milestones). In short:

`M0 Foundations → M1 Catalogs → M2 Tasks (owner) → M3 Worker MVP → M4 Issues + photos → M5 Equipment + chemicals → M6 Notifications → M7 Owner home → M8 Polish + launch`

## Running locally

Nothing to run yet — the web app scaffold lands in **Slice B** of Phase 2. Watch this README.

## Contributing

Solo dev for now; if you land here anyway, read `specs/farm-operations-app.md` top-to-bottom first, then `DESIGN.md`, then pick a milestone.

## License

TBD.
