/* eslint-disable lingui/no-unlocalized-strings -- user-facing TR error copy */
/**
 * Map PostgREST / Postgres errors to Turkish user copy.
 * Code 23505 = unique_violation (e.g. duplicate phone on people).
 */
export function mapPeopleMutationError(message: string, code: string | undefined): string {
  if (code === '23505' || message.toLowerCase().includes('unique') || message.includes('23505')) {
    return 'Bu telefon numarası zaten kayıtlı.'
  }
  return message
}
