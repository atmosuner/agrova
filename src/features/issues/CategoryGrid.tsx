import { msg } from '@lingui/macro'
import { IssueCategoryIcon } from '@/components/icons/issues/IssueCategoryIcon'
import { ISSUE_CATEGORY_ORDER, type IssueCategory } from '@/features/issues/categories'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { MessageDescriptor } from '@lingui/core'

const LABEL: Record<IssueCategory, MessageDescriptor> = {
  PEST: msg`Zararlı / hastalık`,
  EQUIPMENT: msg`Bozuk alet`,
  INJURY: msg`Yaralanma`,
  IRRIGATION: msg`Sulama sorunu`,
  WEATHER: msg`Hava hasarı`,
  THEFT: msg`Hırsızlık`,
  SUPPLY: msg`Eksik malzeme`,
}

type Props = {
  onSelectCategory: (category: IssueCategory) => void
  disabled?: boolean
}

export function CategoryGrid({ onSelectCategory, disabled }: Props) {
  const firstRow = ISSUE_CATEGORY_ORDER.slice(0, 4)
  const secondRow = ISSUE_CATEGORY_ORDER.slice(4, 6)
  const last = ISSUE_CATEGORY_ORDER[6]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {firstRow.map((cat) => (
          <button
            key={cat}
            type="button"
            disabled={disabled}
            onClick={() => onSelectCategory(cat)}
            className={cn(
              'flex min-h-14 min-w-14 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-0 p-4 text-center shadow-sm transition active:scale-[0.99] disabled:opacity-50',
            )}
          >
            <IssueCategoryIcon category={cat} className="h-14 w-14 text-orchard-600" />
            <span className="text-sm font-medium leading-tight text-fg">{i18n._(LABEL[cat])}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {secondRow.map((cat) => (
          <button
            key={cat}
            type="button"
            disabled={disabled}
            onClick={() => onSelectCategory(cat)}
            className={cn(
              'flex min-h-14 min-w-14 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-0 p-4 text-center shadow-sm transition active:scale-[0.99] disabled:opacity-50',
            )}
          >
            <IssueCategoryIcon category={cat} className="h-14 w-14 text-orchard-600" />
            <span className="text-sm font-medium leading-tight text-fg">{i18n._(LABEL[cat])}</span>
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectCategory(last!)}
          className={cn(
            'flex min-h-14 w-[calc(50%-0.5rem)] min-w-14 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-0 p-4 text-center shadow-sm transition active:scale-[0.99] disabled:opacity-50',
          )}
        >
          <IssueCategoryIcon category={last!} className="h-14 w-14 text-orchard-600" />
          <span className="text-sm font-medium leading-tight text-fg">{i18n._(LABEL[last!])}</span>
        </button>
      </div>
    </div>
  )
}
