import { t } from '@lingui/macro'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useRef, useState } from 'react'
import { CategoryGrid } from '@/features/issues/CategoryGrid'
import type { IssueCategory } from '@/features/issues/categories'

function parseReportIssueSearch(s: Record<string, unknown>): {
  taskId?: string
  fieldId?: string
} {
  const taskId = typeof s['taskId'] === 'string' ? s['taskId'] : undefined
  const fieldId = typeof s['fieldId'] === 'string' ? s['fieldId'] : undefined
  return { taskId, fieldId }
}

export const Route = createFileRoute('/m/report-issue')({
  validateSearch: (s: Record<string, unknown>) => parseReportIssueSearch(s),
  component: ReportIssuePage,
})

function ReportIssuePage() {
  const { taskId } = Route.useSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busyCategory, setBusyCategory] = useState<IssueCategory | null>(null)

  const openCameraForCategory = useCallback((category: IssueCategory) => {
    setBusyCategory(category)
    requestAnimationFrame(() => {
      inputRef.current?.click()
    })
  }, [])

  return (
    <div className="px-4 pb-6 pt-4">
      {taskId ? (
        <Link to="/m/task/$id" params={{ id: taskId }} className="text-sm text-orchard-600">
          ← {t`Göreve dön`}
        </Link>
      ) : (
        <Link to="/m/tasks" className="text-sm text-orchard-600">
          ← {t`Görevler`}
        </Link>
      )}
      <h1 className="mt-3 text-xl font-semibold text-fg">{t`Sorun bildir`}</h1>
      {taskId ? (
        <p className="mt-1 text-sm text-fg-secondary">{t`Bu sorun seçili göreve bağlanır.`}</p>
      ) : (
        <p className="mt-1 text-sm text-fg-secondary">{t`Kategori seçince kamera açılır.`}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        onChange={(e) => {
          e.target.value = ''
          setBusyCategory(null)
        }}
      />

      <div className="mt-6">
        <CategoryGrid onSelectCategory={openCameraForCategory} disabled={busyCategory !== null} />
      </div>
    </div>
  )
}
