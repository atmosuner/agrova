# Agrova — Design System

> A hybrid of Linear's precision and Wise's warm green, tuned for outdoor use, low-literacy workers, and a data-dense owner dashboard.
>
> This file is the single source of truth for UI work. Any AI coding agent building UI for Agrova reads this first.

---

## 1. Visual Theme & Atmosphere

Agrova is a practical tool for a working orchard. The design inherits Linear's discipline (clean lines, precise typography, generous spacing, no decoration) and Wise's warmth (fresh green accent, rounded geometry, friendly scale animations) — but applied to two very different surfaces:

- **Worker PWA (mobile):** spacious, high-contrast, icon-led, readable in direct sunlight, one-handed, gloves-friendly. Think "farm dashboard in a glove compartment".
- **Owner dashboard (web):** information-dense but calm, classic SaaS sidebar + content layout, keyboard-first (Cmd+K), optimized for scanning a lot of fields quickly.

Both surfaces share the same design tokens. The **adaptive density** rule governs how they differ: worker screens get 2× the whitespace and 1.5× the type size the owner gets.

**Key characteristics:**
- Orchard Green (`#3F8B4E`) as the only chromatic accent — trust, growth, agriculture
- Warm off-white canvas in light mode (`#FAFAF7`), deep slate in dark mode (`#0C1210`)
- Inter Variable for everything, with OpenType `"cv11","ss01"` (for cleaner Turkish diacritics on ş ç ğ ı İ ö ü)
- Three-tier weight system: 400 / 500 / 600 — no bold, no extra-bold
- Pill buttons (9999px radius) for primary CTAs on mobile — big, tappable, friendly
- 8px radius standard on cards, 12px on featured cards, 9999px on CTAs
- Scale animations on primary buttons (`scale(1.02)` hover, `scale(0.97)` active) — subtle, not Wise's theatrical 1.05
- Lucide icons everywhere, plus a custom activity-icon set (prune/spray/water/…)
- Satellite-first map aesthetic (ESRI World Imagery)
- No drop shadows — use surface luminance steps and hairline borders for depth

---

## 2. Color Palette & Roles

### Light Mode (default)

| Token | Hex | Usage |
|---|---|---|
| `canvas` | `#FAFAF7` | Page background (warm off-white) |
| `surface-0` | `#FFFFFF` | Primary card/panel background |
| `surface-1` | `#F5F5F0` | Secondary surface (hover, nested cards) |
| `surface-2` | `#EDEDE6` | Elevated container |
| `border-subtle` | `#E5E5DE` | Hairline borders (default) |
| `border-strong` | `#D1D1C7` | Emphasized borders |
| `text-primary` | `#0C1210` | Body & heading text |
| `text-secondary` | `#4F5B54` | Secondary text, descriptions |
| `text-muted` | `#7C897F` | Metadata, placeholders |
| `text-faint` | `#A8B0A3` | Timestamps, disabled labels |
| `orchard-50` | `#F2FBF4` | Tint backgrounds for success states |
| `orchard-500` | `#3F8B4E` | **Primary brand** — CTA bg, active nav, links |
| `orchard-700` | `#2D6A3A` | Hover / pressed on primary |
| `orchard-900` | `#1A4023` | Text on green backgrounds (e.g., CTA label) |
| `harvest-500` | `#E8A84A` | Warm accent — sparingly, for highlights/warnings-as-info |
| `status-todo` | `#64748B` | To Do chip |
| `status-progress` | `#D97706` | In Progress chip |
| `status-done` | `#16A34A` | Done chip |
| `status-blocked` | `#DC2626` | Blocked / Issue chip |
| `status-cancelled` | `#94A3B8` | Cancelled (struck-through) |

### Dark Mode (system preference or manual toggle)

