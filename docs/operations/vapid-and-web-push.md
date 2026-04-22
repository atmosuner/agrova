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

## Who receives in-app + Web Push (fan-out)

Source of truth: `supabase/functions/_shared/web-push-fanout-recipients.ts` (`resolveWebPushRecipientIds`).

| Event | Who gets a `notifications` row + push (if subscribed and not self-muted) |
|--------|--------------------------------|
| `task.created`, `task.duplicated` | The task **assignee**, unless the assignee is the **actor** (e.g. self-assigned / worker created for self). |
| `task.reassigned` | **Previous** and **new** assignee (from the activity payload) plus all **OWNERS**, never the person who performed the **transfer** (actor). |
| `task.started`, `task.done`, `task.blocked` (and other `task.*` not above) | All **OWNERS** except the **actor** (e.g. worker’s status change notifies owners, not the worker themself). |
| `issue.*` | All **OWNERS** except the **actor** (e.g. reporter or resolver is not self-notified). `issue.reported` cannot be muted in prefs (KPI). |

`people.notification_prefs.muted_event_actions` still applies per recipient when the action is mutable (see `src/lib/notification-prefs.ts`).

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
# Use --no-verify-jwt for the two user-invoked functions (ES256 / hosted gateway; see supabase/README.md)
npx -y supabase@2 functions deploy get-vapid-public-key --no-verify-jwt --project-ref <PROJECT_REF>
npx -y supabase@2 functions deploy web-push-fanout --no-verify-jwt --project-ref <PROJECT_REF>
npx -y supabase@2 functions deploy daily-digest --project-ref <PROJECT_REF>
```

If the browser shows **401** on `get-vapid-public-key` or `web-push-fanout` when the user is signed in, redeploy with **`--no-verify-jwt`**. The functions still read `Authorization` and validate the user in code where needed.

(Use the same project ref as in `VITE_SUPABASE_URL`.)

## 4. Verify

**Public key endpoint** — the gateway may require the **anon** key (same as the browser uses):

```bash
# Replace with your project URL and anon key from the Dashboard
curl -sS "https://<PROJECT_REF>.supabase.co/functions/v1/get-vapid-public-key" \
  -H "apikey: <VITE_SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <VITE_SUPABASE_ANON_KEY>"
```

Expect `200` and JSON like `{"publicKey":"...","ok":true}`. A `503` with `vapid_not_configured` means `VAPID_PUBLIC_KEY` is missing in secrets or the function was not redeployed. `UNAUTHORIZED_NO_AUTH_HEADER` on **curl** means add the `apikey` + `Authorization` headers above. **401 from the in-app** `supabase.functions.invoke` while signed in means redeploy with **`--no-verify-jwt`** (ES256 / gateway; see above).

**End-to-end (owner as actor on own task):** you may see `{ ok: true, sent: 0, reason: "no_recipients" }` when the only eligible recipient would be the actor (e.g. owner creates a self-assigned task). To see rows in `notifications` and a non-zero `sent`, use **two people**: e.g. owner creates a task for a **worker** assignee, or log in as **worker** and start a task (owners get the fan-out). Grant notification permission and ensure a `push_subscriptions` row for the person you expect to receive the push.

## Temporary notification debugging

- **Browser (owner app / worker):** In dev, open DevTools → Console; filter for `[agrova:notify]`. Covers Web Push registration, `web-push-fanout` invoke responses, in-app inbox query, and Realtime channel status. In production, set `VITE_NOTIFY_DEBUG=1` in your **build** env and redeploy the site (remove after debugging).
- **Edge `web-push-fanout`:** Add secret **`NOTIFY_DEBUG=1`** in Supabase, redeploy the function, then use **Project → Edge Functions → web-push-fanout → Logs** (or Log Explorer). Remove the secret and redeploy when done.

## Troubleshooting

| Symptom | Check |
|--------|--------|
| `503` from `get-vapid-public-key` | Secret `VAPID_PUBLIC_KEY` set; function redeployed. |
| `503` from `web-push-fanout` | Both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` set. |
| No OS notification, bell works | Push send failed; check function logs, subscription 410s, user permission. |
| No rows in `push_subscriptions` | User denied permission, or PWA/HTTPS/SW not available (local dev must be `localhost` or HTTPS). |
| **401** on get-vapid / web-push in browser (owner logged in) | Redeploy those functions with **`--no-verify-jwt`**. `pnpm vapid:push-secrets` does this for those two. |

See also: `supabase/README.md` (M6 / M8 edge notes).
