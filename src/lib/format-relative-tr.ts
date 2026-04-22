import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

/** Short relative time, Turkish ("3 dakika önce"). */
export function formatShortTr(d: Date): string {
  return formatDistanceToNow(d, { addSuffix: true, locale: tr })
}
