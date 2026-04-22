import { msg } from '@lingui/macro'
import { downloadUnparse } from '@/lib/csv-download'
import { i18n } from '@/lib/i18n'
import { gpsCenterToLatLng } from './gps-center'
import type { Tables } from '@/types/db'

type Field = Tables<'fields'>

function fieldRow(f: Field): (string | number)[] {
  const { lat, lng } = gpsCenterToLatLng(f.gps_center)
  return [
    f.name,
    f.crop,
    f.variety ?? '',
    f.area_hectares ?? '',
    lat,
    lng,
    f.plant_count ?? '',
    f.planted_year ?? '',
    f.notes ?? '',
  ]
}

export function downloadFieldsCsv(rows: Field[]): void {
  const h = [
    i18n._(msg`Name`),
    i18n._(msg`Crop`),
    i18n._(msg`Variety`),
    i18n._(msg`Area (ha)`),
    i18n._(msg`Latitude`),
    i18n._(msg`Longitude`),
    i18n._(msg`Plant count`),
    i18n._(msg`Planted year`),
    i18n._(msg`Notes`),
  ]
  const data = rows.map(fieldRow)
  // eslint-disable-next-line lingui/no-unlocalized-strings -- filename base
  downloadUnparse([h, ...data], 'fields')
}
