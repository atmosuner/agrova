/* eslint-disable lingui/no-unlocalized-strings -- dev-only; remove this module when debugging is done */
/**
 * Temporary notification pipeline logging. Remove or gate once debugging is done.
 * - On in dev, or VITE_NOTIFY_DEBUG=1 in .env, or (edge) NOTIFY_DEBUG=1
 * - Off in Vitest to avoid noise
 */
export function notifyDebug(phase: string, detail?: unknown): void {
  if (import.meta.env.MODE === 'test') {
    return
  }
  const enabled = Boolean(import.meta.env.DEV) || import.meta.env.VITE_NOTIFY_DEBUG === '1'
  if (!enabled) {
    return
  }
  if (detail !== undefined) {
    console.info(`[agrova:notify] ${phase}`, detail)
  } else {
    console.info(`[agrova:notify] ${phase}`)
  }
}
