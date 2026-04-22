# Supabase (Agrova)

- **Migrations** live in `migrations/`. File names are ordered by timestamp prefix.
- **Apply** the SQL on your **Supabase (Seoul)** project:
  - **Cursor / Supabase MCP** — `apply_migration` with the migration file’s SQL (keeps the hosted DB in sync with `migrations/*`); or
  - **Dashboard** → **SQL Editor** → paste a migration file, run; or
  - **Supabase CLI:** `supabase link --project-ref <ref>` then `supabase db push` (when using local CLI with this repo).

RLS, storage, and generated TypeScript types follow in later M0 tasks (`farm-operations-app.plan.md`).
