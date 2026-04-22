import { z } from 'zod'

/* eslint-disable lingui/no-unlocalized-strings -- DB enum values, not UI */
const categories = z.enum(['VEHICLE', 'TOOL', 'CHEMICAL', 'CRATE'])
/* eslint-enable lingui/no-unlocalized-strings */

export const equipmentFormSchema = z.object({
  name: z.string().trim().min(1),
  notes: z.string().optional().default(''),
})

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>

export type EquipmentCategory = z.infer<typeof categories>

export function parseEquipmentSearch(search: Record<string, unknown>): { cat: EquipmentCategory } {
  /* eslint-disable lingui/no-unlocalized-strings */
  const raw = typeof search.cat === 'string' ? search.cat : 'VEHICLE'
  /* eslint-enable lingui/no-unlocalized-strings */
  const p = categories.safeParse(raw)
  /* eslint-disable-next-line lingui/no-unlocalized-strings -- DB default */
  return { cat: p.success ? p.data : 'VEHICLE' }
}
