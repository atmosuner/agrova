import { msg, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronRight, Pencil, Search, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fieldToPolygonFeature, type FieldWithGeo } from '@/features/fields/boundary-geojson'
import { downloadFieldsCsv } from '@/features/fields/csv'
import { DeleteFieldModal } from '@/features/fields/DeleteFieldModal'
import { DrawModeBanner } from '@/features/fields/DrawModeBanner'
import { FieldChemicalLog } from '@/features/fields/FieldChemicalLog'
import { fieldFormSchema } from '@/features/fields/field-form'
import { FieldsMap } from '@/features/fields/FieldsMap'
import { formFieldClassName } from '@/lib/form-field-class'
import { openMeteoGeocodeCity, TURKEY_VIEW_CENTER } from '@/lib/open-meteo-geocoding'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/db'

type Field = FieldWithGeo

const defaultZoom = 14

const RPC_FIELD_UPSERT = 'field_upsert_from_geojson' as const

/* eslint-disable lingui/no-unlocalized-strings -- shadcn & HTML token strings, not translatable */
const b = { sm: 'sm', def: 'default', out: 'outline', btn: 'button' } as const
/* eslint-enable lingui/no-unlocalized-strings */

export const Route = createFileRoute('/_owner/fields')({
  component: FieldsPage,
})

