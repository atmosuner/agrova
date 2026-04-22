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

  let body: { token?: string }
  try {
    body = (await req.json()) as { token?: string }
  } catch {
    return json({ error: "invalid_json" }, 400)
  }
  const token = typeof body.token === "string" ? body.token.trim() : ""
  if (!token) {
    return json({ error: "token_required" }, 400)
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: peopleRow, error: pErr } = await admin
    .from("people")
    .select("id, full_name, phone, role, active, auth_user_id, setup_token, setup_token_expires_at")
    .eq("setup_token", token)
    .maybeSingle()

  if (pErr) {
    console.error("people lookup", pErr)
    return json({ error: "lookup_failed" }, 500)
  }
  if (!peopleRow) {
    return json({ error: "invalid_or_expired_token" }, 404)
  }
  if (peopleRow.role === "OWNER") {
    return json({ error: "owner_cannot_claim_setup" }, 403)
  }
  if (peopleRow.active === false) {
    return json({ error: "person_inactive" }, 403)
  }
  const exp = peopleRow.setup_token_expires_at
  if (exp) {
    const t = new Date(exp).getTime()
    if (t < Date.now()) {
      return json({ error: "token_expired" }, 400)
    }
  }

  const email = `w${(peopleRow.id as string).replace(/-/g, "")}@device.agrova.app`
  const sessionClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Pre-provisioned: owner added person via create-team-person (auth already exists) — issue one-time session.
  if (peopleRow.auth_user_id) {
    const password = randomPassword()
    const { error: upErr } = await admin.auth.admin.updateUserById(peopleRow.auth_user_id as string, { password: password })
    if (upErr) {
      console.error("updateUser (pairing)", upErr)
      return json({ error: "create_user_failed", message: upErr.message }, 500)
    }
    const { data: sessionData, error: sErr } = await sessionClient.auth.signInWithPassword({ email, password })
    if (sErr || !sessionData.session) {
      console.error("signIn (pairing)", sErr)
      return json({ error: "session_failed" }, 500)
    }
    const { error: clearErr } = await admin
      .from("people")
      .update({ setup_token: null, setup_token_expires_at: null })
      .eq("id", peopleRow.id)
    if (clearErr) {
      console.error("clear setup token (pairing)", clearErr)
    }
    return json({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_in: sessionData.session.expires_in,
      expires_at: sessionData.session.expires_at,
      token_type: sessionData.session.token_type,
      user: sessionData.user,
    })
  }

  // Legacy: people row had no auth yet (create user + link).
  const password = randomPassword()
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { person_id: peopleRow.id, full_name: peopleRow.full_name, phone: peopleRow.phone },
  })
  if (cErr || !created.user) {
    console.error("createUser", cErr)
    return json({ error: "create_user_failed", message: cErr?.message }, 500)
  }

  const { error: uErr } = await admin
    .from("people")
    .update({ auth_user_id: created.user.id, setup_token: null, setup_token_expires_at: null })
    .eq("id", peopleRow.id)
  if (uErr) {
    console.error("people update", uErr)
    return json({ error: "link_person_failed" }, 500)
  }

  const { data: sessionData, error: sErr } = await sessionClient.auth.signInWithPassword({ email, password })
  if (sErr || !sessionData.session) {
    console.error("signIn", sErr)
    return json({ error: "session_failed" }, 500)
  }

  return json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    expires_in: sessionData.session.expires_in,
    expires_at: sessionData.session.expires_at,
    token_type: sessionData.session.token_type,
    user: sessionData.user,
  })
})
