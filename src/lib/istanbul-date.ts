/* eslint-disable lingui/no-unlocalized-strings -- locale + IANA timezone identifiers */
/** YYYY-MM-DD in Europe/Istanbul (for <input type="date" /> `min` + due-date rules). */
export function istanbulDateString(d = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}
