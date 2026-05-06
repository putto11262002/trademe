# TODO

Work items scoped during planning. Start with **3. Session Management**.

---

## 3. Session Management — Threads ⬅ START HERE

**Current state:** single hardcoded global session (`MOCK_USER_ID = "usr_demo_01"` in `chat-panel.tsx`). One conversation per user, forever.

**Goal:** introduce a **Thread** concept — multiple named conversations per user, each with its own model config, switchable from the chat panel.

### Model registry — `generalChatModels`

- Rename `MODELS` → `generalChatModels` in `src/agent/general-chat-models.ts`
- Named `general` to distinguish from future agent-specific registries (portfolio, trade suggester, etc.)
- Consolidate to **DeepSeek only** (remove Kimi)
- Each entry carries AI SDK-compatible `providerOptions` shape — thinking config lives inside `providerOptions`, not as a separate top-level field:

```ts
type GeneralChatModel = {
  id: string       // full model id e.g. "deepseek/deepseek-chat"
  label: string
  thinking?: {     // only present if model supports thinking
    levels: { label: string; providerOptions: ProviderOptions }[]
    default: ProviderOptions
  }
}
```

- Default model: `flash`

### Thread DB schema

```
threads
  id              text PK (nanoid)
  userId          text FK → users
  title           text nullable  (auto-titled from first user message)
  modelKey        text  (key in generalChatModels, default "flash")
  providerOptions jsonb (AI SDK providerOptions blob, default {})
  createdAt       timestamp
  updatedAt       timestamp  (bumped on every new message)
```

### Implementation checklist

- [x] Plan documented
- [ ] `src/agent/general-chat-models.ts` — new registry (DeepSeek only, providerOptions shape)
- [ ] `src/db/schema/thread.ts` — threads table
- [ ] `pnpm db:generate` — emit migration (user runs `db:migrate`)
- [ ] `src/thread/api.server.ts` — CRUD: createThread, listThreads, getThread, deleteThread, updateThread (title, model)
- [ ] `src/thread/functions.ts` — server fn wrappers
- [ ] `src/thread/types.ts` + `src/thread/schemas.ts`
- [ ] `src/agent/chat.ts` (or worker) — agent reads `modelId` + `providerOptions` from request body; name = thread ID
- [ ] `src/components/chat/thread-list.tsx` — thread list: create, switch, delete
- [ ] `src/components/chat/chat-panel.tsx` — wire thread ID as agent name; restore model config from thread; update thread on model change; auto-title on first message

---

## 1. Context Management

### 1a. AI SDK auto-compact
- [ ] Explore what AI SDK / Cloudflare Agents SDK supports for context window management
- [ ] **Decision (current preference):** do NOT auto-compact — end/pause the conversation when context is near full instead

### 1b. Model controls
- [ ] Investigate: can we set `maxTokens` (max output) per request for DeepSeek via the SDK?
- [ ] Investigate: can we set `maxThinkingTokens` for DeepSeek thinking models?

### 1c. Context usage quantification + UI
- [ ] Investigate: does AI SDK / agent expose token usage per message or cumulative?
- [ ] If yes: track cumulative input tokens used vs model context window limit
- [ ] UI: show context usage indicator in chat (e.g. subtle progress bar or `tokens used / limit`)
- [ ] Logic: pause new messages when usage hits ~80% — show a "context nearly full" banner, prompt user to start a new thread

---

## 2. Usage Tracking

> Defer — not in current scope. Needs handling eventually.

- [ ] Track token usage per user / per thread for cost visibility
- [ ] Hook into response metadata from AI SDK (input tokens, output tokens, thinking tokens)
- [ ] Storage: persist to DB per message or aggregated per thread

---