| Token | Hex | Usage |
|---|---|---|
| `canvas` | `#0C1210` | Page background (deep slate, green undertone) |
| `surface-0` | `#141B18` | Primary card/panel |
| `surface-1` | `#1B2420` | Secondary surface |
| `surface-2` | `#232D28` | Elevated container |
| `border-subtle` | `rgba(255,255,255,0.06)` | Hairline borders |
| `border-strong` | `rgba(255,255,255,0.10)` | Emphasized borders |
| `text-primary` | `#F0F3F0` | Primary text (not pure white — warmer) |
| `text-secondary` | `#C5CEC8` | Secondary text |
| `text-muted` | `#8FA094` | Metadata |
| `text-faint` | `#5E6E63` | Timestamps |
| `orchard-500` | `#5FB871` | Primary brand (brighter in dark) |
| `orchard-700` | `#3F8B4E` | Hover / pressed |
| `harvest-500` | `#F2BA63` | Warm accent |
| `status-*` | same semantic hues, adjusted to ~90% luminance | Status chips |

### Rules
- `orchard-500` is the only chromatic color in UI chrome. Everything else is neutral or semantic.
- `harvest-500` is reserved for highlights, info banners, or celebratory states. Never on a primary CTA.
- Semantic status colors appear only in status pills, never as general accents.
- Never pure black (`#000`) or pure white (`#FFF`) on a text surface — always the tokens above.

---

## 3. Typography

### Font families
- **UI / body:** `Inter Variable` → fallback `-apple-system, Segoe UI, Roboto, sans-serif`
- **Mono (for IDs, codes, data tables):** `JetBrains Mono Variable` → fallback `ui-monospace, Menlo`
- **OpenType features (apply globally):** `"cv11","ss01","calt"`
  - `cv11` — single-story `a` for geometric cleanliness
  - `ss01` — improved Turkish diacritic spacing on ş ç ğ
  - `calt` — contextual alternates

### Weights
Three weights only: **400** (read), **500** (emphasis / UI), **600** (strong emphasis).
Never 700+. Never 300.

### Hierarchy

| Role | Size | Weight | Line-height | Tracking | Notes |
|---|---|---|---|---|---|
| Display | 40px | 600 | 1.05 | -0.8px | Dashboard page titles |
| H1 | 32px | 600 | 1.15 | -0.4px | Section headings |
| H2 | 24px | 600 | 1.25 | -0.2px | Card titles, modal headers |
| H3 | 18px | 600 | 1.35 | -0.1px | Sub-sections |
| Body Large | 18px | 400 | 1.55 | normal | Primary reading on worker screens |
| Body | 16px | 400 | 1.55 | normal | Primary reading on owner screens |
| Body Emphasis | 16px | 500 | 1.55 | normal | Labels, navigation |
| Small | 14px | 400 | 1.5 | normal | Metadata, help text |
| Caption | 12px | 500 | 1.4 | normal | Status chips, timestamps |
| Micro | 11px | 500 | 1.4 | 0.4px | Section labels (ALL CAPS) |

**Worker screens bump up one tier:** base body is 18px; primary CTA labels are 20px / 600.

### Turkish-specific
Inter handles Turkish (ş ç ğ ı İ ö ü) well with `ss01` enabled. Test all headlines for İ (capital dotted I) and ğ tracking. The dotless ı is a trap — make sure "Çiftlik" vs "Ciftlik" renders correctly.

---

## 4. Components

### Buttons

**Primary CTA (Worker mobile, pill)**
- Background: `orchard-500`
- Text: `#FFFFFF`, 20px, weight 600
- Height: **72px** (gloves-friendly)
- Padding: 24px horizontal
- Radius: 9999px
- Hover: `scale(1.02)` + `orchard-700` bg
- Active: `scale(0.97)`
- Haptic feedback (`navigator.vibrate(10)`) on press where supported
- Minimum width: full container width on mobile

**Primary CTA (Owner web, rounded rectangle)**
- Background: `orchard-500`
- Text: `#FFFFFF`, 14px, weight 500
- Height: 36px
- Padding: 8px 16px
- Radius: 8px
- Hover: `orchard-700` bg
- Focus: 2px `orchard-500` ring with 2px offset

**Secondary (both surfaces)**
- Background: `surface-0`
- Text: `text-primary`, same size as primary
- Border: `1px solid border-strong`
- Radius: matches primary (pill on worker, 8px on owner)

**Ghost / Tertiary**
- Background: transparent
- Text: `text-secondary`
- Hover: `surface-1` bg

**Destructive**
- Background: transparent
- Text: `status-blocked`
- Hover: `status-blocked` at 8% opacity bg

### Cards

