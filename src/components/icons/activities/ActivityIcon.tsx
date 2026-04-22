/* eslint-disable lingui/no-unlocalized-strings -- SVG path data, Tailwind classes, and geometry tokens */
import type { ActivityId } from '@/features/tasks/activities'

type Props = {
  id: ActivityId
  className?: string
  'aria-hidden'?: boolean
}

/** Custom 32×32-style activity glyphs (1.75px stroke, monoline) — see DESIGN.md §9 */
export function ActivityIcon({ id, className, 'aria-hidden': ariaHidden = true }: Props) {
  const base = 'shrink-0 text-orchard-600 dark:text-orchard-400'
  const c = className ? `${base} ${className}` : base
  switch (id) {
    case 'budama':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M8 20c4-6 8-6 12 0M10 10l6 10M16 6l2 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'ilaclama':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M10 22h8l2-4H8l2 4zM14 6v8M12 10h4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'sulama':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M16 6s6 6 6 12a6 6 0 1 1-12 0c0-6 6-12 6-12z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'gubreleme':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M10 20h12v4H10v-4zM12 20V12l4-4 4 4v8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'seyreltme':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M10 20h12M12 20c2-4 4-4 6 0M18 20c2-4 4-4 6 0M14 8v4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'hasat':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M8 20h10l2-2-6-6-6 6zM18 8l2 2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'capalama':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M6 20h20M8 20l4-8h8l4 8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'dikim':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M16 6v10M10 20h12M12 20v4M20 20v4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'asilama':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M8 20c4-6 8-2 8 0M16 8v6M20 8l-4 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'gozlem':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M22 22l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )
    case 'don_koruma':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M10 8l2 2M8 20h10l4-8H12l-2 4zM18 6l-2 2"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'bicme':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M6 20h20M8 20c0-4 3-6 4-6h8c1 0 4 2 4 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'nakliye':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <path
            d="M6 18h10v-4H6v4zM16 16h4l3 3v3h-7M8 20h.5M20 20h.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'diger':
      return (
        <svg className={c} width={32} height={32} viewBox="0 0 32 32" fill="none" aria-hidden={ariaHidden}>
          <rect x="8" y="8" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 12h8M12 16h5M12 20h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      )
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}
