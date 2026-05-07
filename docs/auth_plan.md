# Auth Plan — Clerk + Local Users

## Overview

Two PRs (schema must be isolated per AGENTS.md rules):

- **PR A — `feat/auth-schema`**: `users` table + migration only
- **PR B — `feat/clerk-auth`**: Clerk wiring, auth swap, webhook, WS auth, gap fixes

---

## PR A — Schema: `users` table

### `src/db/schema/user.ts`

```ts
export const user = pgTable("users", {
  id:          text("id").primaryKey(),        // Clerk userId e.g. "user_abc123"
  email:       text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
})
```

No FK references — Clerk is the source of truth; we mirror here.

### Steps
1. Create `src/db/schema/user.ts`
2. Add `export * from "./user"` to `src/db/schema/index.ts`
3. `pnpm db:generate` → commit migration + snapshot

---

## PR B — Clerk Auth

### Packages to install

```
pnpm add @clerk/tanstack-react-start @clerk/backend svix
```

| Package | Purpose |
|---|---|
| `@clerk/tanstack-react-start` | `<ClerkProvider>`, `useAuth()`, `getAuth()` in server fns |
| `@clerk/backend` | `verifyToken()` for networkless JWT verify in Durable Object |
| `svix` | Verify Clerk webhook signatures |

### Env vars

| Var | Where | How |
|---|---|---|
| `CLERK_PUBLISHABLE_KEY` | `wrangler.jsonc` vars + `.dev.vars` | Public — safe in config |
| `CLERK_SECRET_KEY` | `.dev.vars` + `wrangler secret put` | Server secret |
| `CLERK_WEBHOOK_SECRET` | `.dev.vars` + `wrangler secret put` | Webhook signing secret |
| `CLERK_JWT_KEY` | `.dev.vars` + `wrangler secret put` | Networkless JWT verify in DO |

`CLERK_PUBLISHABLE_KEY` goes in `wrangler.jsonc` `vars` (it's public). The three secrets stay out of config — set via `wrangler secret put` in prod.

Run `pnpm cf:types` after updating `wrangler.jsonc`.

---

### File changes

#### 1. `src/routes/__root.tsx`
- Wrap `<html>` with `<ClerkProvider publishableKey={...}>`
- Add root `beforeLoad`: call `getCurrentUserFn()`, if `null` redirect to Clerk hosted sign-in URL (`https://accounts.clerk.com/sign-in?redirect_url=<origin>`)
- **No sign-in route needed** — hosted page handles everything

#### 2. `src/auth/api.server.ts` — swap mock
```ts
import { getAuth } from '@clerk/tanstack-react-start/server'
import { getWebRequest } from 'vinxi/http'

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = getAuth(getWebRequest())
  if (!userId) return null

  // Try local DB first
  const [row] = await getDb().select().from(user).where(eq(user.id, userId)).limit(1)
  if (row) return { id: row.id, email: row.email, displayName: row.displayName }

  // Fallback: lazy-create from Clerk API (covers race before first webhook fires)
  const clerkUser = await clerkClient().users.getUser(userId)
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? ''
  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || clerkUser.username || email
  await upsertUser({ id: userId, email, displayName })
  return { id: userId, email, displayName }
}
```

`requireUser()` stays unchanged — throws if `getCurrentUser()` returns null.

#### 3. `src/user/api.server.ts` (new)
```ts
export async function upsertUser(data: { id: string; email: string; displayName: string }) { ... }
export async function deleteUser(id: string) { ... }
```

#### 4. `src/server/worker.ts` — webhook endpoint
```
POST /api/webhooks/clerk
```
- Verify Svix signature (`svix-id`, `svix-timestamp`, `svix-signature` headers)
- Handle `user.created` → `upsertUser()`
- Handle `user.updated` → `upsertUser()`
- Handle `user.deleted` → `deleteUser()`

#### 5. `src/agent/runtime/chat-agent.server.ts` — WS auth
In `onRequest()`, before `super.onRequest()`:
```ts
const token = request.headers.get('Authorization')?.replace('Bearer ', '')
if (!token) return new Response('Unauthorized', { status: 401 })
await verifyToken(token, { jwtKey: this.env.CLERK_JWT_KEY })  // networkless
```

#### 6. `src/components/chat/chat-panel.tsx` — real userId
- Replace `const MOCK_USER_ID = "usr_demo_01"` with `const { userId } = useAuth()` from `@clerk/tanstack-react-start`
- Pass token in `useAgentChat` headers: `Authorization: Bearer <await getToken()>`

#### 7. `src/thread/api.server.ts` — ownership checks
- `getThread(id, userId)` — add `and(eq(thread.id, id), eq(thread.userId, userId))` filter
- `updateThread(id, userId, data)` — add userId condition to WHERE
- Update callers in `src/thread/functions.ts` (server fns call `requireUser()` and pass `user.id`)

---

## Auth flow (end to end)

```
User visits app
  → root beforeLoad calls getCurrentUserFn()
  → getCurrentUser() calls getAuth() → no session → returns null
  → beforeLoad throws redirect → Clerk hosted sign-in page

User signs in at Clerk
  → Clerk sets __session cookie, redirects back to app
  → root beforeLoad calls getCurrentUser() → userId present
  → checks local DB → not there yet (webhook pending)
  → lazy-creates local user row via Clerk API
  → returns User → app loads

Clerk fires user.created webhook (async, ~seconds later)
  → POST /api/webhooks/clerk → upsertUser() → row already exists, no-op

Chat WS connection
  → client calls getToken() → short-lived JWT (~60s, auto-refreshed)
  → passes as Authorization header in useAgentChat
  → ChatAgent.onRequest() → verifyToken() → proceed
```

---

## What stays the same

- All `requireUser()` call sites in trade/slip APIs — untouched
- `User` type shape `{ id, email, displayName }` — same
- `getCurrentUserFn` server fn wrapper — same
- All DB queries scoped by `userId` — same
