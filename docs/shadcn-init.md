# shadcn/ui init (non-interactive)

The CLI is interactive in a TTY. For agents and CI, pass explicit flags that match the **Vite + React** stack in this repo.

**Working recipe (Vite, Radix, Nova preset):**

```bash
pnpm dlx shadcn@latest init -y --template vite -b radix -p nova
```

- `-y` — skip confirmation
- `--template vite` — **not** `--defaults` (that targets Next and would be wrong)
- `-b` / `--base radix` — Radix primitives
- `-p` / `--preset nova` — Nova (available presets: nova, vega, maia, …)

**Precondition:** the root `tsconfig.json` must include `compilerOptions.paths` for `@/*` → `./src/*` (the CLI validates the alias; project references in `tsconfig.app.json` alone are not enough).

The CLI may add `tw-animate-css`, `shadcn/tailwind.css` imports, and **Nova’s Geist** font. This project **removes** Geist in favor of **Inter** (`DESIGN.md`); the `@theme inline` font stack in `src/index.css` is pointed at **Inter Variable**, and shadcn semantic colors in `:root` are mapped to `--agrova-*` in the same file.

`--base-color` is **not** a valid flag in current CLI (use the preset you need).

**Add components (non-interactive):**

```bash
pnpm dlx shadcn@latest add button -y
```

`buttonVariants` lives in `src/components/ui/button-variants.ts` so `button.tsx` can export only the component and satisfy `react-refresh/only-export-components`.
