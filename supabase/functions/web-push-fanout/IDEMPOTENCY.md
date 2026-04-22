# Web-push fanout idempotency (M6-08)

`notifications` rows are inserted per **resolved recipient** (assignee, involved parties on
reassign, or owners as defined in `../_shared/web-push-fanout-recipients.ts`) before sending
Web Push. When the same
`activity_log` is processed twice, Postgres returns **code `23505` (unique violation)** on
`insert` into `notifications`; the handler **continues** (skips duplicate) so push is not
sent twice for the same (recipient, activity) pair. See `index.ts` around the
`nInsErr.code === "23505"` branch.

This is the server-side idempotency guarantee for the fanout edge function. Full E2E push
tests require VAPID + a registered subscription in a deployed environment.
