/* eslint-disable lingui/no-unlocalized-strings -- Zod enum keys match DB */
import { z } from 'zod'

const priority = z.enum(['LOW', 'NORMAL', 'URGENT'])

/** Due date ≥ today (Europe/Istanbul) must be checked at submit (see task modal). */
export const createTaskStep3Schema = z.object({
  assigneeId: z.string().uuid(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  priority,
  notes: z.string().max(500),
})

export type CreateTaskStep3Values = z.infer<typeof createTaskStep3Schema>
