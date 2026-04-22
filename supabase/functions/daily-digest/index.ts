// @ts-nocheck — Deno edge
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1?target=deno&no-check"
import webpush from "https://esm.sh/web-push@3.6.6?target=deno&default"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agrova-cron",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  })
}

function todayIsoIstanbul() {
  const s = new Date().toLocaleString("en-CA", { timeZone: "Europe/Istanbul" })
  return s.slice(0, 10)
}

function pushMuted(prefs) {
  if (!prefs || typeof prefs !== "object" || Array.isArray(prefs)) {
    return false
  }
  return Boolean(prefs.push_muted)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const cronSecret = Deno.env.get("DAILY_DIGEST_CRON_SECRET")
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:ops@agrova.app"
  if (!supabaseUrl || !serviceKey) {
    return json({ error: "server_misconfigured" }, 500)
  }
  if (!cronSecret) {
    return json({ error: "cron_not_configured" }, 503)
  }
  const authz = req.headers.get("Authorization")
  const xh = req.headers.get("X-Agrova-Cron")
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : xh
  if (token !== cronSecret) {
    return json({ error: "unauthorized" }, 401)
  }
  if (!vapidPublic || !vapidPrivate) {
    return json({ error: "vapid_not_configured" }, 503)
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const admin = createClient(supabaseUrl, serviceKey)
  const day = todayIsoIstanbul()
  const [{ count: openIssues }, { count: doneToday }, { count: blockedToday }, { data: taskRows, error: tErr }, { data: owners, error: oErr }] =
    await Promise.all([
      admin.from("issues").select("id", { count: "exact", head: true }).is("resolved_at", null),
      admin.from("tasks").select("id", { count: "exact", head: true }).eq("due_date", day).eq("status", "DONE"),
      admin.from("tasks").select("id", { count: "exact", head: true }).eq("due_date", day).eq("status", "BLOCKED"),
      admin
        .from("tasks")
        .select("field_id")
        .eq("due_date", day)
        .in("status", ["TODO", "IN_PROGRESS", "BLOCKED"]),
      admin.from("people").select("id, notification_prefs").eq("role", "OWNER").eq("active", true),
    ])
  if (tErr) {
    return json({ error: tErr.message }, 500)
  }
  if (oErr) {
    return json({ error: oErr.message }, 500)
  }
  const fieldSet = new Set()
  for (const r of taskRows ?? []) {
    if (r.field_id) {
      fieldSet.add(r.field_id)
    }
  }
  const sub = `Açık sorun: ${openIssues ?? 0} · Bugün biten: ${doneToday ?? 0} · Bloke: ${
    blockedToday ?? 0
  } · Bugünkü tarlalar: ${fieldSet.size}`
  const title = "Günlük özet"
  const payload = { title, body: sub, data: { url: "/today", action: "digest.daily" } }
  const ownerRows = owners ?? []
  let sent = 0
  for (const o of ownerRows) {
    if (pushMuted(o.notification_prefs)) {
      continue
    }
    const { data: subs, error: sErr } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("person_id", o.id)
    if (sErr) {
      return json({ error: sErr.message }, 500)
    }
    for (const s of subs ?? []) {
      try {
        const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
        await webpush.sendNotification(sub, JSON.stringify(payload))
        sent += 1
      } catch (e) {
        const code = e?.statusCode
        if (code === 410) {
          await admin.from("push_subscriptions").delete().eq("person_id", o.id).eq("endpoint", s.endpoint)
        }
      }
    }
  }
  return json({ ok: true, sent, day, function: "daily-digest" })
})
