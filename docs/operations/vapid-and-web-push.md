# VAPID keys and Web Push (operational)

Web Push in Agrova uses [VAPID](https://datatracker.ietf.org/doc/html/rfc8292) so the browser and FCM/APNS know which application server is sending. Keys are **generated once per project (or per environment)**, then stored as **Supabase Edge secrets**—never in the Vite app or in git.

## Fast path (from this repo)

1. Create a [Supabase personal access token](https://supabase.com/dashboard/account/tokens) (for CLI / secrets — not the anon key).
2. Add to your **gitignored** root `.env`:  
   `SUPABASE_ACCESS_TOKEN=sbp_...`  
   Optional: `VAPID_SUBJECT=mailto:you@example.com`
3. Run: **`pnpm vapid:push-secrets`**  
   This generates keys, runs `supabase secrets set` for `VAPID_*`, redeploys `get-vapid-public-key`, `web-push-fanout`, and `daily-digest`, and removes a temporary `supabase/.vapid-generated.env` when successful.

If you skip the token, the script still writes `supabase/.vapid-generated.env` (gitignored) so you can paste the three values manually in the Dashboard.

## What is deployed in the repo

| Name | Role |
|------|------|
| `get-vapid-public-key` | Returns `{ publicKey, ok: true }` for `register-web-push` (uses `VAPID_PUBLIC_KEY` only). |
| `web-push-fanout` | Inserts in-app `notifications` and sends push to `push_subscriptions` (uses public + private + subject). |
| `daily-digest` | Same VAPID envs for scheduled digest push. |
| `src/features/notifications/register-web-push.ts` | Subscribes the browser after permission + SW; upserts `push_subscriptions`. |
| `public/notification-sw.js` | Shows the notification and handles `notificationclick` (imported from the main PWA service worker). |

Migrations: `20260422180000_m6_push_subscriptions.sql` (table + RLS).

## 1. Generate a key pair

From the repository root:

```bash
pnpm vapid:keys
```

This runs `web-push generate-vapid-keys` and prints a **public** and **private** line (Base64 URL-safe). Copy them immediately; they are not stored by the tool.

**Subject:** set `VAPID_SUBJECT` to a contact the push service can associate with you, e.g. `mailto:ops@yourdomain.com` (RFC 8292) or an `https:` admin URL.

## 2. Add secrets in Supabase

In the [Supabase Dashboard](https://supabase.com/dashboard) → your project:

1. **Project Settings** → **Edge Functions** (or **Secrets** / “Manage secrets” depending on UI version).
2. Add:

| Secret | Value |
|--------|--------|
| `VAPID_PUBLIC_KEY` | Public key from step 1 (single line) |
| `VAPID_PRIVATE_KEY` | Private key from step 1 (single line) |
| `VAPID_SUBJECT` | e.g. `mailto:ops@yourdomain.com` |

Do **not** add these to `.env` for Vite: the **private** key must not ship to the client. The app only needs the public key at runtime, which it fetches from `get-vapid-public-key` after deploy.

## 3. Redeploy Edge functions

Secrets are injected at deploy/cold start. After changing secrets, redeploy the functions that read them:

```bash
npx -y supabase@2 functions deploy get-vapid-public-key --project-ref <PROJECT_REF>
npx -y supabase@2 functions deploy web-push-fanout --project-ref <PROJECT_REF>
npx -y supabase@2 functions deploy daily-digest --project-ref <PROJECT_REF>
```

(Use the same project ref as in `VITE_SUPABASE_URL`.)

## 4. Verify

**Public key endpoint** — the gateway may require the **anon** key (same as the browser uses):

```bash
# Replace with your project URL and anon key from the Dashboard
curl -sS "https://<PROJECT_REF>.supabase.co/functions/v1/get-vapid-public-key" \
  -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <VITE_SUPABASE_ANON_KEY>"
```

Expect `200` and JSON like `{"publicKey":"...","ok":true}`. A `503` with `vapid_not_configured` means `VAPID_PUBLIC_KEY` is missing in secrets or the function was not redeployed. `UNAUTHORIZED_NO_AUTH_HEADER` means add the `apikey` + `Authorization` headers above.

**End-to-end:** log in as **owner**, grant notification permission in the browser, complete an action that logs to `activity_log` and calls `web-push-fanout` (e.g. task completion flow). The in-app bell can fill even if push delivery fails; OS notification requires permission + SW + a valid `push_subscriptions` row and successful send.

## Troubleshooting

| Symptom | Check |
|--------|--------|
| `503` from `get-vapid-public-key` | Secret `VAPID_PUBLIC_KEY` set; function redeployed. |
| `503` from `web-push-fanout` | Both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` set. |
| No OS notification, bell works | Push send failed; check function logs, subscription 410s, user permission. |
| No rows in `push_subscriptions` | User denied permission, or PWA/HTTPS/SW not available (local dev must be `localhost` or HTTPS). |

See also: `supabase/README.md` (M6 / M8 edge notes).
