/* eslint-disable lingui/no-unlocalized-strings -- system device domain, not translatable copy */
/** Canonical device login e-mail from `people.id` (matches `create-team-person` / `claim-setup-token`). */
export function deviceLoginEmailFromPersonId(personId: string): string {
  return `w${personId.replace(/-/g, '')}@device.agrova.app`
}
