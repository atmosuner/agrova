/* eslint-disable lingui/no-unlocalized-strings */
import { useQuery } from '@tanstack/react-query'
import { openMeteoGeocodeCity } from '@/lib/open-meteo-geocoding'

export type WeatherData = {
  currentTemp: number
  feelsLike: number
  high: number
  low: number
  code: number
}

export function useWeather(city: string | null | undefined) {
  return useQuery({
    queryKey: ['open-meteo-weather', city?.trim() ?? ''],
    enabled: Boolean(city?.trim()),
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async (): Promise<WeatherData | null> => {
      const g = await openMeteoGeocodeCity(city!.trim())
      if (!g) {
        return null
      }
      const u = new URL('https://api.open-meteo.com/v1/forecast')
      u.searchParams.set('latitude', String(g.lat))
      u.searchParams.set('longitude', String(g.lng))
      u.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code')
      u.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min')
      u.searchParams.set('timezone', 'Europe/Istanbul')
      u.searchParams.set('forecast_days', '1')
      const r = await fetch(u.toString())
      if (!r.ok) {
        return null
      }
      const j = (await r.json()) as {
        current?: { temperature_2m: number; apparent_temperature: number; weather_code: number }
        daily?: { temperature_2m_max: number[]; temperature_2m_min: number[] }
      }
      const c = j.current
      const d0 = j.daily?.temperature_2m_max?.[0]
      const d1 = j.daily?.temperature_2m_min?.[0]
      if (!c) {
        return null
      }
      return {
        currentTemp: c.temperature_2m,
        feelsLike: c.apparent_temperature,
        high: d0 ?? c.temperature_2m,
        low: d1 ?? c.temperature_2m,
        code: c.weather_code,
      }
    },
  })
}

/** Lucide / emoji-free label for weather code (WMO). */
export function weatherCodeLabelTr(code: number): string {
  if (code === 0) {
    return 'Açık'
  }
  if (code <= 3) {
    return 'Bulutlu'
  }
  if (code <= 48) {
    return 'Sis'
  }
  if (code <= 67 || code === 80 || code === 81 || code === 82) {
    return 'Yağmurlu'
  }
  if (code >= 71 && code <= 77) {
    return 'Karlı'
  }
  if (code >= 95) {
    return 'Fırtınalı'
  }
  return 'Değişken'
}
