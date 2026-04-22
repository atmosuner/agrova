// @ts-nocheck — Deno edge: full DB export (owner)
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1?target=deno&no-check"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...cors },
    })
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } })
  }
  const authz = req.headers.get("Authorization")
  if (!authz) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } })
  }
  const u = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authz } } })
  const { data: userRes, error: uErr } = await u.auth.getUser()
  if (uErr || !userRes.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } })
  }
  const admin = createClient(supabaseUrl, serviceKey)
  const { data: me, error: meErr } = await admin
    .from("people")
    .select("id, role")
    .eq("auth_user_id", userRes.user.id)
    .maybeSingle()
  if (meErr || !me || me.role !== "OWNER") {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } })
  }
  const [
    { data: people, error: e0 },
    { data: fields, error: e1 },
    { data: equipment, error: e2 },
    { data: tasks, error: e3 },
    { data: taskEquipment, error: e4 },
    { data: issues, error: e5 },
    { data: chem, error: e6 },
    { data: act, error: e7 },
  ] = await Promise.all([
    admin.from("people").select("*").order("created_at"),
    admin.from("fields").select("*").order("name"),
    admin.from("equipment").select("*").order("name"),
    admin.from("tasks").select("*").order("created_at", { ascending: false }).limit(5000),
    admin.from("task_equipment").select("*").limit(10_000),
    admin.from("issues").select("*").order("created_at", { ascending: false }).limit(5000),
    admin.from("chemical_applications").select("*").order("created_at", { ascending: false }).limit(10_000),
    admin.from("activity_log").select("*").order("created_at", { ascending: false }).limit(20_000),
  ])
  const err = e0 || e1 || e2 || e3 || e4 || e5 || e6 || e7
  if (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } })
  }
  const body = {
    exportedAt: new Date().toISOString(),
    operation: { people, fields, equipment, tasks, task_equipment: taskEquipment, issues, chemical_applications: chem, activity_log: act },
  }
  const json = JSON.stringify(body, null, 2)
  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="agrova-export.json"',
      "Cache-Control": "no-store",
      ...cors,
    },
  })
})
