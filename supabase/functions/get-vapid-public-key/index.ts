import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } })
  }
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? ""
  if (!publicKey) {
    return new Response(
      JSON.stringify({ error: "vapid_not_configured" }),
      { status: 503, headers: { ...cors, "Content-Type": "application/json" } },
    )
  }
  return new Response(JSON.stringify({ publicKey, ok: true }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  })
})
