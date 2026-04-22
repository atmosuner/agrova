/* eslint-disable lingui/no-unlocalized-strings -- TR user-facing; single place for error copy */

/**
 * Map sync / Supabase errors to short Turkish for the report-issue flow.
 * Unknown / empty falls back to a generic "try again" line.
 */
export function mapIssueSubmitError(e: unknown, fallback: string): string {
  if (e == null) {
    return fallback
  }
  const msg = e instanceof Error ? e.message : String(e)
  const lower = msg.toLowerCase()
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('load failed')) {
    return 'Ağ hatası. Bağlantınızı deneyin.'
  }
  if (msg.includes('42501') || lower.includes('permission denied') || lower.includes('row-level security')) {
    return 'Erişim engellendi. Oturumunuzu veya ekip atamanızı kontrol edin.'
  }
  if (lower.includes('object too large') || lower.includes('file size') || lower.includes('413')) {
    return 'Dosya büyük. Daha düşük çözünürlükte fotoğraf deneyin.'
  }
  if (msg.length > 0 && msg.length < 180) {
    return msg
  }
  return fallback
}
