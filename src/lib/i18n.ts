import { i18n, type Messages } from '@lingui/core'
// Compiled by `pnpm i18n:compile` (kept in repo for deterministic builds)
import { messages as enMessages } from '@/locales/en/messages'
import { messages as trMessages } from '@/locales/tr/messages'

export const locales = ['tr', 'en'] as const
export type AppLocale = (typeof locales)[number]

/** App UI copy defaults to Turkish (spec: tr primary). */
export const defaultLocale: AppLocale = 'tr'

const catalogs: Record<AppLocale, Messages> = {
  tr: trMessages,
  en: enMessages,
}

export function activateLocale(locale: AppLocale) {
  i18n.loadAndActivate({ locale, messages: catalogs[locale] })
}

activateLocale(defaultLocale)

export { i18n }
