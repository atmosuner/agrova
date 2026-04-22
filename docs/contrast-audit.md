# Contrast audit (M8-02)

Targets from the spec: primary worker CTAs should meet **AAA 7:1** against their background; owner UI follows **DESIGN.md** tokens.

| Token / pair | Notes (informational) |
|---|---|
| `orchard-500` on `canvas` / white | Used for primary owner + worker actions. If a future measurement is &lt; 7:1 on a specific device theme, prefer `orchard-700` for the text or button fill on that variant. |
| `harvest-500` | Used for warnings; verify with real content. |

This file is **not** a substitute for automated contrast testing in CI or a design sign-off.
