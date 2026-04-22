import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outPath = path.join(root, 'src/types/db.ts')
const mcpPath = path.join(root, 'supabase/mcp_gentypes.json')

const banner = `/**
 * AUTO-GENERATED — DO NOT EDIT BY HAND
 * Regenerate: pnpm supabase:gen-types
 * Sources: (1) supabase/mcp_gentypes.json from Cursor "generate_typescript_types" MCP, or
 * (2) npx supabase gen types (needs SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF; see .env.example).
 * ESLint: src/types/db.ts is in eslint.config.js globalIgnores (generated string literals, not UI).
 */

`

function writeDb(types) {
  fs.writeFileSync(outPath, `${banner}\n${types}\n`, 'utf8')
}

if (fs.existsSync(mcpPath)) {
  const { types } = JSON.parse(fs.readFileSync(mcpPath, 'utf8'))
  writeDb(types)
  process.exit(0)
}

const projectRef = process.env.SUPABASE_PROJECT_REF
const token = process.env.SUPABASE_ACCESS_TOKEN
if (projectRef && token) {
  const types = execSync(
    `npx -y supabase@2 gen types typescript --project-id ${JSON.stringify(projectRef)} -s public`,
    { encoding: 'utf8', env: { ...process.env, SUPABASE_ACCESS_TOKEN: token } }
  )
  writeDb(types)
  fs.writeFileSync(mcpPath, JSON.stringify({ types }, null, 0) + '\n', 'utf8')
  process.exit(0)
}

console.error(
  'supabase:gen-types: add supabase/mcp_gentypes.json (MCP) or set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN for CLI.',
)
process.exit(1)
