# architecture.md — technical design

> Branched from [IDEA.md](IDEA.md). High-level technical architecture. Implementation details left to engineering. Cross-references [v0.md](v0.md) for what's in scope right now. Last updated 2026-05-01.

---

## Layout

```
UI / Screens (thin consumers — Home, Position detail, Chat,
              Slip upload, Manual entry)
        ↓
Modules (own data + app logic; expose app-domain shapes)
  - portfolio   (entities + CRUD + enriched view shapes)
  - chat        (agent loop + tool dispatch + conversation state)
        ↓
Shared services (stateless utility; expose app-domain shapes)
  - dal         (external market data, normalized to app shapes)
  - analytics   (indicators, derived math — pure functions)
  - parser      (image → trade fields; OCR / vision LLM)
        ↓
External APIs (vendors per v0.md)  +  shared DB (per-module schemas)
```

---

## Principles

- **Feature modules own their data + logic + DB queries** as one cohesive slice. Open the module folder; see entities, app logic, and persistence together.
- **Shared services are stateless utility** with multi-consumer or external-dependency reasons to be one swap point.
- **App-domain shapes everywhere** — modules and shared services return shapes ready for UI consumption. Screens don't compose multiple raw responses.
- **No abstract "domain service" or "repository" layer.** That split disappears at our scale.

---

## Modules

### portfolio (data-owning)

Owns the user's portfolio data + logic.

- **Entities:** `Trade` (immutable log of buys/sells — source of truth), `Position` (current state per ticker, derived from Trades), `Lot` (per-buy lots for FIFO + FX-decomposition), `Portfolio` (1 per user in v0).
- **Reads** (return app-shaped views): `getPortfolioSnapshot`, `getPositionDetail`, `getAllPositions`, `listTrades`.
- **Writes:** `addTrade`, `editTrade`, `deleteTrade`, `rebuildPositions`.
- DB queries directly. Trade is source of truth (audit + lot tracking + slip provenance); Position is derived (cached or recomputed; same answer either way).

### chat

Owns the chat agent.

- Agent loop, tool definitions, conversation state.
- Tools call `portfolio.*` (read-only), `dal.*`, `analytics.*`, `parser.*`.
- Owns prompt assembly + response composition.

---

## Shared services

### dal (Data Abstraction Layer)

External market data, normalized to app shapes. The seam between us and vendors.

- **Responsibilities:** unified access, caching with per-type freshness, vendor abstraction + failover, quota budgeting, secret management.
- **Returns app shapes**, not vendor schemas — vendor swap = adapter swap, consumers untouched.
- **Two access patterns:** synchronous tool calls (low-latency), background ingestion for RAG corpus (async, batched).

### analytics

Pure functions over app-shaped market data; portfolio-agnostic.

- Technical indicators, statistical metrics, derived values (% from 52-week high, etc.).
- No state, no I/O — just math.

### parser

Image → structured trade fields.

- Per-broker template (e.g. Dime) + general vision LLM (catch-all for other broker slips).
- Returns confidence scores; caller confirms before write.
- Used by slip-upload screen today; reusable by chat agent for image inputs later.

---

## What's NOT in the architecture

So we know where these live elsewhere:

- **User auth** — separate framework / service concern
- **AI prompt assembly** — chat module
- **Embedding / vector store** — separate concern (RAG corpus, post-v0)
- **Business logic specific to a feature** — feature module

---

## Example flows

### Read — Open Home screen

```
HomeScreen
  → portfolio.getPortfolioSnapshot(userId)
       → DB query: trades for portfolio
       → derive positions from trades
       → for each position: dal.getQuote(ticker) + dal.getFXRate
       → compute totals + composition + P&L
       → return app-shaped snapshot
  → render
```

### Write — Add via slip

```
SlipUploadScreen
  → user picks image from photo gallery
  → parser.parseDimeSlip(image)
       → { ticker, qty, price, date, fees, type, confidence }
  → screen shows preview, user confirms
  → portfolio.addTrade(userId, fields)
       → INSERT INTO trades
       → invalidate Position cache for ticker
  → screen refreshes
```

### Write — Add via manual entry

```
ManualEntryScreen
  → user fills form
  → portfolio.addTrade(userId, fields)
       → (same as above)
```

---

## Caching strategy

DAL handles all external-data caching. Per-type freshness rules:

| Data type | Freshness |
|---|---|
| Quote | 5 min TTL |
| OHLCV (today's bar) | 5 min TTL |
| OHLCV (past bars) | Never stale once stored |
| Fundamentals | 1 day TTL |
| News | 1 hour TTL |
| Filings | Never stale (filings are immutable) |
| Earnings calendar | 1 day TTL |
| FX rate | 5 min TTL |

Modules and analytics do NOT cache external data — that's the DAL's job. Modules may cache derived state (e.g., Position from Trades) locally.

---

## DB

One shared DB. Modules own their tables. Migrations folders per module.
