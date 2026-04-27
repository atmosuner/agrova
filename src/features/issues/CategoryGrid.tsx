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
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {ISSUE_CATEGORY_ORDER.map((cat) => (
        <button
          key={cat}
          type="button"
          disabled={disabled}
          onClick={() => onSelectCategory(cat)}
          className={cn(
            'flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-0 p-3 text-center transition hover:border-orchard-500 hover:bg-orchard-50 active:scale-[0.99] disabled:opacity-50',
          )}
        >
          <IssueCategoryIcon category={cat} className="h-8 w-8" />
          <span className="text-[12px] font-medium leading-tight text-fg-secondary">{i18n._(LABEL[cat])}</span>
        </button>
      ))}
    </div>
  )
}
