# Lighthouse (M7-09 / M7-ω)

Owner dashboard performance is tracked in the plan as **M7-09** (Lighthouse Performance ≥ 85 on simulated 4G, LCP ≤ 800ms, CLS below 0.05).

## Automated report (`/today`, unauthenticated)

With a **preview** server running, the repo can generate HTML + JSON:

```bash
pnpm build
pnpm preview --port 4173 --host 127.0.0.1   # other shell
pnpm lh:report
```

This runs Lighthouse against `http://127.0.0.1:4173/today`. **Without a session**, the app redirects to `/login`, so scores reflect the **login shell** (baseline). For **owner dashboard** metrics, run against a logged-in profile in Chrome DevTools or point `LIGHTHOUSE_URL` at staging with cookies.

Outputs (also copied to M7-ω filenames):

- `m7-today.report.html` / `m7-today.report.json`
- `m7-ω.html` / `m7-ω.json`

## Manual capture (full owner session)

1. Log in as owner in Chrome, then DevTools → **Lighthouse** on `/today`.
2. Save the HTML/JSON export into this folder for the **Checkpoint M7-ω** review.

Re-run `pnpm lh:report` after meaningful performance work to refresh the committed baselines.
