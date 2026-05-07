# TODO

## Agent Capability Design

Context: the current agent has a working prototype path for portfolio/market tools plus `analysis_run_code`. The next work should expand and stabilize the agent capability shape before deeply hardening the final version.

### Phase 1. Capability Map and Tool Taxonomy

- [x] Define the first-pass agent capability map before production hardening.
- [x] Separate tools into clear classes:
  - [x] portfolio tools
  - [x] market-data tools
  - [ ] analytics/indicator tools
  - [x] code-execution tools
  - [ ] research/search tools
  - [ ] browser tools
  - [x] future write tools, likely none for v0
- [x] Document which tools are available to chat now vs. later.
- [~] Document which tools are allowed inside sandbox code vs. only callable by the agent loop.
- [x] Define when the agent should use deterministic tools vs. code execution vs. research/browser.

### Phase 2. Enrich Deterministic Tools

- [x] Keep existing tools:
  - [x] `portfolio_get_summary`
  - [x] `market_get_quote`
  - [x] `market_get_company_info`
  - [x] `news_get_recent`
  - [x] `analysis_run_code`
- [ ] Add market-data tools:
  - [x] `market_get_price_history_summary`
  - [x] `market_get_fundamentals`
  - [x] `market_get_earnings`
  - [x] `market_get_price_target`
  - [x] `market_get_recommendation_trends`
  - [x] `market_get_fx_rate`
- [~] Add portfolio-analysis tools:
  - [x] `portfolio_get_position_detail`
  - [x] `portfolio_get_risk_snapshot`
  - [x] `portfolio_get_allocation`
  - [ ] `compare_positions`
- [ ] Add analytics tools:
  - [ ] `analytics_calculate_technical_indicators`
  - [ ] `analytics_calculate_returns`
  - [ ] `calculate_drawdown`
  - [ ] `calculate_volatility`
  - [ ] `analytics_calculate_correlation`
- [ ] Prefer deterministic analytics tools for common requests and reserve code execution for flexible/custom analysis.

### Phase 3. Sandbox SDK Shape

- [ ] Rethink the code-execution contract before hardening.
- [ ] Decide whether to keep preloaded `input.json`, add lazy SDK calls, or use a hybrid.
- [~] Replace the current minimal `trademe_sdk.py` with a stable SDK-style interface.
- [ ] Target shape:

```python
import trademe_sdk as trademe

payload = trademe.load_input()
portfolio = trademe.portfolio.dashboard()
bars = trademe.market.candles("NVDA")
metrics = trademe.analytics.technical(bars)
trademe.output.write({
    "summary": "...",
    "metrics": metrics,
    "warnings": [],
    "dataGaps": [],
})
```

- [~] SDK namespaces:
  - [x] `trademe.input`
  - [x] `trademe.portfolio`
  - [x] `trademe.market`
  - [x] `trademe.news`
  - [x] `trademe.output`
  - [x] `trademe.utils`
- [ ] Decide per SDK method whether it reads from preloaded `input.json` or lazily calls `/api/sandbox/*`.
- [ ] Keep generated code focused on orchestration and custom math, not reimplementing core indicators every run.
- [ ] Add SDK docs and examples.

Current prototype limitations:

- [ ] `analysis_run_code` can get stuck pending in local testing.
- [ ] Agent may make multiple failed tool attempts before recovering.
- [ ] Debug visibility is weak; no structured analysis run logs yet.
- [x] Current SDK still includes analysis helpers; latest design direction prefers mostly data access + output contract, with Python libraries handling flexible computation. First cleanup done: SDK now keeps only tiny `closes`/`returns` helpers plus temporary backward-compatible shims.

### Phase 4. Research/Search Tools

- [ ] Decide whether web search belongs in v0 chat or post-v0.
- [ ] Add research tools separately from code execution.
- [ ] Candidate tools:
  - [ ] `research_search_web`
  - [ ] `research_open_page`
  - [ ] `search_company_filings`
  - [ ] `get_recent_market_context`
  - [ ] `get_cited_sources`
- [ ] Require citations for web/research answers.
- [ ] Keep search/browser results out of sandbox unless explicitly needed.
- [ ] Do not let generated code perform arbitrary web scraping.
- [ ] Define source priority:
  - [ ] company investor relations
  - [ ] SEC filings
  - [ ] exchange/vendor data
  - [ ] reputable financial news
  - [ ] lower-confidence web sources

### Phase 5. Browser Tools

- [ ] Decide whether browser automation is needed for v0.
- [ ] Treat browser as a research/acquisition tool, not a computation tool.
- [ ] Candidate uses:
  - [ ] inspect company investor-relations pages
  - [ ] retrieve filings/pages that APIs miss
  - [ ] verify source pages visually
  - [ ] test the TradeMe UI
- [ ] Disallow browser actions that:
  - [ ] log into broker accounts
  - [ ] place trades
  - [ ] submit forms for the user
  - [ ] bypass paywalls or access controls
- [ ] Add separate prompt rules for browser use.

### Phase 6. Agent Prompt and Policy Design

- [ ] Redraft the system prompt around the full tool taxonomy.
- [ ] Scope the agent to stock, market, portfolio, and investment-analysis questions.
- [ ] Politely decline unrelated work.
- [ ] Define tool routing:
  - [ ] use portfolio tools for user holdings
  - [ ] use market-data tools for current/static data
  - [ ] use analytics tools for common calculations
  - [ ] use code execution for custom/multi-step numerical analysis
  - [ ] use research/search/browser for external context requiring citations
- [ ] Explicitly disallow:
  - [ ] buy/sell/hold instructions
  - [ ] trade execution
  - [ ] neural-net/model training unless we explicitly support it later
  - [ ] open-ended compute tasks
  - [ ] unrelated coding/helpdesk tasks

