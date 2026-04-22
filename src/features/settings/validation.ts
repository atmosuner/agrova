/* eslint-disable lingui/no-unlocalized-strings -- Zod user messages in Turkish */
import { z } from 'zod'

export const operationSettingsFormSchema = z.object({
  operationName: z.string().trim().min(1, { message: 'İşletme adı gerekli.' }),
  weatherCity: z.string().trim().min(1, { message: 'Şehir adı gerekli (örn. Antalya).' }),
})

export type OperationSettingsFormValues = z.infer<typeof operationSettingsFormSchema>
