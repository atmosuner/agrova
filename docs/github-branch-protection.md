# Branch protection for `main` (M0-10)

Apply these rules in the GitHub **UI** (or via `gh` API) so `main` only moves through PRs with green CI. No app code change is required for this milestone.

## Required settings

1. **Repository** → **Settings** → **Branches** → **Add branch ruleset** (or *Branch protection rule* on classic “branch name pattern” `main`).

2. **Require a pull request before merging** (optional for solo: you can allow self-approve with 0/1 review).

3. **Require status checks to pass**  
   - Enable **Require status checks to pass before merging** (and, if available, *Require branches to be up to date*).  
   - Select the check that comes from this repo’s workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).  
   - The job is named: **`lint · typecheck · test+coverage · build`**. In the checks picker it may also appear as **`CI / lint · typecheck · test+coverage · build`** (workflow file name + job name). After the first successful run on `main`, the exact name is visible in the list.

4. **Block force-pushes** to `main`.  
5. **Block deletions** of `main` (if offered).  
6. **Do not** allow “bypass” for administrators if you want the rules to always apply to you (solo dev: your choice).  
7. **Linear history** (optional): require squash merge or “linear history” if your org supports it in rulesets.

## Optional: `gh` CLI (requires `repo` or `admin:org` scope)

After CI has run at least once, you can set required checks via API. The status context string must match what GitHub reports (get it from a recent run’s “Check run” name).

```bash
# Inspect current protection
gh api repos/{owner}/{repo}/branches/main/protection 2>/dev/null || true
```

Replace `{owner}` / `{repo}` with `atmosuner` / `agrova` if using the public repo.

## Verify

- A direct `git push origin main` from a machine without admin bypass should be **rejected** once the ruleset is active and default branch is protected.  
- A PR that fails CI should not be mergeable (when “require branches up to date” is on, re-run may be needed after pushing fixes).

## Related

- CI workflow: [`../.github/workflows/ci.yml`](../.github/workflows/ci.yml)
