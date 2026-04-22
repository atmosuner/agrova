/**
 * Run Lighthouse against /today (unauthenticated: redirects to /login; still valid M7-ω baseline).
 * Requires `vite preview` on the URL port (e.g. `pnpm build && pnpm preview --port 4173`).
 * Outputs: docs/lighthouse/m7-today.report.html + m7-today.report.json
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outBase = path.join(root, 'docs', 'lighthouse', 'm7-today')
const url = process.env['LIGHTHOUSE_URL'] ?? 'http://127.0.0.1:4173/today'

function waitForServer(hostname, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tryOnce = () => {
      const req = http.get({ hostname, port, path: '/', timeout: 3000 }, (res) => {
        res.resume()
        if (res.statusCode != null) {
          resolve()
          return
        }
        retry()
      })
      req.on('error', () => retry())
      function retry() {
        if (Date.now() - t0 > timeoutMs) {
          reject(new Error(`No HTTP server on http://${hostname}:${port}`))
          return
        }
        setTimeout(tryOnce, 400)
      }
    }
    tryOnce()
  })
}

const u = new URL(url)
const port = parseInt(u.port || '4173', 10)
const host = u.hostname

await waitForServer(host, port, 45_000).catch((e) => {
  console.error(
    e.message,
    '\n\nStart preview in another shell: pnpm build && pnpm preview --port 4173\nThen: pnpm lh:report',
  )
  process.exit(1)
})

const lighthouseBin = path.join(root, 'node_modules', 'lighthouse', 'cli', 'index.js')
if (!fs.existsSync(lighthouseBin)) {
  console.error('Lighthouse not found. Run: pnpm install')
  process.exit(1)
}

const args = [
  lighthouseBin,
  url,
  '--output=html,json',
  `--output-path=${outBase}`,
  '--quiet',
  '--chrome-flags=--headless --no-sandbox --disable-gpu',
]
execFileSync(process.execPath, args, { stdio: 'inherit' })
const repHtml = path.join(root, 'docs', 'lighthouse', 'm7-today.report.html')
const repJson = path.join(root, 'docs', 'lighthouse', 'm7-today.report.json')
const wHtml = path.join(root, 'docs', 'lighthouse', 'm7-ω.html')
if (fs.existsSync(repHtml)) {
  fs.copyFileSync(repHtml, wHtml)
}
if (fs.existsSync(repJson)) {
  fs.copyFileSync(repJson, path.join(root, 'docs', 'lighthouse', 'm7-ω.json'))
}
console.log('Wrote: docs/lighthouse/m7-today.report.*, m7-ω.html (copy for M7-ω), m7-ω.json')
