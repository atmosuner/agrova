/* eslint-disable lingui/no-unlocalized-strings -- Esri + hex stroke + DOM events */
import { msg } from '@lingui/macro'
import { useLayoutEffect, useId, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fieldBoundaryToGeometry, toGeoJsonFeature } from '@/features/fields/boundary-geojson'
import { i18n } from '@/lib/i18n'
import type { Tables } from '@/types/db'

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

type Field = Tables<'fields'>

type Props = {
  center: { lat: number; lng: number; zoom: number }
  fields: Field[]
  activeFieldIds: Set<string>
  onFieldClick: (id: string) => void
}

export function MiniFieldsMap({ center, fields, activeFieldIds, onFieldClick }: Props) {
  const contId = useId()
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const groupRef = useRef<L.FeatureGroup | null>(null)
  const onFieldClickRef = useRef(onFieldClick)
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    onFieldClickRef.current = onFieldClick
  }, [onFieldClick])

  useLayoutEffect(() => {
    if (!mapEl.current || mapRef.current) {
      return
    }
    const map = L.map(mapEl.current, { zoomControl: true })
    map.setView([center.lat, center.lng], center.zoom)
    L.tileLayer(ESRI, { maxZoom: 20, attribution: '© Esri' }).addTo(map)
    const g = L.featureGroup().addTo(map)
    groupRef.current = g
    mapRef.current = map
    setReady(true)
    return () => {
      setReady(false)
      groupRef.current = null
      try {
        map.remove()
      } catch {
        /* no-op */
      }
      mapRef.current = null
    }
  }, [center.lat, center.lng, center.zoom])

  useLayoutEffect(() => {
    if (!ready || !mapRef.current || !groupRef.current) {
      return
    }
    const g = groupRef.current
    g.clearLayers()
    let b: L.LatLngBounds | null = null
    for (const f of fields) {
      const geom = fieldBoundaryToGeometry(f.boundary)
      if (!geom) {
        continue
      }
      const feature = toGeoJsonFeature(f.id, f.name, geom)
      const active = activeFieldIds.has(f.id)
      const layer = L.geoJSON(feature as GeoJSON.GeoJsonObject, {
        style: {
          color: active ? '#3F8B4E' : '#9ca3af',
          weight: 2,
          fillColor: active ? '#3F8B4E' : '#9ca3af',
          fillOpacity: active ? 0.3 : 0.12,
        },
        onEachFeature: (_feat, lay) => {
          lay.on('click', () => onFieldClickRef.current(f.id))
        },
      })
      g.addLayer(layer)
      const lb = layer.getBounds()
      b = b ? b.extend(lb) : lb
    }
    if (b && b.isValid()) {
      mapRef.current.fitBounds(b, { padding: [20, 20], maxZoom: 16 })
    }
  }, [ready, fields, activeFieldIds])

  return (
    <div className="flex flex-col">
      <div className="mb-1 text-xs font-medium text-fg-secondary">{i18n._(msg`Harita — bugünkü tarlalar`)}</div>
      <div
        id={contId}
        ref={mapEl}
        className="h-56 w-full overflow-hidden rounded-lg border border-border"
        role="img"
        aria-label="Satellite map with field outlines"
      />
    </div>
  )
}
