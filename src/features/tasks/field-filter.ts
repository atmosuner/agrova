/* eslint-disable lingui/no-unlocalized-strings -- locale code, not user-visible text */
function norm(s: string): string {
  return s.toLocaleLowerCase('tr-TR')
}

/** Case- and Turkish-locale–insensitive substring match for field name / crop. */
export function fieldMatchesQuery(name: string, crop: string, q: string): boolean {
  const t = q.trim()
  if (!t) {
    return true
  }
  const nq = norm(t)
  return norm(name).includes(nq) || norm(crop).includes(nq)
}