| Variant | Radius | Border | Padding |
|---|---|---|---|
| Worker task card | 20px | `1px solid border-subtle` | 20px |
| Owner list card | 12px | `1px solid border-subtle` | 16px |
| Owner dashboard tile | 12px | `1px solid border-subtle` | 20px |
| Modal / dialog | 16px | `1px solid border-subtle` | 24px |

Never use drop shadows on cards. Use `border-subtle` for default elevation; swap to `border-strong` on hover for interactive cards.

### Status chips

- Radius: 9999px (pill)
- Padding: 4px 10px
- Font: 12px / 500
- Background: status color at 12% opacity
- Text: status color at 100%
- Border: `1px solid` status color at 20% opacity
- Always accompanied by a 6px dot of the solid status color on the left

Example (ToDo): bg `rgba(100,116,139,0.12)`, text `#64748B`, border `rgba(100,116,139,0.20)`.

### Inputs

- Background: `surface-0`
- Border: `1px solid border-strong`
- Radius: 8px
- Padding: 10px 12px (owner) / 16px 16px (worker, if ever used)
- Focus: border shifts to `orchard-500` + 3px `orchard-500` at 15% opacity outer ring
- Placeholder: `text-muted`
- **Worker screens avoid text inputs entirely** — prefer pickers, numpads, voice, or photo.

### Activity icons (custom set)

Each farming activity has a dedicated 32×32px SVG icon in a consistent line-weight style (1.75px stroke, rounded caps, monoline). The core set:

`prune` (pruning shears) · `spray` (spray nozzle) · `water` (water drop + soil) · `fertilize` (bag) · `thin` (hand + bud) · `harvest` (basket with fruit) · `weed` (hoe) · `plant` (seedling) · `graft` (grafted stem) · `scout` (magnifier over leaf) · `frost` (snowflake + tree) · `mow` (mower) · `transport` (truck) · `other` (generic task icon)

Icons live in `apps/web/src/components/icons/activities/`. Matching illustrated 96×96 versions exist for worker task cards — same silhouettes, filled, with the harvest-500 or orchard-500 tint depending on activity category.

---

## 5. Layout

### Spacing scale (base 4px)
`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`

### Adaptive density
- **Worker screens:** spacing step up by one. Where owner uses 16px, worker uses 24px. Where owner uses 12px card padding, worker uses 20px.
- **Minimum touch target:** 72px on worker primary actions, 56px everywhere else interactive.

### Worker mobile layout
- Single column, full-width.
- Bottom tab bar: Tasks / History / Profile — 72px height, icons 28px, labels 12px, orchard-500 for active.
- Top bar: page title 18px / 600, sync status indicator on the right.
- Content area: 16px lateral padding, cards stacked with 12px gap.
- A persistent **offline banner** slides in from the top when the network drops (quiet, not blocking).

### Owner web layout
- Persistent left sidebar: 240px wide, collapsible to 64px (icon-only).
  - Logo at top
  - Navigation: Today / Fields / Tasks / Issues / Reports / Settings
  - User menu at bottom
- Top bar: 56px height, breadcrumb on left, Cmd+K search, notification bell, user avatar.
- Content: 1200px max-width centered in large viewports, 24px lateral padding below 1280px.

### Breakpoints
| Name | Range | Behavior |
|---|---|---|
| Mobile | ≤ 640px | Worker layout, single column, bottom tabs |
| Tablet | 641–1024px | Owner layout possible but sidebar collapsed to icons |
| Desktop | 1025–1440px | Full owner layout |
| Large | > 1440px | Owner layout with 1280px max content width |

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | `canvas` | Page background |
| 1 — Surface | `surface-0` + `1px solid border-subtle` | Default cards, inputs |
| 2 — Hover | `surface-1` + `1px solid border-strong` | Hover on interactive card |
| 3 — Elevated | `surface-1` + `1px solid border-strong` + 3px ring `rgba(12,18,16,0.04)` | Popovers, menus |
| 4 — Modal | `surface-0` + backdrop `rgba(12,18,16,0.55)` | Dialogs |

No drop shadows. Depth comes from surface steps + hairline borders. Matches Linear's philosophy without the dark-mode-only execution.

---

## 7. Motion

