/**
 * GitHub Pages has no server rewrite to index.html. Serving `index.html` for
 * unknown paths via `404.html` is the standard static-host SPA pattern.
 * @see https://github.com/orgs/community/discussions/64096
 */
import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const index = join(root, 'dist', 'index.html')
const fallback = join(root, 'dist', '404.html')

if (!existsSync(index)) {
  console.error('emit-github-pages-spa: dist/index.html missing. Run pnpm build first.')
  process.exit(1)
}
copyFileSync(index, fallback)
console.log('emit-github-pages-spa: wrote dist/404.html')
