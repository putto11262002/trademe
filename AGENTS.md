# AGENTS.md

Instructions for AI agents (Claude Code, Cursor, etc.) working in this repo.

## Context docs

| Doc | When to read |
|---|---|
| [`docs/v0.md`](docs/v0.md) | Always — current scope, what's shipped, gaps & drift |
| [`docs/IDEA.md`](docs/IDEA.md) | Long-term vision — what v0 is building toward |
| [`docs/architecture.md`](docs/architecture.md) | Deeper technical decisions beyond this file |

## Project

**Pholio** — early-scaffold trading dashboard. Public repo `putto11262002/trademe`, default branch `master`.

| | |
|---|---|
| Frontend | TanStack Start (Vite, SPA mode) · React 19 · Tailwind v4 · shadcn (radix-luma style) |
| Backend | Cloudflare Worker (no Nitro) · Drizzle ORM · Neon Postgres (HTTP driver) |
| Deploy | Prod: `https://pholio.markets` · Previews: `https://pr-N-pholio.sabaipics.workers.dev` |
| CI/CD | GitHub Actions (`.github/workflows/`) |

## Commands

| | |
|---|---|
| `pnpm dev` | Vite dev with miniflare-emulated Worker (reads `.dev.vars`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | Build Worker bundle + client assets + prerender |
| `pnpm db:generate` | Emit SQL migration in `drizzle/` from current schema diff |
| `pnpm db:migrate` | Apply pending migrations to whatever `DATABASE_URL` points at — **user-only, see Rules** |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm cf:types` | Regen `worker-configuration.d.ts` from `wrangler.jsonc` |
| `pnpm deploy` | Local prod deploy (`vite build && wrangler deploy`) — **user-only** |

## Architecture (high level)

**Single-Worker app.** Vite builds via `@cloudflare/vite-plugin`; the entire app deploys as one Cloudflare Worker. No Nitro layer.

**Worker entry** at `src/server/worker.ts` wraps TanStack's `fetch` handler. It is the seam for non-HTTP handlers later (`scheduled`, `queue`, `email`). `/api/health` lives there as a smoke endpoint; production routes should be TanStack server functions or file routes, not added to `worker.ts`.

**Database layer.** `src/db/index.server.ts` exposes `getDb()` — lazy-initialized (do not eagerly construct DB clients at module top-level; breaks prerender and cold starts). Schema lives centrally per-table under `src/db/schema/*.ts` with a barrel — modules import from `@/db/schema`. Migrations are version-controlled under `drizzle/`.

**Two connection paths to the same Neon DB.**
- Worker runtime: `process.env.DATABASE_URL`, set as a CF Worker `--var` at deploy time
- `drizzle-kit` (CLI): `process.env.DATABASE_URL` from `.env` (local) or GH secret (CI)

**Neon branches.** `production` (prod) → `dev` is a fork used for local work (`.env` points here) → `preview/pr-N` are auto-created per PR off `production`, deleted on PR close.

**CI/CD workflows** in `.github/workflows/`:
- `pr.yml` (PR open/sync): create Neon branch off `production` → migrate → `wrangler versions upload --preview-alias pr-N` → comment preview URL
- `pr-cleanup.yml` (PR close): delete the per-PR Neon branch
- `deploy.yml` (push to master): migrate prod Neon (always; idempotent) → `wrangler deploy`

## Conventions

**File and folder naming.** kebab-case everywhere (`trade-form.tsx`). React component exports stay PascalCase. Named exports only — no `export default` except where TanStack file routes require it. Always import via `@/...` alias.

**Server / client boundary.** Suffix signals bundle target:

| Suffix | Kind |
|---|---|
| `*.server.ts(x)` | Server-only — touches `db`, `env`, secrets. Never imported by routes/components. Stripped from client. |
| `*.client.ts(x)` | Client-only — browser APIs. Rare. |
| `*.ts(x)` (no suffix) | Isomorphic — types, schema (types only), components, routes, `createServerFn` wrappers. |

Import server files with the suffix in the path (`@/db/index.server`, not `@/db`) so the boundary is visible at the call site.

**Module folder layout.** Per-feature modules under `src/<module>/`:

```
types.ts              ← TS types (often re-exports `$inferSelect` from @/db/schema)
schemas.ts            ← zod schemas (isomorphic — shared by client form + server validator)
api.server.ts         ← server-only async fns; takes deps; returns app shapes
functions.ts          ← createServerFn wrappers around api.server.ts (isomorphic — clients import these)
index.ts              ← barrel — re-exports types + schemas + functions. NEVER api.server.ts.
```

`api.server.ts` is the testable core (mockable db, no TanStack runtime); `functions.ts` is the framework boundary that exposes the server fns to the client.

**DB schemas centralized.** Drizzle tables under `src/db/schema/<table>.ts` with a barrel; modules import via `@/db/schema`. Cross-module FKs stay visible in one place.

**UI components.** Feature-specific components under `src/components/<feature>/`. Routes (`src/routes/**`) compose, don't define inline.

## Rules

**Merge conflicts — never auto-resolve.** If a PR merge or rebase conflicts, STOP. Explain the conflict in plain English (which lines/intents collide), propose a resolution, wait for explicit approval. Never use `git merge --strategy theirs/ours`, `git push --force`, or `git reset --hard` to make conflicts disappear.

**DB schema changes are user-driven and isolated.**
- Run `pnpm db:generate` to produce the migration SQL and commit it. Then STOP.
- Do **not** run `pnpm db:migrate` against any branch — the user runs migrations themselves to keep schema-state changes deliberate.
- Schema changes (anything that touches `src/db/schema/**` or `drizzle/**`) **always get their own PR**. Never bundle schema changes with feature/UI/CI work.

**Cloudflare config changes need typegen.** Anything touching `wrangler.jsonc` bindings → run `pnpm cf:types` and commit the regenerated `worker-configuration.d.ts`.

**UI: shadcn primitives first.** Before building a custom component, check `src/components/ui/` — most shadcn primitives are already installed (Card, Button, Badge, Skeleton, Dialog, Sheet, Table, etc.). Compose them. For styling, use Tailwind utility classes and the shadcn semantic CSS variables (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-destructive`, etc.) — do not hardcode color values. Add new shadcn components via `pnpm dlx shadcn@latest add <name>` rather than copying from the registry by hand.

**Never push to `master` directly.** All changes via PR. Branch names: `feat/*`, `fix/*`, `chore/*`, `ci/*`, `docs/*`. Squash merge is the default.

**Verify before declaring done.** Run `pnpm typecheck` (and `pnpm build` for changes affecting the bundle) locally before pushing. For UI changes, say so explicitly when you can't visually verify — don't claim "looks good" from typecheck alone.