- Default duration: **150ms** for state changes (hover, active, focus)
- Page transitions: **250ms** fade
- Button press: `scale(1.02)` hover, `scale(0.97)` active — no color change beyond the bg swap
- Task completion confirmation: 300ms scale-up of a ✓ glyph, then fade
- Route changes on worker: no animation (avoid motion sickness, respect reduced-motion)
- Easing: `cubic-bezier(0.2, 0, 0, 1)` (ease-out-expo-ish) for enter, `cubic-bezier(0.4, 0, 1, 1)` for exit
- Always respect `prefers-reduced-motion: reduce` — collapse animations to 0ms

---

## 8. Accessibility Floor (non-negotiable)

Mandated by the spec:

- Minimum contrast: **WCAG AA** (4.5:1 text, 3:1 UI) everywhere; **AAA (7:1)** on worker primary actions
- Worker primary action buttons: **≥ 72px tall**, 100% of content width
- All other interactive elements: **≥ 56px** on mobile, ≥ 40px on desktop
- Worker screens: **base font ≥ 18px**
- Never require keyboard input on worker screens (numpad/picker/voice only)
- All primary actions reachable one-handed (bottom 2/3 of screen on mobile)
- Haptic feedback (`navigator.vibrate`) on Start/Done/Confirm where supported
- Every interactive element has a visible focus ring (2px `orchard-500` with 2px offset)
- All icons have `aria-label` in Turkish
- Forms announce errors via `aria-live="polite"`

---

## 9. Iconography

### Lucide for chrome
Use Lucide React for all UI chrome (nav, status bar, menus). Default stroke 1.75px. Size tiers: 16 / 20 / 24 / 28 / 32.

### Custom activity icons
Drawn in-house to match Lucide's line-weight and geometry. Lives in the codebase as React components (not font). Two modes per activity:
- **Monoline 24px** for chrome/inline use
- **Filled 96px** for worker task cards (with bg circle in `orchard-50` or `harvest-500` at 20% opacity)

### No emojis in UI chrome
Emojis are OK inside user-generated content (issue descriptions from the rare free-text field), but never in UI labels, nav, or buttons.

---

## 10. Do's and Don'ts

### Do
- Use Inter Variable with `"cv11","ss01","calt"` globally
- Use three weights only: 400, 500, 600
- Let worker screens breathe — double the padding, bigger type, larger touch targets
- Use Orchard Green sparingly and only for primary action or active state
- Use status colors only in status pills, never as accents elsewhere
- Render every interactive element with a visible focus ring
- Test Turkish diacritics (ş ç ğ ı İ ö ü) at every type size before shipping
- Respect `prefers-reduced-motion` and `prefers-color-scheme`

### Don't
- Don't use drop shadows for elevation — use surface steps + borders
- Don't use weight 700+ — the max is 600
- Don't use pure black or pure white — always the tokens
- Don't put text inputs on worker screens unless absolutely necessary
- Don't use emoji in UI chrome
- Don't decorate — if it doesn't help the user complete a task or understand state, remove it
- Don't animate route changes on worker mobile
- Don't place primary actions above the fold-center on mobile (thumb-reach)

---

## 11. Quick reference for AI agents building UI

```tsx
// Primary worker CTA
<button className="
  w-full h-[72px] rounded-full px-6
  bg-orchard-500 hover:bg-orchard-700 active:scale-[0.97]
  text-white text-xl font-semibold
  transition-all duration-150
  focus-visible:ring-2 focus-visible:ring-orchard-500 focus-visible:ring-offset-2
">
  Bitir
</button>

// Owner dashboard tile
<div className="
  rounded-xl border border-neutral-200 bg-white p-5
  hover:border-neutral-300 transition-colors
">
  <h3 className="text-lg font-semibold text-neutral-900 tracking-tight">
    Bugün Açık Görevler
  </h3>
  <p className="mt-1 text-4xl font-semibold tabular-nums">47</p>
  <p className="mt-2 text-sm text-neutral-500">12 tarlada dağılmış</p>
</div>

// Status chip (Done)
<span className="
  inline-flex items-center gap-1.5 rounded-full
  border border-[rgb(22,163,74,.2)] bg-[rgb(22,163,74,.12)]
  px-2.5 py-1 text-xs font-medium text-[#16A34A]
">
  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
  Bitti
</span>
```

---

*This design system is a living document. Update it when decisions change.*
