/* eslint-disable lingui/no-unlocalized-strings */
import { msg } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { toggleTaskEquipmentAttachment } from '@/features/equipment/attach-equipment'
import { EQUIPMENT_TAB_ORDER, useActiveEquipmentQuery, type EquipmentListItem } from '@/features/equipment/useActiveEquipmentQuery'
import { i18n } from '@/lib/i18n'
import type { Enums } from '@/types/db'
import { cn } from '@/lib/utils'

const TAB_LABEL: Record<Enums<'equipment_category'>, ReturnType<typeof msg>> = {
  VEHICLE: msg`Araçlar`,
  TOOL: msg`Aletler`,
  CHEMICAL: msg`Kimyasallar`,
  CRATE: msg`Kasalar`,
}

type Props = {
  taskId: string
  /** Equipment IDs already on this task */
  attachedIds: Set<string>
  onClose: () => void
}

export function AttachSheetMobile({ taskId, attachedIds, onClose }: Props) {
  const { data: all, isLoading } = useActiveEquipmentQuery()
  const [tab, setTab] = useState<Enums<'equipment_category'>>('VEHICLE')
  const [local, setLocal] = useState<Set<string> | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const effective = local ?? attachedIds

  const byTab = useMemo(() => {
    const list = all ?? []
    return list.filter((e) => e.category === tab)
  }, [all, tab])

  async function onToggle(item: EquipmentListItem) {
    const was = effective.has(item.id)
    const next = !was
    setErr(null)
    setBusyId(item.id)
    setLocal((prev) => {
      const base = prev ?? new Set(attachedIds)
      const n = new Set(base)
      if (next) {
        n.add(item.id)
      } else {
        n.delete(item.id)
      }
      return n
    })
    try {
      await toggleTaskEquipmentAttachment({ taskId, equipmentId: item.id, nextAttached: next })
      await queryClient.invalidateQueries({ queryKey: ['task', taskId] })
      setLocal(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setLocal(null)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className={cn(
          'max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-surface-0 p-4 sm:rounded-2xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium text-fg">{i18n._(msg`Alet`)}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label={i18n._(msg`Kapat`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-fg-secondary">{i18n._(msg`Görevde kullandığınız araç ve aletleri işaretleyin.`)}</p>

        <div className="mt-3 flex flex-wrap gap-1 border-b border-orchard-200 pb-2">
          {EQUIPMENT_TAB_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              className={cn(
                'rounded-t px-2 py-1.5 text-xs font-medium',
                tab === cat ? 'bg-orchard-100 text-fg' : 'text-fg-secondary hover:bg-orchard-50/80',
              )}
              onClick={() => setTab(cat)}
            >
              {i18n._(TAB_LABEL[cat])}
            </button>
          ))}
        </div>

        {err ? <p className="mt-2 text-sm text-harvest-500">{err}</p> : null}
        {isLoading ? <p className="mt-3 text-sm text-fg-secondary">{i18n._(msg`Yükleniyor…`)}</p> : null}

        <ul className="mt-2 flex flex-col gap-1">
          {byTab.map((e) => {
            const on = effective.has(e.id)
            return (
              <li key={e.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface-1 px-3 py-3 text-left text-fg"
                  disabled={busyId === e.id}
                  onClick={() => void onToggle(e)}
                >
                  <span className="min-w-0 flex-1 truncate">{e.name}</span>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                      on ? 'border-orchard-500 bg-orchard-500 text-white' : 'border-orchard-200 text-fg-faint',
                    )}
                    aria-hidden
                  >
                    {on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {byTab.length === 0 && !isLoading ? (
          <p className="mt-2 text-sm text-fg-secondary">{i18n._(msg`Bu kategoride ekipman yok.`)}</p>
        ) : null}
      </div>
    </div>
  )
}
