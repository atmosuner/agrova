/* eslint-disable lingui/no-unlocalized-strings -- query keys / PostgREST field names */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Enums } from '@/types/db'

export type DateRange = 7 | 30 | 90

type TaskRow = {
  status: Enums<'task_status'>
  activity: string
  created_at: string
  completed_at: string | null
  due_date: string
  field_id: string
  assignee_id: string
}

type IssueRow = {
  category: Enums<'issue_category'>
  created_at: string
  resolved_at: string | null
}

type FieldRef = { id: string; name: string }
type PersonRef = { id: string; full_name: string }

export type WeekBucket = { week: string; done: number; inProgress: number; other: number }
export type CategoryBucket = { category: Enums<'issue_category'>; count: number }
export type FieldBucket = { fieldId: string; fieldName: string; count: number }
export type WorkerBucket = { personId: string; personName: string; completed: number }

export type ReportData = {
  kpis: {
    totalTasks: number
    completedTasks: number
    completionRate: number
    openIssues: number
    avgResolutionDays: number | null
  }
  weeklyTasks: WeekBucket[]
  issuesByCategory: CategoryBucket[]
  tasksByField: FieldBucket[]
  tasksByWorker: WorkerBucket[]
}

function startOfRange(days: DateRange): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function isoWeek(iso: string): string {
  const d = new Date(iso)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().slice(0, 10)
}

async function fetchReportData(days: DateRange): Promise<ReportData> {
  const since = startOfRange(days)

  const [tasksRes, issuesRes, fieldsRes, peopleRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('status, activity, created_at, completed_at, due_date, field_id, assignee_id')
      .gte('created_at', since),
    supabase
      .from('issues')
      .select('category, created_at, resolved_at')
      .gte('created_at', since),
    supabase.from('fields').select('id, name'),
    supabase.from('people').select('id, full_name'),
  ])

  const tasks: TaskRow[] = (tasksRes.data ?? []) as TaskRow[]
  const issues: IssueRow[] = (issuesRes.data ?? []) as IssueRow[]
  const fieldsMap = new Map((fieldsRes.data as FieldRef[] ?? []).map((f) => [f.id, f.name]))
  const peopleMap = new Map((peopleRes.data as PersonRef[] ?? []).map((p) => [p.id, p.full_name]))

  // KPIs
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const openIssues = issues.filter((i) => !i.resolved_at).length

  const resolvedIssues = issues.filter((i) => i.resolved_at)
  let avgResolutionDays: number | null = null
  if (resolvedIssues.length > 0) {
    const totalMs = resolvedIssues.reduce((sum, i) => {
      return sum + (new Date(i.resolved_at!).getTime() - new Date(i.created_at).getTime())
    }, 0)
    avgResolutionDays = Math.round((totalMs / resolvedIssues.length / (1000 * 60 * 60 * 24)) * 10) / 10
  }

  // Weekly task breakdown
  const weekMap = new Map<string, WeekBucket>()
  for (const t of tasks) {
    const w = isoWeek(t.created_at)
    const bucket = weekMap.get(w) ?? { week: w, done: 0, inProgress: 0, other: 0 }
    if (t.status === 'DONE') bucket.done++
    else if (t.status === 'IN_PROGRESS') bucket.inProgress++
    else bucket.other++
    weekMap.set(w, bucket)
  }
  const weeklyTasks = [...weekMap.values()].sort((a, b) => a.week.localeCompare(b.week))

  // Issues by category
  const catMap = new Map<Enums<'issue_category'>, number>()
  for (const i of issues) {
    catMap.set(i.category, (catMap.get(i.category) ?? 0) + 1)
  }
  const issuesByCategory: CategoryBucket[] = [...catMap.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  // Tasks by field (top 5)
  const fieldCount = new Map<string, number>()
  for (const t of tasks) {
    fieldCount.set(t.field_id, (fieldCount.get(t.field_id) ?? 0) + 1)
  }
  const tasksByField: FieldBucket[] = [...fieldCount.entries()]
    .map(([fieldId, count]) => ({ fieldId, fieldName: fieldsMap.get(fieldId) ?? fieldId.slice(0, 8), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Tasks by worker (top 5 completed)
  const workerDone = new Map<string, number>()
  for (const t of tasks) {
    if (t.status === 'DONE') {
      workerDone.set(t.assignee_id, (workerDone.get(t.assignee_id) ?? 0) + 1)
    }
  }
  const tasksByWorker: WorkerBucket[] = [...workerDone.entries()]
    .map(([personId, completed]) => ({
      personId,
      personName: peopleMap.get(personId) ?? personId.slice(0, 8),
      completed,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5)

  return {
    kpis: { totalTasks, completedTasks, completionRate, openIssues, avgResolutionDays },
    weeklyTasks,
    issuesByCategory,
    tasksByField,
    tasksByWorker,
  }
}

export function useReportData(days: DateRange) {
  return useQuery({
    queryKey: ['reports', days],
    queryFn: () => fetchReportData(days),
    staleTime: 5 * 60 * 1000,
  })
}
