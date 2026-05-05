# Sub-agent worktree setup

Run this **before any other work** when spawned into an isolated git worktree:

```bash
bash .claude/scripts/worktree-setup.sh <port>
```

## Port assignments

| Task | Port |
|---|---|
| Portfolio analytics | 3001 |
| Position detail | 3002 |
| (future agents) | 3003+ |

## What the script does

1. Copies `.dev.vars` from the main worktree (gitignored — not in worktree by default)
2. Runs `pnpm install --frozen-lockfile` (fast — pnpm store is shared, just creates symlinks)
3. Prints the dev server start command

## Workflow

```bash
# 1. Setup
bash .claude/scripts/worktree-setup.sh 3001

# 2. Start dev server in background
pnpm dev --port 3001 > /tmp/dev-<task>.log 2>&1 &

# 3. Wait for Vite to be ready (~8s), then test
sleep 8 && agent-browser open http://localhost:3001/
```

## Before opening a PR

1. `pnpm typecheck` — must be clean
2. Visual test every changed route with `agent-browser` + screenshot
3. `gh pr create` targeting `master`
