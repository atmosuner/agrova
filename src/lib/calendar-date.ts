/** Add calendar days to a YYYY-MM-DD string (local calendar, no time-of-day). */
export function addCalendarDaysToIsoDate(iso: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) {
    throw new Error('expected YYYY-MM-DD')
  }
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const t = new Date(y, mo - 1, d)
  t.setDate(t.getDate() + days)
  const yy = t.getFullYear()
  const mm = String(t.getMonth() + 1).padStart(2, '0')
  const dd = String(t.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}
