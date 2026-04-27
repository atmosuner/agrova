/**
 * Crude 0–4 password strength heuristic. Intentionally local — we don't want
 * a dependency for a UX hint, and the score never leaves the client.
 */
export function scorePassword(value: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4
}
