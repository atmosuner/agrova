import { cn } from '@/lib/utils'

/**
 * Agrova brand mark — a green rounded square with a white sprout/dial glyph.
 * Sized via the `size` prop; defaults to 52px (mobile auth) per DESIGN spec.
 */
export function AgrovaLogoMark({
  size = 52,
  radius,
  className,
  glyphSize,
}: {
  size?: number
  radius?: number
  glyphSize?: number
  className?: string
}) {
  const r = radius ?? Math.round(size * 0.31)
  const g = glyphSize ?? Math.round(size * 0.54)
  return (
    <span
      aria-hidden
      className={cn('inline-flex items-center justify-center bg-orchard-500 text-white', className)}
      style={{ width: size, height: size, borderRadius: r }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={g}
        height={g}
      >
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 6v6l4 2" />
        <path d="M22 2 12 12" />
      </svg>
    </span>
  )
}
