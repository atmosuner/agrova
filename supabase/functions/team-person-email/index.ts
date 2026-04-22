// Deploy with `--no-verify-jwt` (ES256 user JWT + hosted gateway; same as set-worker-password).
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1?target=deno&no-check"

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors },
  })
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: "server_misconfigured" }, 500)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized", reason: "no_bearer" }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) {
    return json({ error: "unauthorized" }, 401)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: actor, error: actorErr } = await admin
    .from("people")
    .select("id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle()
  if (actorErr || !actor || actor.role !== "OWNER") {
    return json({ error: "forbidden" }, 403)
  }

  type Body = { op?: unknown; personId?: unknown; email?: unknown }
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: "invalid_json" }, 400)
  }

  const op = typeof body.op === "string" ? body.op : ""
  const personId = typeof body.personId === "string" ? body.personId.trim() : ""
  if (!personId) {
    return json({ error: "validation_failed", field: "personId" }, 400)
  }
  if (op !== "get" && op !== "set") {
    return json({ error: "validation_failed", field: "op" }, 400)
  }

  const { data: target, error: tErr } = await admin
    .from("people")
    .select("id, role, auth_user_id")
    .eq("id", personId)
    .maybeSingle()

  if (tErr || !target) {
    return json({ error: "not_found" }, 404)
  }
  if (target.role === "OWNER" || !target.auth_user_id) {
    return json({ error: "forbidden" }, 403)
  }

  if (op === "get") {
    const { data: authUser, error: guErr } = await admin.auth.admin.getUserById(
      target.auth_user_id as string,
    )
    if (guErr || !authUser.user) {
      console.error("[team-person-email] getUserById", guErr)
      return json({ error: "get_failed" }, 500)
    }
    return json({ email: authUser.user.email ?? "" })
  }

  const rawEmail = typeof body.email === "string" ? body.email.trim() : ""
  if (!rawEmail || rawEmail.length > 320 || !emailRe.test(rawEmail)) {
    return json({ error: "validation_failed", field: "email" }, 400)
  }

  const { data: upd, error: uErr } = await admin.auth.admin.updateUserById(
    target.auth_user_id as string,
    { email: rawEmail, email_confirm: true },
  )
  if (uErr) {
    const msg = uErr.message ?? ""
    if (/already (been )?registered|already exists|duplicate/i.test(msg)) {
      return json({ error: "email_taken", message: msg }, 409)
    }
    console.error("[team-person-email] updateUserById", uErr)
    return json({ error: "update_failed", message: uErr.message }, 500)
  }
  if (!upd.user) {
    return json({ error: "update_failed" }, 500)
  }
  return json({ ok: true, email: upd.user.email })
})
