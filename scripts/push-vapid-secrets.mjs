#!/usr/bin/env node
/**
 * Generate VAPID keys and install them as Supabase Edge Function secrets, then redeploy
 * push-related functions. Requires a Supabase **personal access token** (not the anon key):
 *   Dashboard → Account → Access tokens
 *
 * Set in root `.env` (gitignored):
 *   SUPABASE_ACCESS_TOKEN=sbp_...
 * Optional: VAPID_SUBJECT=mailto:you@example.com
 *
 * If the token is missing from `.env`, the script also tries `.cursor/mcp.json` →
 * `mcpServers.*.env.SUPABASE_ACCESS_TOKEN` (same token as the Supabase MCP).
 *
 * Usage: pnpm vapid:push-secrets
 */
import { readFileSync, unlinkSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import webpush from 'web-push'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadRootEnv() {
  const p = join(root, '.env')
  if (!existsSync(p)) {
    return
  }
  const raw = readFileSync(p, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) {
      continue
    }
    const i = t.indexOf('=')
    if (i <= 0) {
      continue
    }
    const k = t.slice(0, i).trim()
    let v = t.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[k] == null || process.env[k] === '') {
      process.env[k] = v
    }
  }
}

function loadMcpSupabaseToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return
  }
  const p = join(root, '.cursor', 'mcp.json')
  if (!existsSync(p)) {
    return
  }
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'))
    const servers = j.mcpServers
    if (!servers || typeof servers !== 'object') {
      return
    }
    for (const s of Object.values(servers)) {
      const t = s?.env?.SUPABASE_ACCESS_TOKEN
      if (typeof t === 'string' && t.length > 0) {
        process.env.SUPABASE_ACCESS_TOKEN = t
        return
      }
    }
  } catch {
    // ignore invalid JSON
  }
}

function projectRefFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null
  }
  try {
    const h = new URL(url).hostname
    const m = h.match(/^([a-z0-9]+)\.supabase\.co$/i)
    return m ? m[1] : null
  } catch {
    return null
  }
}

const ENV_FILE = join(root, 'supabase', '.vapid-generated.env')

loadRootEnv()
loadMcpSupabaseToken()

const { publicKey, privateKey } = webpush.generateVAPIDKeys()
const subject = process.env.VAPID_SUBJECT || 'mailto:ops@agrova.app'
const ref = process.env.SUPABASE_PROJECT_REF || projectRefFromUrl(process.env.VITE_SUPABASE_URL)
const token = process.env.SUPABASE_ACCESS_TOKEN

const lines = [
  `VAPID_PUBLIC_KEY=${publicKey}`,
  `VAPID_PRIVATE_KEY=${privateKey}`,
  `VAPID_SUBJECT=${subject}`,
  '',
].join('\n')

writeFileSync(ENV_FILE, lines, { mode: 0o600 })
console.log('Wrote', ENV_FILE, '(gitignored) — you can delete this file after secrets are in Supabase.')

if (!ref) {
  console.error('Missing project ref. Set VITE_SUPABASE_URL or SUPABASE_PROJECT_REF in .env')
  process.exit(1)
}

if (!token) {
  console.log('')
  console.log('No SUPABASE_ACCESS_TOKEN in .env — skipping CLI upload and deploy.')
  console.log('1) Create a token: https://supabase.com/dashboard/account/tokens')
  console.log('2) Add: SUPABASE_ACCESS_TOKEN=sbp_...  to your .env')
  console.log('3) Run: pnpm vapid:push-secrets')
  console.log('OR paste the three variables from the file into Dashboard → Project Settings → Edge Functions → Secrets')
  process.exit(0)
}

const setSecrets = spawnSync(
  'npx',
  ['-y', 'supabase@2', 'secrets', 'set', '--env-file', ENV_FILE, '--project-ref', ref],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  },
)
if (setSecrets.status !== 0) {
  console.error('supabase secrets set failed. Check SUPABASE_ACCESS_TOKEN and project ref.')
  process.exit(1)
}

console.log('Secrets updated. Redeploying functions…')

const deployNames = ['get-vapid-public-key', 'web-push-fanout', 'daily-digest']
for (const name of deployNames) {
  const r = spawnSync(
    'npx',
    ['-y', 'supabase@2', 'functions', 'deploy', name, '--project-ref', ref],
    {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
    },
  )
  if (r.status !== 0) {
    console.error(`Deploy failed for ${name} (exit ${r.status})`)
    process.exit(1)
  }
}

try {
  unlinkSync(ENV_FILE)
  console.log('Removed', ENV_FILE)
} catch {
  // ignore
}

console.log('Done. Test (add anon in headers; see docs/operations/vapid-and-web-push.md):')
console.log('  curl -sS "https://' + ref + '.supabase.co/functions/v1/get-vapid-public-key" -H "apikey: <anon>" -H "Authorization: Bearer <anon>"')
process.exit(0)
