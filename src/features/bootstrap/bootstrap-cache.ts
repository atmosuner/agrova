/* eslint-disable lingui/no-unlocalized-strings */
import { supabase } from '@/lib/supabase'
import { db } from '@/lib/db'
import { todayISODateInIstanbul } from '@/lib/date-istanbul'
import { activityDbValue, ACTIVITY_IDS } from '@/features/tasks/activities'
import type { Json } from '@/types/db'

export async function bootstrapReadCachesForWorker(personId: string): Promise<void> {
  const [fieldsRes, peopleRes, todayRes] = await Promise.all([
    supabase.from('fields').select('id, name'),
    supabase.from('people').select('id, full_name, phone, role'),
    supabase
      .from('tasks')
      .select('id, activity, status, priority, due_date, field_id, assignee_id, fields ( name )')
      .eq('assignee_id', personId)
      .eq('due_date', todayISODateInIstanbul()),
  ])
  if (fieldsRes.error) {
    throw fieldsRes.error
  }
  if (peopleRes.error) {
    throw peopleRes.error
  }
  if (todayRes.error) {
    throw todayRes.error
  }
  await db.transaction('rw', db.fields, db.people, db.activities, db.tasks_today, async () => {
    await db.fields.clear()
    await db.people.clear()
    await db.activities.clear()
    await db.tasks_today.clear()
    for (const f of fieldsRes.data ?? []) {
      const row = f as { id: string; name: string }
      await db.fields.put({ id: row.id, name: row.name, data: (row as unknown as Json) ?? {} })
    }
    for (const p of peopleRes.data ?? []) {
      const row = p as { id: string; full_name: string; phone: string; role: string }
      await db.people.put({
        id: row.id,
        full_name: row.full_name,
        phone: row.phone,
        role: row.role,
        data: (row as unknown as Json) ?? {},
      })
    }
    for (const id of ACTIVITY_IDS) {
      await db.activities.put({ id, label: activityDbValue(id) })
    }
    for (const t of todayRes.data ?? []) {
      const row = t as { id: string; due_date: string }
      await db.tasks_today.put({ id: row.id, due_date: row.due_date, data: t as unknown as Json })
    }
  })
}
