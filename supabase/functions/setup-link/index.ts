import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// M0-17 placeholder. MVP: no SMS or WhatsApp — owner shares a setup URL manually (M1-04). Token claim + auth wiring in M3-02+.

Deno.serve(() =>
  new Response(
    JSON.stringify({
      ok: true,
      placeholder: true,
      function: 'setup-link',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    },
  ),
)