function FieldsPage() {
  const [rows, setRows] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState({
    ...TURKEY_VIEW_CENTER,
    zoom: 6,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [wantsDraw, setWantsDraw] = useState(false)
  /** 1 = new field polygon, 2 = redraw selected boundary, null = idle */
  const [drawMode, setDrawMode] = useState<1 | 2 | null>(null)
  const [draftFeature, setDraftFeature] = useState<GeoJSON.Feature | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    crop: '',
    variety: '',
    plantCount: '' as string,
    plantedYear: '' as string,
    notes: '',
    address: '',
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  /* Tab keys are internal; labels are translated in the tab buttons. */
  // eslint-disable-next-line lingui/no-unlocalized-strings
  const [fieldAsideTab, setFieldAsideTab] = useState<'info' | 'chemical'>('info')

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr')
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLocaleLowerCase('tr').includes(q) ||
        r.crop.toLocaleLowerCase('tr').includes(q) ||
        (r.variety && r.variety.toLocaleLowerCase('tr').includes(q)),
    )
  }, [rows, searchQuery])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const [{ data: settings, error: sErr }, { data: list, error: fErr }] = await Promise.all([
      // eslint-disable-next-line lingui/no-unlocalized-strings -- PostgREST column list, not UI
      supabase.from('operation_settings').select('weather_city').limit(1).maybeSingle(),
      // eslint-disable-next-line lingui/no-unlocalized-strings -- PostgREST select, not UI
      supabase.from('fields').select('*, boundary_geojson').order('name', { ascending: true }),
    ])
    if (sErr) {
      setErr(sErr.message)
    }
    if (fErr) {
      setErr(fErr.message)
    }
    setLoading(false)
    if (list) {
      const loaded = list as unknown as Field[]
      setRows(loaded)
      if (loaded.length > 0) {
        setSelectedId((prev) => prev ?? loaded[0]!.id)
      }
    }
    const city = settings?.weather_city?.trim() ?? ''
    const c = city ? await openMeteoGeocodeCity(city) : null
    if (c) {
      setMapCenter((prev) => ({ lat: c.lat, lng: c.lng, zoom: defaultZoom > prev.zoom ? defaultZoom : prev.zoom }))
    }
  }, [])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(raf)
  }, [load])

  const selected = selectedId != null ? rows.find((r) => r.id === selectedId) : null

  function onFieldClick(id: string) {
    setSelectedId(id)
    setEditing(false)
    setDeleteModalOpen(false)
    // eslint-disable-next-line lingui/no-unlocalized-strings
    setFieldAsideTab('info')
  }

  function onDrawSettled() {
    setWantsDraw(false)
    setDrawMode(null)
  }

  function onNewPolygon(feature: GeoJSON.Feature) {
    setDraftFeature(feature)
    if (drawMode === 2 && selected) {
      void saveRedraw(feature)
      return
    }
    setForm({
      name: '',
      crop: '',
      variety: '',
      plantCount: '',
      plantedYear: '',
      notes: '',
      address: '',
    })
    setEditing(true)
  }

  async function saveRedraw(feature: GeoJSON.Feature) {
    if (!selected) return
    setSaving(true)
    setErr(null)
    const { error } = await supabase.rpc(RPC_FIELD_UPSERT, {
      p_id: selected.id,
      p_name: selected.name,
      p_crop: selected.crop,
      p_variety: selected.variety || null,
      p_plant_count: selected.plant_count,
      p_planted_year: selected.planted_year,
      p_notes: selected.notes || null,
      p_address: selected.address || null,
      p_polygon: feature as unknown as Json,
    })
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    setDraftFeature(null)
    setDrawMode(null)
    await load()
  }

  function startNewField() {
    setDrawMode(1)
    setSelectedId(null)
    setWantsDraw(true)
  }

  function startReplaceBoundary() {
    if (!selected) {
      return
    }
    setDrawMode(2)
    setWantsDraw(true)
  }

  function openEdit() {
    if (!selected) {
      return
    }
    setDrawMode(null)
    setForm({
      name: selected.name,
      crop: selected.crop,
      variety: selected.variety ?? '',
      plantCount: selected.plant_count != null ? String(selected.plant_count) : '',
      plantedYear: selected.planted_year != null ? String(selected.planted_year) : '',
      notes: selected.notes ?? '',
      address: selected.address ?? '',
    })
    setDraftFeature(null)
    setEditing(true)
  }

  function closeEditor() {
    setEditing(false)
    setDraftFeature(null)
    setDrawMode(null)
  }

  function parseIntOrNull(s: string): number | null {
    const t = s.trim()
    if (!t) {
      return null
    }
    const n = Number.parseInt(t, 10)
    return Number.isFinite(n) ? n : null
  }

  async function saveField() {
    if (!editing) {
      return
    }
    const parsed = fieldFormSchema.safeParse(form)
    if (!parsed.success) {
      const c = parsed.error.issues[0]
      if (c?.code === 'too_small' && c.path[0] === 'name') {
        setErr(t`Ad alanı zorunludur.`)
        return
      }
      setErr(t`Lütfen formu kontrol edin.`)
      return
    }
    const { name, crop, variety, plantCount, plantedYear, notes, address } = parsed.data
    const geometry =
      draftFeature != null
        ? draftFeature
        : selected != null
          ? fieldToPolygonFeature(selected)
          : null
    if (geometry == null) {
      setErr(t`Önce haritada tarla sınırı çizin.`)
      return
    }
    setSaving(true)
    setErr(null)
    const p_id: string | null = selected == null ? null : selected.id
    const { data, error } = await supabase.rpc(RPC_FIELD_UPSERT, {
      p_id: p_id,
      p_name: name,
      p_crop: crop.trim() || i18n._(msg`—`),
      p_variety: variety.trim() || null,
      p_plant_count: parseIntOrNull(plantCount),
      p_planted_year: parseIntOrNull(plantedYear),
      p_notes: notes.trim() || null,
      p_address: address.trim() || null,
      p_polygon: geometry as unknown as Json,
    })
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    if (data) {
      setSelectedId(data)
    }
    closeEditor()
    await load()
  }

  async function removeField() {
    if (!selected) return
    setSaving(true)
    setErr(null)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST chain, not user-facing copy */
    const { error } = await supabase.from('fields').delete().eq('id', selected.id)
    /* eslint-enable lingui/no-unlocalized-strings */
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    setSelectedId(null)
    setDeleteModalOpen(false)
    setEditing(false)
    await load()
  }

  return (
    <div className="grid h-[calc(100dvh-6rem)] gap-4 lg:grid-cols-4">
      {/* Map area — 3/4 */}
      <div className="flex min-h-[50vh] min-w-0 flex-col overflow-hidden rounded-xl border border-border lg:col-span-3">
        <DrawModeBanner visible={wantsDraw} onCancel={onDrawSettled} />
        {err ? <p className="px-4 py-2 text-sm text-harvest-600">{err}</p> : null}
        {loading ? (
          <p className="px-4 py-6 text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
        ) : (
          <div className="min-h-0 min-w-0 flex-1">
            <FieldsMap
              center={mapCenter}
              fields={rows}
              selectedId={selectedId}
              wantsDraw={wantsDraw}
              onDrawSettled={onDrawSettled}
              onFieldClick={onFieldClick}
              onNewPolygon={onNewPolygon}
            />
          </div>
        )}
      </div>

      {/* Right panel — 1/4 */}
      <aside
        className={clsx(
          'flex flex-col overflow-hidden rounded-xl border border-border bg-surface-0 transition-opacity lg:col-span-1',
          wantsDraw && 'pointer-events-none opacity-60',
        )}
      >
        {/* Panel header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-[13px] font-semibold text-fg">
            {rows.length} {t`tarla`}
          </span>
          <div className="ml-auto flex gap-1.5">
            <Button
              type={b.btn}
              size={b.sm}
              variant={b.out}
              className="h-7 px-2.5 text-[12px]"
              onClick={() => downloadFieldsCsv(rows)}
              disabled={loading}
            >
              {/* eslint-disable lingui/no-unlocalized-strings -- abbreviation */}
              CSV
              {/* eslint-enable lingui/no-unlocalized-strings */}
            </Button>
            <Button
              type={b.btn}
              size={b.sm}
              className="h-7 px-2.5 text-[12px]"
              onClick={startNewField}
              disabled={loading || wantsDraw}
            >
              {t`Yeni tarla`}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-muted" strokeWidth={1.75} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={i18n._(msg`Tarla ara…`)}
              className="h-8 w-full rounded-lg bg-surface-1 pl-8 pr-3 text-[13px] text-fg outline-none placeholder:text-fg-faint focus:ring-2 focus:ring-orchard-500/20"
              aria-label={t`Tarla ara`}
            />
          </div>
        </div>

        {/* Field list */}
        <ul className="min-h-0 flex-1 basis-1/2 space-y-0.5 overflow-y-auto px-2 py-1">
          {filteredRows.map((r) => {
            const isSelected = r.id === selectedId
            const metaParts: string[] = []
            if (r.variety) metaParts.push(r.variety)
            // eslint-disable-next-line lingui/no-unlocalized-strings -- unit abbreviation
            if (r.area_hectares != null) metaParts.push(`${(Math.round(r.area_hectares * 100) / 100).toString()} ha`)
            if (r.planted_year != null) metaParts.push(String(r.planted_year))

            return (
              <li key={r.id}>
                <button
                  type="button"
                  className={clsx(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isSelected
                      ? 'border-[1.5px] border-orchard-500 bg-orchard-50'
                      : 'border border-transparent hover:bg-surface-1',
                  )}
                  onClick={() => onFieldClick(r.id)}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-orchard-500" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-fg">
                      {r.name}
                      {r.crop ? <>{' \u2014 '}{r.crop}</> : null}
                    </p>
                    {metaParts.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-fg-muted">{metaParts.join(' · ')}</p>
                    )}
                  </div>
                  {isSelected && <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />}
                </button>
              </li>
            )
          })}
          {filteredRows.length === 0 && !loading && (
            <p className="px-3 py-4 text-center text-[12px] text-fg-muted">{t`Tarla bulunamadı.`}</p>
          )}
        </ul>

        {/* Detail / edit panel */}
        {editing ? (
          <div className="min-h-0 flex-1 basis-1/2 space-y-2 overflow-y-auto border-t border-border bg-surface-0 p-4">
            <h3 className="text-[13px] font-semibold text-fg">
              {selected == null ? t`Yeni tarla` : t`Tarla düzenle`}
            </h3>
            <label className="block text-[11px] font-medium text-fg-muted">
              {t`Ad`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoComplete="off"
              />
            </label>
            <label className="block text-[11px] font-medium text-fg-muted">
              {t`Ürün`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.crop}
                onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <label className="block text-[11px] font-medium text-fg-muted">
              {t`Çeşit`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.variety}
                onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[11px] font-medium text-fg-muted">
                {t`Bitki sayısı`}
                <input
                  className={clsx(formFieldClassName, 'mt-0.5')}
                  inputMode="numeric"
                  value={form.plantCount}
                  onChange={(e) => setForm((f) => ({ ...f, plantCount: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <label className="block text-[11px] font-medium text-fg-muted">
                {t`Dikim yılı`}
                <input
                  className={clsx(formFieldClassName, 'mt-0.5')}
                  inputMode="numeric"
                  value={form.plantedYear}
                  onChange={(e) => setForm((f) => ({ ...f, plantedYear: e.target.value }))}
                  autoComplete="off"
                />
              </label>
            </div>
            <label className="block text-[11px] font-medium text-fg-muted">
              {t`Adres`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <label className="block text-[11px] font-medium text-fg-muted">
              {t`Notlar`}
              <textarea
                className={clsx(formFieldClassName, 'mt-0.5 min-h-[4rem]')}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <div className="flex gap-2 pt-1">
              <Button type={b.btn} size={b.sm} onClick={() => void saveField()} disabled={saving}>
                {t`Kaydet`}
              </Button>
              <Button type={b.btn} size={b.sm} onClick={closeEditor} disabled={saving} variant={b.out}>
                {t`İptal`}
              </Button>
            </div>
          </div>
        ) : null}
        {selected && !editing ? (
          <div className="flex min-h-0 flex-1 basis-1/2 flex-col border-t border-border bg-surface-0">
            <div className="flex gap-1 border-b border-border px-4 pt-2">
              <button
                type="button"
                className={clsx(
                  'rounded-t px-3 py-1.5 text-[12px] font-medium transition-colors',
                  fieldAsideTab === 'info'
                    ? 'border-b-2 border-orchard-500 text-fg'
                    : 'text-fg-secondary hover:text-fg',
                )}
                onClick={() => setFieldAsideTab('info')}
                aria-pressed={fieldAsideTab === 'info'}
              >
                {t`Detay`}
              </button>
              <button
                type="button"
                className={clsx(
                  'rounded-t px-3 py-1.5 text-[12px] font-medium transition-colors',
                  fieldAsideTab === 'chemical'
                    ? 'border-b-2 border-orchard-500 text-fg'
                    : 'text-fg-secondary hover:text-fg',
                )}
                onClick={() => setFieldAsideTab('chemical')}
                aria-pressed={fieldAsideTab === 'chemical'}
              >
                {i18n._(msg`Kimyasallar`)}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {fieldAsideTab === 'info' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-fg-muted">{i18n._(msg`Ürün`)}</p>
                      <p className="text-[13px] font-medium text-fg">
                        {selected.crop}
                        {selected.variety ? <>{' \u2014 '}{selected.variety}</> : null}
                      </p>
                    </div>
                    {selected.area_hectares != null && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-fg-muted">{i18n._(msg`Alan`)}</p>
                        {/* eslint-disable-next-line lingui/no-unlocalized-strings -- unit abbreviation */}
                        <p className="text-[13px] font-medium text-fg">{(Math.round(selected.area_hectares * 100) / 100).toString()} ha</p>
                      </div>
                    )}
                    {selected.plant_count != null && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-fg-muted">{i18n._(msg`Fidan sayısı`)}</p>
                        <p className="text-[13px] font-medium tabular-nums text-fg">{selected.plant_count}</p>
                      </div>
                    )}
                    {selected.planted_year != null && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-fg-muted">{i18n._(msg`Dikim yılı`)}</p>
                        <p className="text-[13px] font-medium tabular-nums text-fg">{selected.planted_year}</p>
                      </div>
                    )}
                  </div>
                  {selected.notes ? (
                    <p className="rounded-lg bg-surface-1 px-3 py-2 text-[12px] text-fg-secondary">{selected.notes}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type={b.btn} size={b.sm} variant={b.out} onClick={openEdit} className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                      {t`Düzenle`}
                    </Button>
                    <Button
                      type={b.btn}
                      size={b.sm}
                      variant={b.out}
                      onClick={startReplaceBoundary}
                      disabled={wantsDraw}
                      className="gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                      {t`Sınırı Yeniden Çiz`}
                    </Button>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-[12px] font-medium text-fg-muted transition-colors hover:text-status-blocked"
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    {t`Tarlayı sil…`}
                  </button>
                </div>
              ) : (
                <FieldChemicalLog fieldId={selected.id} fieldName={selected.name} />
              )}
            </div>
          </div>
        ) : null}
      </aside>

      {selected && (
        <DeleteFieldModal
          open={deleteModalOpen}
          fieldName={selected.name}
          saving={saving}
          onConfirm={() => void removeField()}
          onClose={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  )
}
