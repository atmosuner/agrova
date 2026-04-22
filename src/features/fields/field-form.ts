import { z } from 'zod'

export const fieldFormSchema = z.object({
  name: z.string().trim().min(1, 'name_required'),
  crop: z.string().optional().default(''),
  variety: z.string().optional().default(''),
  plantCount: z.string().optional().default(''),
  plantedYear: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  address: z.string().optional().default(''),
})

export type FieldFormInput = z.infer<typeof fieldFormSchema>
