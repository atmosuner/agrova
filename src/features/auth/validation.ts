/* eslint-disable lingui/no-unlocalized-strings -- Zod user-facing .message is Turkish; mirrors form labels */
import { z } from 'zod'

/** E.164; matches `people_phone_e164` in database. */
export const e164PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{1,14}$/, { message: 'Geçerli bir E.164 telefon girin (örn. +905551234567).' })

/** Sign-up password: ≥8 chars, at least one digit (plan M1-01). */
export const signUpPasswordSchema = z
  .string()
  .min(8, { message: 'Şifre en az 8 karakter olmalı.' })
  .regex(/[0-9]/, { message: 'Şifrede en az bir rakam olmalı.' })

export const signUpFormSchema = z
  .object({
    email: z.string().trim().email({ message: 'Geçerli bir e-posta girin.' }),
    fullName: z.string().trim().min(1, { message: 'Ad soyad gerekli.' }).max(200),
    phone: e164PhoneSchema,
    password: signUpPasswordSchema,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Şifreler eşleşmiyor.',
  })

export type SignUpFormValues = z.infer<typeof signUpFormSchema>

export const loginFormSchema = z.object({
  email: z.string().trim().email({ message: 'Geçerli bir e-posta girin.' }),
  password: z.string().min(1, { message: 'Şifre gerekli.' }),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
