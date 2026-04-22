# MCP Setup for Agrova

This project uses Cursor's **Model Context Protocol (MCP)** integrations so the AI agent can operate GitHub and Supabase directly — creating repos, running migrations, managing Actions, deploying edge functions, etc.

Two servers are configured in `.cursor/mcp.json`:

| Server | Transport | Auth |
|---|---|---|
| **GitHub** (remote, hosted by GitHub) | Streamable HTTP | Bearer GitHub Personal Access Token |
| **Supabase** (official, local via npx) | stdio | `SUPABASE_ACCESS_TOKEN` env var |

> **Why remote GitHub + local Supabase?** The npm `@modelcontextprotocol/server-github` package was deprecated in April 2025. GitHub now recommends either its Docker image or its remote hosted server — the hosted server is zero-install. The Supabase npx server is still actively maintained (v0.7.0 as of March 2026) and simpler than the remote Supabase option which requires an interactive OAuth flow.

## One-Time Setup

### 1. Create a GitHub Personal Access Token (classic)

1. Go to **https://github.com/settings/tokens** → **Generate new token (classic)**
2. **Note:** `Agrova MCP`
3. **Expiration:** 90 days (or longer — your call)
4. **Scopes to tick (full set requested in spec):**
   - `repo` (all sub-scopes)
   - `workflow`
   - `admin:repo_hook`
   - `gist`
   - `read:org`
   - `read:user`
5. Click **Generate token** and copy the `ghp_...` string immediately (it will never be shown again).

### 2. Create a Supabase Personal Access Token

1. Go to **https://supabase.com/dashboard/account/tokens**
2. Click **Generate new token**
3. **Name:** `Agrova Cursor MCP`
4. Copy the `sbp_...` token.

### 3. Get your Supabase project ref

1. Open your Supabase project dashboard.
2. Look at the URL: `https://supabase.com/dashboard/project/XXXXXXXXXXXXXXXX` — the `XXXXXXXXXXXXXXXX` part is your project ref.
3. Or go to **Settings → General → Reference ID**.

### 4. Paste all three values into `.cursor/mcp.json`

Open `.cursor/mcp.json` (the gitignored one, **not** `.cursor/mcp.json.example`) and replace the three placeholders:

- `PASTE_GITHUB_PAT_HERE` → your `ghp_...` token
- `PASTE_SUPABASE_PROJECT_REF_HERE` → your project ref
- `PASTE_SUPABASE_PAT_HERE` → your `sbp_...` token

### 5. Restart Cursor

After saving `mcp.json`, restart Cursor (or at least reload the window) so it picks up the new server definitions. In the chat panel you should see GitHub and Supabase tools available.

## What the Agent Can Do Once Configured

### GitHub MCP
- Create the `agrova` repository
- Push code, create branches, open PRs
- Configure GitHub Actions workflows (CI on every push)
- Manage issues, labels, releases
- Set branch protection rules
- Add secrets to the repo (for CI)
- Configure webhooks

### Supabase MCP
- Create tables and indexes (via SQL)
- Generate and apply migrations
- Manage Row-Level Security policies
- Create Storage buckets (for issue photos)
- Write and deploy Edge Functions (for Web Push fan-out, SMS setup links)
- Read the project configuration and connection strings
- Generate TypeScript types from the schema

## Security Notes

- `.cursor/mcp.json` contains **real tokens**. It is explicitly gitignored in `.gitignore` — never unignore it.
- `.cursor/mcp.json.example` is safe to commit; it contains placeholder strings only.
- Rotate the tokens every 90 days, or immediately if you suspect compromise.
- Both tokens give full write access to their respective services. Treat them like passwords.
- If you share your laptop or commit suspiciously to a public repo, revoke and regenerate at:
  - https://github.com/settings/tokens
  - https://supabase.com/dashboard/account/tokens

## Troubleshooting

### Cursor doesn't show the MCP servers
1. Confirm the file is named exactly `.cursor/mcp.json` (not `.cursor/mcp.json.example`).
2. Confirm the JSON is valid (`cat .cursor/mcp.json | jq` should not error).
3. Restart Cursor fully (Cmd-Q + reopen, not just window reload).
4. Open Cursor → **Settings → MCP** to see connection status and error logs.

### GitHub MCP says "401 Unauthorized"
- The PAT expired or is missing a required scope. Regenerate with the full scope list above.

### Supabase MCP says "Invalid project ref" or "Invalid access token"
- The `--project-ref=` argument is wrong, or the `SUPABASE_ACCESS_TOKEN` is a project API key (`anon` or `service_role`) instead of a **personal access token**. Only `sbp_...` tokens work here.

### `npx` is slow on first call
- Expected — Cursor downloads `@supabase/mcp-server-supabase` the first time. Subsequent calls use the npm cache.

## Updating the Server Versions

Both servers pin to `@latest` by design so you always get the newest features. If you need to pin a specific version (e.g., the Supabase MCP ships a breaking change):

```json
"@supabase/mcp-server-supabase@0.7.0"
```

Review changelogs before updating:
- Supabase: https://github.com/supabase-community/supabase-mcp/releases
- GitHub: https://github.com/github/github-mcp-server/releases
