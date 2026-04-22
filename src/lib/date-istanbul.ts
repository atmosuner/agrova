/* eslint-disable lingui/no-unlocalized-strings */
import { endOfWeek, startOfWeek } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

const TZ = 'Europe/Istanbul'

/** Calendar date in Europe/Istanbul as `YYYY-MM-DD` (for `tasks.due_date` comparisons). */
export function todayISODateInIstanbul(d = new Date()): string {
  return formatInTimeZone(d, TZ, 'yyyy-MM-dd')
}

/** Monday–Sunday bounds in Istanbul, as `YYYY-MM-DD`. */
export function thisWeekRangeISODateInIstanbul(d = new Date()): { start: string; end: string } {
  const z = toZonedTime(d, TZ)
  const s = startOfWeek(z, { weekStartsOn: 1 })
  const e = endOfWeek(z, { weekStartsOn: 1 })
  return {
    start: formatInTimeZone(s, TZ, 'yyyy-MM-dd'),
    end: formatInTimeZone(e, TZ, 'yyyy-MM-dd'),
  }
}

/** Calendar add (UTC midline) for range endpoints — OK for 7d history paging. */
export function addDaysToISODate(iso: string, deltaDays: number): string {
  const parts = iso.split('-').map((x) => Number(x))
  const Y = parts[0] ?? 0
  const M = parts[1] ?? 1
  const D = parts[2] ?? 1
  const t = new Date(Date.UTC(Y, M - 1, D) + deltaDays * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t)
}

export function formatDayMonthTr(iso: string): string {
  const [Y, M, D] = iso.split('-').map(Number)
  if (!Y || !M || !D) {
    return iso
  }
  const d = new Date(Date.UTC(Y, M - 1, D, 12, 0, 0))
  return new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ }).format(d)
}