### Phase 7. UX for Tool Calls

- [ ] Improve visible tool-call states:
  - [ ] fetching portfolio
  - [ ] fetching market data
  - [ ] running technical analysis
  - [ ] searching web
  - [ ] browsing source
  - [ ] completed/failed
- [ ] Consider richer cards for:
  - [ ] analysis result
  - [ ] sources/citations
  - [ ] code used
  - [ ] data gaps
- [ ] Decide whether generated code should be shown by default or hidden behind a disclosure.

### Phase 8. Production Hardening

This comes after the capability shape is closer to final. Keep basic safety rails during exploration, then harden the final toolset.

Sections below track the hardening work.

---

## Agent Code Execution Hardening

Context: `analysis_run_code` is wired as a prototype code execution environment for stock and portfolio analysis. Before shipping, treat this as an untrusted-code feature and close the gaps below.

### 1. Observability and Run IDs

- [ ] Generate a stable `analysisRunId` for every `analysis_run_code` call.
- [ ] Log structured events:
  - [ ] run started
  - [ ] dataset fetch started/completed
  - [ ] sandbox file writes completed
  - [ ] code execution completed/failed/timed out
  - [ ] output parse completed/failed
- [ ] Include fields:
  - [ ] `analysisRunId`
  - [ ] user id or mock user id
  - [ ] chat/agent session id if available
  - [ ] model key if available
  - [ ] tickers
  - [ ] candle range
  - [ ] requested data scopes
  - [ ] code length
  - [ ] duration
  - [ ] success/error
  - [ ] output size
- [ ] Make logs useful in local dev and Cloudflare observability.

### 2. Prompt Scope

- [ ] Tighten the system prompt so code execution is only for stock, market, portfolio, and investment-analysis tasks.
- [ ] Explicitly allow:
  - [ ] returns
  - [ ] SMA/EMA/RSI/MACD-style indicators
  - [ ] drawdown
  - [ ] volatility
  - [ ] portfolio concentration
  - [ ] correlations/comparisons
  - [ ] simple scenario calculations
- [ ] Explicitly disallow:
  - [ ] training ML/neural-net models
  - [ ] package installation
  - [ ] web scraping
  - [ ] filesystem exploration
  - [ ] network calls
  - [ ] crypto mining/benchmarks
  - [ ] trading/order execution
  - [ ] accessing secrets or environment variables
- [ ] Ensure unrelated user requests are politely declined.

### 3. Backend Guardrails

- [ ] Enforce max code length.
- [ ] Enforce max tickers per run.
- [ ] Enforce max candle range.
- [ ] Enforce max total candle rows.
- [ ] Enforce max stdout/stderr length.
- [ ] Enforce max output file size.
- [ ] Keep execution timeout strict:
  - [ ] normal target: 5-10 seconds
  - [ ] hard max: 15 seconds
- [ ] Ensure no background processes are started by the tool.
- [ ] Limit repair/retry behavior to one attempt at most.

### 4. Static Code Screening

- [ ] Add a pre-execution code scanner for obvious unsafe or out-of-scope patterns.
- [ ] Block or reject:
  - [ ] `subprocess`
  - [ ] `os.system`
  - [ ] `socket`
  - [ ] `requests`
  - [ ] `urllib`
  - [ ] `http.client`
  - [ ] `pip`
  - [ ] `open("/etc`
  - [ ] environment access such as `os.environ`
  - [ ] shell execution
- [ ] Return a clear tool error when code is rejected.
- [ ] Document that this is defense-in-depth, not the primary sandbox boundary.

### 5. Output Contract

- [x] Require `output.json` to match a strict schema:

```ts
type AnalysisOutput = {
  summary: string
  result: unknown
}
```

- [x] Reject oversized outputs.
- [x] Reject non-JSON outputs.
- [ ] Normalize `NaN`, `Infinity`, and unserializable values.
- [ ] Preserve enough error detail for debugging without leaking internals to the user.

### 6. Data Access Model

- [ ] Keep the current preloaded `input.json` path for small/medium analyses.
- [ ] Decide whether/when to add lazy sandbox SDK calls to `/api/sandbox/*`.
- [ ] If adding lazy calls:
  - [ ] replace static `SANDBOX_API_TOKEN` with short-lived signed run tokens
  - [ ] bind token to user id
  - [ ] bind token to `analysisRunId`
  - [ ] bind token to allowed tickers/scopes/ranges
  - [ ] expire token after a few minutes
- [ ] Avoid exposing normal app session cookies to sandbox code.

### 7. Audit Persistence

- [ ] Add a persistent audit table or log sink for analysis runs.
- [ ] Store:
  - [ ] run id
  - [ ] user id
  - [ ] task
  - [ ] dataset request
  - [ ] generated code
  - [ ] execution metadata
  - [ ] output schema summary
  - [ ] error class/message
- [ ] Decide retention policy before production.
- [ ] Keep DB schema changes isolated in their own PR per repo rules.

### 8. UI/UX

- [ ] Show clear tool-call state:
  - [ ] preparing dataset
  - [ ] running analysis
  - [ ] completed
  - [ ] failed/timed out
- [ ] Consider showing a collapsible "code used" panel after execution.
- [ ] Show user-safe errors when the analysis fails.
- [ ] Avoid exposing raw stack traces in the chat UI.

### 9. Docs and Operating Notes

- [ ] Expand `docs/agent_design.md` with:
  - [ ] architecture diagram
  - [ ] allowed/disallowed analysis examples
  - [ ] local testing steps
  - [ ] deployment requirements for Cloudflare Containers/Sandbox
  - [ ] security model and limitations
- [ ] Add a checklist for reviewing future code-execution changes.
- [ ] Document that prompt rules are not security boundaries.
