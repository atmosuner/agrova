// @ts-nocheck — Deno edge; web-push types vary by CDN
// Deploy with `--no-verify-jwt`: gateway JWT verify breaks ES256 user tokens; this function
// uses createClient(anon) + getUser(Authorization) like create-team-person.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1?target=deno&no-check"
import webpush from "https://esm.sh/web-push@3.6.6?target=deno&default"
import { resolveWebPushRecipientIds } from "../_shared/web-push-fanout-recipients.ts"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  })
}

function readMutedActions(prefs) {
  if (!prefs || typeof prefs !== "object" || Array.isArray(prefs)) return []
  const a = prefs.muted_event_actions
  return Array.isArray(a) ? a.filter((x) => typeof x === "string") : []
}

/** Set NOTIFY_DEBUG=1 in Edge secrets to see logs in the function’s Log Explorer (remove when done). */
function fanoutLog(...args) {
  if (Deno.env.get("NOTIFY_DEBUG") === "1") {
    console.log("[agrova:notify:fanout]", ...args)
  }
}

function buildMessage(activity) {
  if (activity.action === "issue.reported") {
    return {
      title: "Yeni sorun",
      body: "Bir ekip raporu alındı",
      linkPath: `/issues?highlight=${encodeURIComponent(activity.subject_id)}`,
    }
  }
  if (activity.action === "issue.resolved") {
    return {
      title: "Sorun çözüldü",
      body: "Bir rapor kapatıldı",
      linkPath: `/issues?highlight=${encodeURIComponent(activity.subject_id)}`,
    }
  }
  if (String(activity.action).startsWith("task.")) {
    return {
      title: "Görev güncellemesi",
      body: activity.action,
      linkPath: `/tasks?task=${encodeURIComponent(activity.subject_id)}`,
    }
  }
  return { title: "Agrova", body: activity.action, linkPath: "/today" }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:ops@agrova.app"
  if (!supabaseUrl || !serviceKey || !anonKey) return json({ error: "server_misconfigured" }, 500)
  if (!vapidPublic || !vapidPrivate) return json({ error: "vapid_not_configured" }, 503)

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const authz = req.headers.get("Authorization")
  if (!authz) return json({ error: "unauthorized" }, 401)

  const supaUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authz } } })
  const { data: userRes, error: uErr } = await supaUser.auth.getUser()
  if (uErr || !userRes.user) return json({ error: "unauthorized" }, 401)

  const admin = createClient(supabaseUrl, serviceKey)
  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: "invalid_json" }, 400)
  }
  const activityLogId = typeof body.activityLogId === "string" ? body.activityLogId : ""
  if (!activityLogId) return json({ error: "activity_log_id_required" }, 400)

  const { data: me, error: meErr } = await admin
    .from("people")
    .select("id, role, notification_prefs")
    .eq("auth_user_id", userRes.user.id)
    .maybeSingle()
  if (meErr || !me) {
    fanoutLog("person not found or db error", { meErr: meErr?.message })
    return json({ error: "person_not_found" }, 403)
  }

  const { data: act, error: aErr } = await admin
    .from("activity_log")
    .select("id, actor_id, action, subject_type, subject_id, payload")
    .eq("id", activityLogId)
    .maybeSingle()
  if (aErr || !act) {
    fanoutLog("activity row missing", { aErr: aErr?.message, activityLogId })
    return json({ error: "activity_not_found" }, 404)
  }

  let taskRow = null
  if (act.subject_type === "task") {
    const { data: tr } = await admin.from("tasks").select("id, assignee_id").eq("id", act.subject_id).maybeSingle()
    taskRow = tr
  }

  const isOwner = me.role === "OWNER"
  const isActor = me.id === act.actor_id
  if (!isOwner && !isActor) {
    fanoutLog("forbidden: caller is not owner and not actor", {
      meId: me.id,
      actorId: act.actor_id,
      action: act.action,
    })
    return json({ error: "forbidden" }, 403)
  }

  fanoutLog("fanout", { activityLogId, action: act.action, actorId: act.actor_id, caller: me.id, role: me.role })

  const { data: owners, error: oErr } = await admin.from("people").select("id, notification_prefs").eq("role", "OWNER")
  if (oErr) return json({ error: oErr.message }, 500)
  const ownerRows = owners ?? []
  if (ownerRows.length === 0) {
    fanoutLog("no owner rows; skipping")
  }

  const actForR = {
    actor_id: act.actor_id,
    action: act.action,
    subject_type: act.subject_type,
    subject_id: act.subject_id,
    payload: act.payload && typeof act.payload === "object" && !Array.isArray(act.payload) ? act.payload : null,
  }
  const taskForR = taskRow && taskRow.assignee_id ? { assignee_id: taskRow.assignee_id } : null
  const recipientIds = resolveWebPushRecipientIds(actForR, taskForR, ownerRows)

  if (recipientIds.length === 0) {
    fanoutLog("no recipients; skipping", { activityLogId, action: act.action })
    return json({ ok: true, sent: 0, recipients: 0, reason: "no_recipients", function: "web-push-fanout" })
  }

  const { data: recPeople, error: rpErr } = await admin
    .from("people")
    .select("id, notification_prefs")
    .in("id", recipientIds)
  if (rpErr) return json({ error: rpErr.message }, 500)
  const peopleById = new Map((recPeople ?? []).map((p) => [p.id, p]))
  if (peopleById.size !== recipientIds.length) {
    fanoutLog("some recipient ids not found; continuing with partial", { activityLogId, expected: recipientIds.length, found: peopleById.size })
  }

  const isIssueKpi = act.action === "issue.reported"
  const { title, body: msgBody, linkPath } = buildMessage(act)
  const pushPayload = { title, body: msgBody, data: { url: linkPath, activityLogId: act.id, action: act.action } }
  let sent = 0
  const notified: string[] = []

  for (const rid of recipientIds) {
    const pRow = peopleById.get(rid)
    if (!pRow) continue
    if (!isIssueKpi && readMutedActions(pRow.notification_prefs).includes(act.action)) continue

    const { error: nInsErr } = await admin.from("notifications").insert({ recipient_id: pRow.id, activity_log_id: act.id })
    if (nInsErr) {
      if (nInsErr.code === "23505") continue
      return json({ error: nInsErr.message }, 500)
    }
    notified.push(pRow.id)

    const { data: subs, error: sErr } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("person_id", pRow.id)
    if (sErr) return json({ error: sErr.message }, 500)
    for (const s of subs ?? []) {
      try {
        const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
        await webpush.sendNotification(sub, JSON.stringify(pushPayload))
        sent += 1
      } catch (e) {
        fanoutLog("webpush send failed", { personId: pRow.id, err: String(e), statusCode: e?.statusCode })
        const code = e?.statusCode
        if (code === 410) {
          await admin.from("push_subscriptions").delete().eq("person_id", pRow.id).eq("endpoint", s.endpoint)
        }
      }
    }
  }
  fanoutLog("response", { sent, activityLogId, action: act.action, notified: notified.length })
  return json({ ok: true, sent, recipients: notified.length, function: "web-push-fanout" })
})
