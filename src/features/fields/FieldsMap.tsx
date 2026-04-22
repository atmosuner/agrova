import { t } from '@lingui/macro'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import { fieldBoundaryToGeometry, toGeoJsonFeature } from './boundary-geojson'
import type { Tables } from '@/types/db'

// eslint-disable-next-line lingui/no-unlocalized-strings -- static Esri WMTS template URL, not translatable
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

type LWithDraw = typeof L & {
  Draw: {
    Event: { CREATED: 'draw:created' }
    Polygon: new (map: L.Map, options?: object) => {
      enable: () => void
      disable: () => void
    }
  }
}

const LD = L as LWithDraw

type Field = Tables<'fields'>

type Props = {
  center: { lat: number; lng: number; zoom: number }
  fields: Field[]
  selectedId: string | null
  wantsDraw: boolean
  onDrawSettled: () => void
  onFieldClick: (id: string) => void
  onNewPolygon: (feature: GeoJSON.Feature) => void
}

export function FieldsMap({
  center,
  fields,
  selectedId,
  wantsDraw,
  onDrawSettled,
  onFieldClick,
  onNewPolygon,
}: Props) {
  const contId = useId()
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const fieldGroupRef = useRef<L.FeatureGroup | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const onNewPolygonRef = useRef(onNewPolygon)
  const onFieldClickRef = useRef(onFieldClick)
  const onDrawSettledRef = useRef(onDrawSettled)
  useLayoutEffect(() => {
    onNewPolygonRef.current = onNewPolygon
    onFieldClickRef.current = onFieldClick
    onDrawSettledRef.current = onDrawSettled
  }, [onNewPolygon, onFieldClick, onDrawSettled])

  const onCreated = useCallback((e: L.LeafletEvent) => {
    const c = e as L.LeafletEvent & { layer: L.Polygon; layerType: string }
    const gj = c.layer.toGeoJSON() as GeoJSON.Feature
    if (c.layerType === 'polygon') {
      c.layer.remove()
    }
    onNewPolygonRef.current(gj)
    onDrawSettledRef.current()
  }, [])

  useEffect(() => {
    if (!mapEl.current) {
      return
    }
    if (mapRef.current) {
      return
    }
    const map = L.map(mapEl.current, { zoomControl: true })
    map.setView([center.lat, center.lng], center.zoom)
    L.tileLayer(ESRI, {
      maxZoom: 20,
      // eslint-disable-next-line lingui/no-unlocalized-strings -- Esri ToU attribution, fixed English string
      attribution: '© Esri',
    }).addTo(map)
    const fieldGroup = L.featureGroup().addTo(map)
    fieldGroupRef.current = fieldGroup
    mapRef.current = map
    setMapReady(true)
    return () => {
      setMapReady(false)
      fieldGroupRef.current = null
      try {
        map.remove()
      } catch {
        /* no-op */
      }
      mapRef.current = null
    }
  }, [center.lat, center.lng, center.zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) {
      return
    }
    const z = map.getZoom()
    map.setView([center.lat, center.lng], z)
  }, [center.lat, center.lng])

  useEffect(() => {
    if (!mapReady) {
      return
    }
    const g = fieldGroupRef.current
    if (!g) {
      return
    }
    g.clearLayers()
    for (const row of fields) {
      const geom = fieldBoundaryToGeometry(row.boundary)
      if (geom == null) {
        continue
      }
      const feature = toGeoJsonFeature(row.id, row.name, geom)
      const isSel = row.id === selectedId
      const layer = L.geoJSON(feature, {
        style: {
          color: isSel ? '#0f5132' : '#2d5a2d',
          weight: isSel ? 3 : 2,
          fillOpacity: 0.2,
        },
        onEachFeature: (ft, lyr) => {
          const id = (ft.properties as { id?: string } | null)?.id
          // eslint-disable-next-line lingui/no-unlocalized-strings -- DOM event name, not app copy
          lyr.on('click', (ev) => {
            L.DomEvent.stopPropagation(ev)
            if (id) {
              onFieldClickRef.current(id)
            }
          })
        },
      })
      g.addLayer(layer)
    }
  }, [fields, mapReady, selectedId])

  useEffect(() => {
    if (!wantsDraw || !mapReady) {
      return
    }
    const map = mapRef.current
    if (!map) {
      return
    }
    const draw = new LD.Draw.Polygon(map, {
      showArea: true,
      shapeOptions: {
        color: '#0f5132',
        weight: 2,
      },
    })
    draw.enable()
    map.once(LD.Draw.Event.CREATED, onCreated)
    return () => {
      map.off(LD.Draw.Event.CREATED, onCreated)
      try {
        draw.disable()
      } catch {
        /* no-op */
      }
    }
  }, [wantsDraw, mapReady, onCreated])

  return (
    <div className="relative h-full min-h-[280px] w-full grow overflow-hidden rounded-md border border-orchard-200 bg-orchard-50/40">
      <div
        id={contId}
        ref={mapEl}
        className="h-full min-h-[280px] w-full"
        aria-label={t`Map of fields`}
      />
    </div>
  )
}
