/* eslint-disable lingui/no-unlocalized-strings */
import { msg, t } from '@lingui/macro'
import { X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useEquipmentUsageQuery } from '@/features/equipment/useEquipmentUsage'
import { i18n } from '@/lib/i18n'
import { defaultTasksSearch } from '@/features/tasks/tasks-search'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/db'

type Props = {
  equipment: Pick<Tables<'equipment'>, 'id' | 'name' | 'category'>
  onClose: () => void
}

function formatTr(iso: string): string {
  if (!iso) {
    return '—'
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

export function EquipmentUsageSheet({ equipment, onClose }: Props) {
  const { data, isLoading, error } = useEquipmentUsageQuery(equipment.id)
  const baseSearch = defaultTasksSearch()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className={cn(
          'max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface-0 p-4 shadow-lg sm:rounded-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-medium text-fg">{equipment.name}</h2>
            <p className="text-xs text-fg-secondary">{i18n._(msg`Kullanım geçmişi`)}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={i18n._(msg`Kapat`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {data ? (
          <p className="text-sm text-fg-secondary">
            {i18n._(msg`Son 30 gün`)}: <strong className="text-fg">{data.countLast30}</strong> —{' '}
            {i18n._(msg`Tümü`)}: <strong className="text-fg">{data.countAll}</strong>
          </p>
        ) : null}

        {isLoading ? <p className="mt-3 text-sm text-fg-secondary">{t`Yükleniyor…`}</p> : null}
        {error ? (
          <p className="mt-2 text-sm text-harvest-500">{error instanceof Error ? error.message : String(error)}</p>
        ) : null}

        <ul className="mt-3 divide-y divide-orchard-100 text-sm">
          {(data?.rows ?? []).map((r) => (
            <li key={`${r.task_id}-${r.attached_at}`} className="py-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-fg">{r.field_name ?? '—'}</span>
                <span className="text-fg-faint text-xs">{formatTr(r.attached_at)}</span>
              </div>
              <p className="text-fg-secondary">
                {r.task_activity} · {r.task_due}
              </p>
              <p className="text-xs text-fg-secondary">
                {i18n._(msg`Ekleyen`)}: {r.attached_by_name ?? '—'}
              </p>
              <Link
                to="/tasks"
                search={{ ...baseSearch, task: r.task_id }}
                className="mt-1 inline-block text-orchard-600 text-sm underline"
                onClick={onClose}
              >
                {i18n._(msg`Görevi aç`)}
              </Link>
            </li>
          ))}
        </ul>
        {data && data.rows.length === 0 && !isLoading ? (
          <p className="mt-2 text-fg-secondary">{i18n._(msg`Bu ekipmanda henüz kullanım yok.`)}</p>
        ) : null}
      </div>
    </div>
  )
}
