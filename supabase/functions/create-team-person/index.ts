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

function randomPassword(): string {
  const a = new Uint8Array(32)
  globalThis.crypto.getRandomValues(a)
  const s = btoa(String.fromCharCode(...a))
  return s.replaceAll("+", "X").replaceAll("/", "y") + "Aa1"
}

function generateUrlSafeToken32(): string {
  const bytes = new Uint8Array(24)
  globalThis.crypto.getRandomValues(bytes)
  const s = btoa(String.fromCharCode(...bytes))
  return s.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

function isCrewRole(r: string): r is "FOREMAN" | "AGRONOMIST" | "WORKER" {
  return r === "FOREMAN" || r === "AGRONOMIST" || r === "WORKER"
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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: "server_misconfigured" }, 500)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: authErr,
  } = await userClient.auth.getUser()
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

  let body: { fullName?: unknown; phone?: unknown; role?: unknown }
  try {
    body = (await req.json()) as { fullName?: unknown; phone?: unknown; role?: unknown }
  } catch {
    return json({ error: "invalid_json" }, 400)
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""
  const roleRaw = typeof body.role === "string" ? body.role : ""
  if (!fullName) {
    return json({ error: "validation_failed", field: "fullName" }, 400)
  }
  if (!/^\+905[0-9]{9}$/.test(phone)) {
    return json({ error: "validation_failed", field: "phone" }, 400)
  }
  if (!isCrewRole(roleRaw)) {
    return json({ error: "validation_failed", field: "role" }, 400)
  }

  const { data: inserted, error: insErr } = await admin
    .from("people")
    .insert({
      full_name: fullName,
      phone,
      role: roleRaw,
      active: true,
      notification_prefs: {},
    })
    .select("id")
    .single()

  if (insErr) {
    if (insErr.code === "23505") {
      return json({ error: "phone_in_use" }, 409)
    }
    console.error("people insert", insErr)
    return json({ error: "insert_failed" }, 500)
  }

  const personId = inserted.id as string
  const email = `w${personId.replace(/-/g, "")}@device.agrova.app`
  const password = randomPassword()

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { person_id: personId, full_name: fullName, phone },
  })

  if (cErr || !created.user) {
    console.error("createUser", cErr)
    await admin.from("people").delete().eq("id", personId)
    return json({ error: "create_user_failed", message: cErr?.message }, 500)
  }

  const token = generateUrlSafeToken32()
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: linkErr } = await admin
    .from("people")
    .update({
      auth_user_id: created.user.id,
      setup_token: token,
      setup_token_expires_at: expires,
    })
    .eq("id", personId)

  if (linkErr) {
    console.error("people link", linkErr)
    try {
      await admin.auth.admin.deleteUser(created.user.id)
    } catch {
      // ignore
    }
    await admin.from("people").delete().eq("id", personId)
    return json({ error: "link_person_failed" }, 500)
  }

  return json({ personId, setupToken: token })
})
