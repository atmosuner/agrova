import { msg, t } from '@lingui/macro'
import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { fieldToPolygonFeature } from '@/features/fields/boundary-geojson'
import { downloadFieldsCsv } from '@/features/fields/csv'
import { fieldFormSchema } from '@/features/fields/field-form'
import { FieldsMap } from '@/features/fields/FieldsMap'
import { formFieldClassName } from '@/lib/form-field-class'
import { openMeteoGeocodeCity, TURKEY_VIEW_CENTER } from '@/lib/open-meteo-geocoding'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { Json, Tables } from '@/types/db'

type Field = Tables<'fields'>

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
  const [deleteTyped, setDeleteTyped] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const [{ data: settings, error: sErr }, { data: list, error: fErr }] = await Promise.all([
      // eslint-disable-next-line lingui/no-unlocalized-strings -- PostgREST column list, not UI
      supabase.from('operation_settings').select('weather_city').limit(1).maybeSingle(),
      // eslint-disable-next-line lingui/no-unlocalized-strings -- PostgREST select, not UI
      supabase.from('fields').select('*').order('name', { ascending: true }),
    ])
    if (sErr) {
      setErr(sErr.message)
    }
    if (fErr) {
      setErr(fErr.message)
    }
    setLoading(false)
    if (list) {
      setRows(list)
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
    setDeleteTyped('')
  }

  function onDrawSettled() {
    setWantsDraw(false)
    setDrawMode(null)
  }

  function onNewPolygon(feature: GeoJSON.Feature) {
    setDraftFeature(feature)
    if (drawMode === 1) {
      setForm({
        name: '',
        crop: '',
        variety: '',
        plantCount: '',
        plantedYear: '',
        notes: '',
        address: '',
      })
    }
    setEditing(true)
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
        setErr(t`Name is required.`)
        return
      }
      setErr(t`Formu kontrol edin.`)
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
      setErr(
        t`Draw a field boundary on the map first.`
      )
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
    if (!selected) {
      return
    }
    if (deleteTyped.trim() !== selected.name.trim()) {
      setErr(
        t`Type the field name exactly to delete.`
      )
      return
    }
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
    setDeleteTyped('')
    setEditing(false)
    await load()
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-[min(100vh,900px)] lg:flex-row lg:items-stretch">
      <div className="flex min-h-[50vh] min-w-0 flex-1 flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Fields`}</h1>
          <p className="mt-1 text-fg-secondary">{t`Draw parcels on the map, then save. Center uses the weather city in settings.`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type={b.btn}
            onClick={() => downloadFieldsCsv(rows)}
            disabled={loading}
            variant={b.out}
          >
            {t`Download CSV`}
          </Button>
          <Button type={b.btn} onClick={startNewField} disabled={loading || wantsDraw} variant={b.def}>
            {t`New field`}
          </Button>
        </div>
        {err ? <p className="text-sm text-harvest-600">{err}</p> : null}
        {loading ? (
          <p className="text-sm text-fg-secondary">{t`Loading…`}</p>
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
      <aside className="flex w-full min-w-0 flex-col gap-3 border-orchard-200 pt-2 lg:max-w-md lg:border-l lg:pl-4 lg:pt-0">
        <h2 className="text-sm font-medium text-fg">{t`List`}</h2>
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={
                  r.id === selectedId
                    ? 'w-full rounded bg-orchard-100 px-2 py-1.5 text-left text-fg'
                    : 'w-full rounded px-2 py-1.5 text-left text-fg-secondary hover:bg-orchard-50'
                }
                onClick={() => onFieldClick(r.id)}
              >
                {r.name}
                {r.area_hectares != null
                  ? (
                      <>
                        {'\u00a0\u2014\u00a0'}
                        {(Math.round(r.area_hectares * 100) / 100).toString()} {t`ha`}
                      </>
                    )
                  : null}
              </button>
            </li>
          ))}
        </ul>
        {editing ? (
          <div className="space-y-2 rounded-md border border-orchard-200 bg-surface-0 p-3 shadow-sm">
            <h3 className="text-sm font-medium text-fg">{selected == null ? t`New field` : t`Edit field`}</h3>
            <label className="block text-xs text-fg-secondary">
              {t`Name`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoComplete="off"
              />
            </label>
            <label className="block text-xs text-fg-secondary">
              {t`Crop`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.crop}
                onChange={(e) => setForm((f) => ({ ...f, crop: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <label className="block text-xs text-fg-secondary">
              {t`Variety`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.variety}
                onChange={(e) => setForm((f) => ({ ...f, variety: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-fg-secondary">
                {t`Plants (count)`}
                <input
                  className={clsx(formFieldClassName, 'mt-0.5')}
                  inputMode="numeric"
                  value={form.plantCount}
                  onChange={(e) => setForm((f) => ({ ...f, plantCount: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <label className="block text-xs text-fg-secondary">
                {t`Planted year`}
                <input
                  className={clsx(formFieldClassName, 'mt-0.5')}
                  inputMode="numeric"
                  value={form.plantedYear}
                  onChange={(e) => setForm((f) => ({ ...f, plantedYear: e.target.value }))}
                  autoComplete="off"
                />
              </label>
            </div>
            <label className="block text-xs text-fg-secondary">
              {t`Address`}
              <input
                className={clsx(formFieldClassName, 'mt-0.5')}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <label className="block text-xs text-fg-secondary">
              {t`Notes`}
              <textarea
                className={clsx(formFieldClassName, 'mt-0.5 min-h-[4rem]')}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type={b.btn} onClick={() => void saveField()} disabled={saving}>
                {t`Save`}
              </Button>
              <Button type={b.btn} onClick={closeEditor} disabled={saving} variant={b.out}>
                {t`Cancel`}
              </Button>
            </div>
          </div>
        ) : null}
        {selected && !editing ? (
          <div className="space-y-2 rounded-md border border-orchard-200 bg-orchard-50/30 p-3 text-sm">
            <h3 className="font-medium text-fg">{selected.name}</h3>
            <p className="text-fg-secondary">
              {selected.crop}
              {selected.variety ? (
                <>
                  {'\u00a0\u2014\u00a0'}
                  {selected.variety}
                </>
              ) : null}
            </p>
            {selected.area_hectares != null ? (
              <p className="text-fg-secondary">
                {i18n._(msg`Area`)}: {(Math.round(selected.area_hectares * 100) / 100).toString()} {t`ha`}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type={b.btn} size={b.sm} variant={b.out} onClick={openEdit}>
                {t`Edit`}
              </Button>
              <Button
                type={b.btn}
                size={b.sm}
                variant={b.out}
                onClick={startReplaceBoundary}
                disabled={wantsDraw}
              >
                {t`Redraw boundary`}
              </Button>
            </div>
            <div className="mt-2 border-t border-orchard-200 pt-2">
              <p className="text-xs text-fg-secondary">{t`Type the field name to confirm deletion.`}</p>
              <input
                className={clsx(formFieldClassName, 'mt-1 text-sm')}
                value={deleteTyped}
                onChange={(e) => setDeleteTyped(e.target.value)}
                placeholder={selected.name}
                autoComplete="off"
              />
              <Button
                type={b.btn}
                className="mt-2"
                size={b.sm}
                variant={b.out}
                onClick={() => void removeField()}
                disabled={saving || deleteTyped.trim() !== selected.name.trim()}
              >
                {t`Delete field`}
              </Button>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  )
}
