# TODO

Follow-ups for the slip-extraction flow, working through one at a time.

## 1. Clean up the extraction prompt

`src/agent/definitions/slip-extraction.server.ts` — the prompt grew while
iterating against real slips. Audit for redundancy, restructure for clarity,
keep the parts that empirically matter (explicit JSON shape examples, the
slip-label → schema-field mapping table, the `not_a_slip` gate).

## 2. Add R2 storage for slip images

Today the slip image is base64-posted to the server, parsed, then thrown away
— only the JSON extraction is persisted on `trade_slip`. We want the original
image archived in Cloudflare R2 so the user can re-view their receipt later.
Touches:

- `wrangler.jsonc` — R2 bucket binding (regen `worker-configuration.d.ts`)
- `trade_slip` schema — add `image_key` (R2 object key) + maybe `content_type`
- Server fn `parseSlipFn` — upload before/alongside extraction, store the key
- Lifecycle policy thinking — when do we evict?

## 3. Better UI surfacing of the receipt

Once the slip image is in R2, the trade detail / position detail / trades
list should be able to show it. Open question: where does it live in the UI?
Options to weigh:

- Thumbnail in the trades-list row (with click-to-expand)
- "View slip" button on the trade detail page
- Inline preview on the position detail page when expanded
- A standalone slip viewer route

## 4. Better trade-creation validation

The extracted values (and manual entry) currently pass through Zod shape
checks but no business-rule validation. Things to consider:

- Reject duplicate slip uploads (same image hash → same slipId)
- Cross-field sanity: `quantity * pricePerShare ± fees` matches the slip's
  total if present
- Prevent trades with `tradedAt` in the future
- Prevent sells that exceed current position size? (or warn, not block)
- Surface validation errors inline in the form instead of as toasts
