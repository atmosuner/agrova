# Dev smoke tests (manual)

Short checks you can run while `pnpm dev` is up. Keep this list updated as endpoints and tables appear.

## Supabase client (M0-08)

1. Copy `.env.example` to `.env` and set real `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
2. Restart the dev server so Vite picks up env.
3. In the browser console (with the app open in dev), the client is exposed as `window.__agrova.supabase`.
4. Run:
   - `await window.__agrova.supabase.auth.getSession()` — should resolve (no network error if URL/key match the project).
   - `const { data, error } = await window.__agrova.supabase.from('pg_stat_user_tables').select('relname').limit(1)` — **usually fails** via PostgREST (system views are not exposed on `public` by default). Prefer `auth.getSession()` or, after **M0-11**, `from('people').select('id').limit(0)` for a real table check.

## Dexie (M0-08)

- `window.__agrova.db` — `IndexedDB` database name `agrova`, version 1, no stores until later milestones.
