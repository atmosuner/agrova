/* eslint-disable lingui/no-unlocalized-strings -- CSV MIME, filename prefix, and extension are not translatable */
import Papa from 'papaparse'

const BOM = '\uFEFF'

export function downloadUnparse(
  data: (string | number | boolean | null)[][],
  filePrefix: string
): void {
  const date = yyyymmdd(new Date())
  const csv = BOM + Papa.unparse(data, { skipEmptyLines: 'greedy' })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filePrefix}-${date}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function yyyymmdd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}
/* eslint-enable lingui/no-unlocalized-strings */
