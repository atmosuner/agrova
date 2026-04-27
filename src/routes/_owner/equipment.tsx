import { msg, t } from '@lingui/macro'
import { clsx } from 'clsx'
import { cn } from '@/lib/utils'
import { ArrowDownAZ, ArrowUpAZ, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { downloadEquipmentCsv } from '@/features/equipment/csv'
import { EquipmentUsageSheet } from '@/features/equipment/EquipmentUsageSheet'
import {
  equipmentFormSchema,
  parseEquipmentSearch,
  type EquipmentCategory,
  type EquipmentFormValues,
} from '@/features/equipment/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/types/db'

type Category = Enums<'equipment_category'>
type Row = Tables<'equipment'>

/* eslint-disable lingui/no-unlocalized-strings -- DB enum + msg keys */
const TABS: { cat: EquipmentCategory; label: ReturnType<typeof msg> }[] = [
  { cat: 'VEHICLE', label: msg`Araçlar` },
  { cat: 'TOOL', label: msg`Aletler` },
  { cat: 'CHEMICAL', label: msg`Kimyasallar` },
  { cat: 'CRATE', label: msg`Kasalar` },
]
/* eslint-enable lingui/no-unlocalized-strings */

const emptyForm = (): EquipmentFormValues => ({
  name: '',
  notes: '',
})

/* eslint-disable lingui/no-unlocalized-strings -- shadcn & HTML tokens, not copy */
const b = { sm: 'sm', out: 'outline', btn: 'button', def: 'default', sub: 'submit' } as const
/* eslint-enable lingui/no-unlocalized-strings */

/* eslint-disable lingui/no-unlocalized-strings -- Tailwind tokens + emoji */
const CAT_ICON: Record<Category, { emoji: string; bg: string }> = {
  VEHICLE: { emoji: '\uD83D\uDE9C', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  TOOL: { emoji: '\uD83D\uDD27', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  CHEMICAL: { emoji: '\uD83E\uDDEA', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  CRATE: { emoji: '\uD83D\uDCE6', bg: 'bg-purple-100 dark:bg-purple-900/30' },
}
/* eslint-enable lingui/no-unlocalized-strings */

export const Route = createFileRoute('/_owner/equipment')({
  validateSearch: (search) => parseEquipmentSearch(search as Record<string, unknown>),
  component: EquipmentPage,
})

function EquipmentPage() {
  const { cat: catFromUrl } = Route.useSearch()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  type EquipSortCol = 'name' | 'created_at'
  type EquipSortDir = 'asc' | 'desc'
  /* eslint-disable lingui/no-unlocalized-strings -- sort column/direction tokens */
  const [eqSortCol, setEqSortCol] = useState<EquipSortCol>('name')
  const [eqSortDir, setEqSortDir] = useState<EquipSortDir>('asc')
  /* eslint-enable lingui/no-unlocalized-strings */
  const [modal, setModal] = useState<null | { type: 'add' } | { type: 'edit'; row: Row }>(null)
  const [usageFor, setUsageFor] = useState<Row | null>(null)
  const [form, setForm] = useState<EquipmentFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Row | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const archiveRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()
  const archiveTitleId = useId()
  const cat: Category = catFromUrl

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
    let q = supabase.from('equipment').select('*').eq('category', cat).order('name', { ascending: true })
    if (!showArchived) {
      q = q.eq('active', true)
    }
    /* eslint-enable lingui/no-unlocalized-strings */
    const { data, error } = await q
    setLoading(false)
    if (error) {
      setErr(error.message)
      return
    }
    setRows(data ?? [])
  }, [cat, showArchived])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(raf)
  }, [load])

  const isModalOpen = modal != null

  useEffect(() => {
    if (!isModalOpen) {
      return
    }
    const d = dialogRef.current
    if (!d?.open) {
      return
    }
    const onClose = () => setModal(null)
    /* eslint-disable-next-line lingui/no-unlocalized-strings -- DOM event */
    d.addEventListener('close', onClose, { once: true })
    /* eslint-disable-next-line lingui/no-unlocalized-strings -- DOM event */
    return () => d.removeEventListener('close', onClose)
  }, [isModalOpen])

  function openAdd() {
    setForm(emptyForm())
    setFormError(null)
    setModal({ type: 'add' })
    requestAnimationFrame(() => dialogRef.current?.showModal())
  }

  function openEdit(r: Row) {
    setForm({
      name: r.name,
      notes: r.notes ?? '',
    })
    setFormError(null)
    setModal({ type: 'edit', row: r })
    requestAnimationFrame(() => dialogRef.current?.showModal())
  }

  function closeModal() {
    dialogRef.current?.close()
    setModal(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const parsed = equipmentFormSchema.safeParse(form)
    if (!parsed.success) {
      setFormError(i18n._(msg`Formu kontrol edin.`))
      return
    }
    setSaving(true)
    if (modal?.type === 'add') {
      /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
      const { error } = await supabase.from('equipment').insert({
        name: parsed.data.name,
        notes: parsed.data.notes.trim() || null,
        category: cat,
        active: true,
      })
      /* eslint-enable lingui/no-unlocalized-strings */
      setSaving(false)
      if (error) {
        setFormError(error.message)
        return
      }
    } else if (modal?.type === 'edit') {
      /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
      const { error } = await supabase
        .from('equipment')
        .update({
          name: parsed.data.name,
          notes: parsed.data.notes.trim() || null,
        })
        .eq('id', modal.row.id)
      /* eslint-enable lingui/no-unlocalized-strings */
      setSaving(false)
      if (error) {
        setFormError(error.message)
        return
      }
    } else {
      setSaving(false)
      return
    }
    closeModal()
    await load()
  }

  async function exportAllEquipment() {
    setErr(null)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    /* eslint-enable lingui/no-unlocalized-strings */
    if (error) {
      setErr(error.message)
      return
    }
    downloadEquipmentCsv(data ?? [])
  }

  function openArchiveEquip(r: Row) {
    setArchiveTarget(r)
    requestAnimationFrame(() => archiveRef.current?.showModal())
  }

  function closeArchiveEquip() {
    archiveRef.current?.close()
    setArchiveTarget(null)
  }

  async function confirmArchiveEquip() {
    if (!archiveTarget) return
    setSaving(true)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
    const { error } = await supabase.from('equipment').update({ active: false }).eq('id', archiveTarget.id)
    /* eslint-enable lingui/no-unlocalized-strings */
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    closeArchiveEquip()
    await load()
  }

  const sortedRows = useMemo(() => {
    const list = [...rows]
    const dir = eqSortDir === 'asc' ? 1 : -1
    list.sort((a, b) => {
      if (eqSortCol === 'name') return a.name.localeCompare(b.name, 'tr') * dir
      return ((a.created_at ?? '').localeCompare(b.created_at ?? '')) * dir
    })
    return list
  }, [rows, eqSortCol, eqSortDir])

  const catLabel = i18n._((TABS.find((x) => x.cat === cat) ?? TABS[0]!).label)

  return (
    <div className="space-y-4">
      {/* Toolbar — matches Tasks FilterBar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.cat}
            to="/equipment"
            search={{ cat: tab.cat } as { cat: Category }}
            className={clsx(
              'inline-flex h-[30px] items-center rounded-[7px] px-2.5 text-[12px] font-medium transition-colors',
              tab.cat === cat
                ? 'border border-orchard-500/30 bg-orchard-50 text-orchard-700'
                : 'border border-border bg-surface-0 text-fg-secondary hover:border-border-strong hover:text-fg',
            )}
          >
            {i18n._(tab.label)}
          </Link>
        ))}

        <div className="mx-0.5 h-5 w-px bg-border-strong" aria-hidden />

        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className={cn(
            'inline-flex h-[30px] items-center rounded-[7px] border px-2.5 text-[12px] font-medium transition-colors',
            showArchived
              ? 'border-orchard-500/30 bg-orchard-50 text-orchard-700 hover:bg-orchard-100'
              : 'border-border bg-surface-0 text-fg-secondary hover:border-border-strong hover:text-fg',
          )}
        >
          {t`Arşivlenenler`}
          {showArchived && <X className="ml-1 h-3 w-3" />}
        </button>

        <div className="mx-0.5 h-5 w-px bg-border-strong" aria-hidden />

        <button
          type="button"
          onClick={() => {
            if (eqSortCol === 'name' && eqSortDir === 'asc') {
              setEqSortDir('desc')
            } else if (eqSortCol === 'name' && eqSortDir === 'desc') {
              setEqSortCol('created_at')
              setEqSortDir('desc')
            } else {
              setEqSortCol('name')
              setEqSortDir('asc')
            }
          }}
          className="inline-flex h-[30px] items-center gap-1 rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
        >
          {eqSortDir === 'asc' ? <ArrowDownAZ className="h-3.5 w-3.5" /> : <ArrowUpAZ className="h-3.5 w-3.5" />}
          {eqSortCol === 'name' ? t`Ada göre` : t`Tarihe göre`}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button type={b.btn} variant={b.out} size={b.sm} onClick={() => void exportAllEquipment()} disabled={saving || loading}>
            {t`CSV`}
          </Button>
          <Button type={b.btn} size={b.sm} onClick={openAdd} disabled={saving || loading}>
            {t`+ Ekle`}
          </Button>
        </div>
      </div>

      {err ? <p className="text-sm text-harvest-600">{err}</p> : null}

      {/* Equipment list */}
      <div className="overflow-hidden rounded-xl border border-border">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
        ) : sortedRows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-fg-secondary">{t`Gösterilecek ekipman yok.`}</p>
        ) : (
          <ul className="divide-y divide-border">
            {sortedRows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 bg-surface-0 px-5 py-3.5 hover:bg-surface-1/50">
                <span className={clsx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base', CAT_ICON[cat].bg)}>
                  {CAT_ICON[cat].emoji}
                </span>
                <button
                  type="button"
                  className="min-w-0 flex-1 cursor-pointer text-left"
                  onClick={() => setUsageFor(r)}
                >
                  <span className="text-[13px] font-medium text-fg">{r.name}</span>
                  {r.notes ? <p className="text-[12px] text-fg-muted">{r.notes}</p> : null}
                  {showArchived && !r.active ? (
                    <span className="text-[11px] text-fg-muted">{t`Arşivlendi`}</span>
                  ) : null}
                </button>
                {r.active ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Button type={b.btn} size={b.sm} variant={b.out} onClick={() => setUsageFor(r)} disabled={saving}>
                      {t`Kullanım`}
                    </Button>
                    <Button type={b.btn} size={b.sm} variant={b.out} onClick={() => openEdit(r)} disabled={saving}>
                      {t`Düzenle`}
                    </Button>
                    <Button type={b.btn} size={b.sm} variant={b.out} onClick={() => openArchiveEquip(r)} disabled={saving}>
                      {t`Arşivle`}
                    </Button>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Add / Edit dialog ── */}
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={titleId}
        aria-describedby={descId}
        aria-modal="true"
        onKeyDown={(e) => (e.key === 'Escape' ? closeModal() : null)}
        onClick={(e) => (e.target === e.currentTarget ? closeModal() : null)}
      >
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="flex flex-col gap-4 p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-fg">
                {modal?.type === 'add' ? t`Yeni ekipman` : t`Ekipmanı düzenle`}
              </h2>
              <p id={descId} className="mt-0.5 text-[13px] text-fg-secondary">
                {catLabel} {t`kategorisi`}
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-1 hover:text-fg"
              aria-label={t`Kapat`}
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-fg" htmlFor="eq-name">
              {t`Ad`}
            </label>
            <input
              id="eq-name"
              className={formFieldClassName}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-fg" htmlFor="eq-notes">
              {t`Notlar`}
            </label>
            <textarea
              id="eq-notes"
              className={clsx(formFieldClassName, 'min-h-[3rem]')}
              placeholder={i18n._(msg`İsteğe bağlı…`)}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {formError ? <p className="text-sm text-harvest-600">{formError}</p> : null}

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button type={b.btn} variant={b.out} onClick={closeModal} disabled={saving}>
              {t`İptal`}
            </Button>
            <Button type={b.sub} disabled={saving}>
              {saving ? t`Kaydediliyor…` : t`Kaydet`}
            </Button>
          </div>
        </form>
      </dialog>

      {/* ── Archive confirmation dialog ── */}
      <dialog
        ref={archiveRef}
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={archiveTitleId}
        onClose={() => setArchiveTarget(null)}
      >
        {archiveTarget ? (
          <div className="flex flex-col gap-4 p-5">
            <h2 id={archiveTitleId} className="text-lg font-semibold text-fg">
              {t`Ekipmanı arşivle`}
            </h2>
            <p className="text-[13px] text-fg-secondary">
              <strong className="font-medium text-fg">{archiveTarget.name}</strong>{' '}
              {t`arşivlenecek. Kullanım kayıtları korunur. Arşivlenenleri göster seçeneğiyle tekrar görüntülenebilir.`}
            </p>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type={b.btn} variant={b.out} onClick={closeArchiveEquip} disabled={saving}>
                {t`İptal`}
              </Button>
              <Button type={b.btn} onClick={() => void confirmArchiveEquip()} disabled={saving}>
                {saving ? t`Kaydediliyor…` : t`Arşivle`}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>

      {usageFor ? <EquipmentUsageSheet equipment={usageFor} onClose={() => setUsageFor(null)} /> : null}
    </div>
  )
}
