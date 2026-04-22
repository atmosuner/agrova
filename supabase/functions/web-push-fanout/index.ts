import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// M0-17 placeholder. Real Web Push from activity_log lands in M6-03. MVP: notifications are Web Push only (no SMS/WhatsApp).

Deno.serve(() =>
  new Response(
    JSON.stringify({
      ok: true,
      placeholder: true,
      function: 'web-push-fanout',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    },
  ),
)
