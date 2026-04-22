/* eslint-disable lingui/no-unlocalized-strings -- Zod .message in Turkish for forms */
import { z } from 'zod'

const crewRoles = ['FOREMAN', 'AGRONOMIST', 'WORKER'] as const
const crewRoleEnum = z.enum(crewRoles)

/**
 * TR mobile: user may paste 0555… or 555…; we normalize to +905… (10 national digits after 90).
 */
export function normalizeTrMobileToE164(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('90')) {
    return `+${digits}`
  }
  if (digits.length === 10 && digits.startsWith('5')) {
    return `+90${digits}`
  }
  if (digits.length === 11 && digits.startsWith('0') && digits[1] === '5') {
    return `+90${digits.slice(1)}`
  }
  return raw.replace(/\s/g, '')
}

/** M1-03: E.164 TR mobile +90 5xx … (10 digits after 90) */
const trMobileE164 = z
  .string()
  .min(1, { message: 'Telefon gerekli.' })
  .transform((s) => normalizeTrMobileToE164(s))
  .refine((s) => /^\+905[0-9]{9}$/.test(s), {
    message: 'Cep: +90 5xx xxx xx xx (ör. +905551234567).',
  })

export const teamPersonFormSchema = z.object({
  fullName: z.string().trim().min(1, { message: 'Ad soyad gerekli.' }),
  phone: trMobileE164,
  role: crewRoleEnum,
})

export type TeamPersonFormValues = z.infer<typeof teamPersonFormSchema>

export type PersonRoleCrew = (typeof crewRoles)[number]
