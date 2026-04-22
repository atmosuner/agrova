# Lighthouse (M7-09 / M7-ω)

Owner dashboard performance is tracked in the plan as **M7-09** (Lighthouse Performance ≥ 85 on simulated 4G, LCP ≤ 800ms, CLS below 0.05).

## How to capture a report

1. `pnpm build && pnpm preview` (or point at staging).
2. Open Chrome → DevTools → **Lighthouse** (or use the Lighthouse CLI against `http://127.0.0.1:4173/today` or your preview port).
3. Save the **HTML** (and optionally JSON) export and commit it here, e.g. `docs/lighthouse/m7-omega-<date>.html`, when running the **Checkpoint M7-ω** review.

The plan asks for a committed report at `docs/lighthouse/m7-ω.html` for final sign-off; replace that filename when the numbers meet the spec.
