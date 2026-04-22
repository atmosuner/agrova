# shadcn/ui init (non-interactive)

The CLI is interactive in a TTY. For agents and CI, call it with explicit flags so it never blocks on prompts.

**Recommended (defaults + Radix, Nova / New York–style stack):**

```bash
pnpm dlx shadcn@latest init -y --defaults --base-color neutral
```

- `-y` / `--yes` — skip confirmation
- `--defaults` — use the default template stack (Vite + React; preset aligns with current shadcn defaults, often **Nova** + **Radix** primitives)
- `--base-color neutral` — avoids a known edge case where `--defaults` alone can fail validation on `tailwind` in some versions

If `--defaults` errors, fall back to fully explicit init (see [shadcn CLI docs](https://ui.shadcn.com/docs/cli)) after Tailwind is installed in M0-03.

**Do not** run `shadcn init` without these flags in automation — it will block on style/preset questions.

Add components non-interactively later:

```bash
pnpm dlx shadcn@latest add button -y
```
