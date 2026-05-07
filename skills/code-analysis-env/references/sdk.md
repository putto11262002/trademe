# TradeMe Python SDK Reference

Inside `analysis_run_code`, generated Python runs in `/workspace` with:

```python
import trademe_sdk as trademe
```

The Worker writes `/workspace/input.json`, writes `/workspace/trademe_sdk.py`, runs `/workspace/run_analysis.py`, then reads `/workspace/output.json`.

Available analysis libraries:

- `numpy`
- `pandas`
- `scipy`
- `statsmodels`
- `sklearn` / scikit-learn

## Output Contract

All successful analysis code must finish with:

```python
trademe.output.write(summary: str, result: Any) -> None
```

Inputs:

- `summary`: one short sentence for the tool UI. Must be non-empty.
- `result`: JSON-serializable value. Prefer a compact dict with metrics, warnings, and dataGaps.

Written JSON shape:

```json
{
  "summary": "Computed NVDA 3-month volatility and drawdown.",
  "result": {
    "ticker": "NVDA",
    "metrics": {},
    "warnings": [],
    "dataGaps": []
  }
}
```

Avoid returning raw candles, full news lists, large tables, plots, or verbose logs.

## Payload Shape

`trademe.input.load()` returns:

```ts
type AnalysisPayload = {
  run: {
    task: string
    asOf: string
  }
  data: {
    tickers: string[]
    portfolio: PortfolioDashboard | null
    market: Record<string, MarketBundle>
    news: Record<string, NewsArticle[]>
  }
}

type MarketBundle = {
  quote?: Quote
  fundamentals?: Fundamentals
  candles?: Candle[]
}
```

Only requested datasets are present. Missing data is normal; check for `None`, `{}`, or `[]`.

## trademe.input

### `trademe.input.load() -> dict`

Returns the full analysis payload.

Use when you need multiple namespaces or raw access to the run metadata.

### `trademe.input.metadata() -> dict`

Returns:

```ts
type RunMetadata = {
  task: string
  asOf: string
}
```

### `trademe.input.available_tickers() -> list[str]`

Returns the uppercase ticker symbols requested in the dataset.

## trademe.output

### `trademe.output.write(summary: str, result: Any) -> None`

Writes `/workspace/output.json` with the required `{ summary, result }` shape.

`result` must be JSON-serializable. Dates and other unsupported objects are converted to strings by the SDK, but prefer plain strings/numbers/lists/dicts.

### `trademe.output.fail(summary: str, details: Any | None = None) -> None`

Writes a successful tool output whose result contains an error object:

```json
{
  "error": "details"
}
```

Use only for expected data limitations. Let unexpected Python exceptions fail normally.

## trademe.portfolio

### `trademe.portfolio.dashboard() -> PortfolioDashboard | None`

Returns the portfolio dashboard if `includePortfolio` was requested; otherwise `None`.

```ts
type PortfolioDashboard = {
  summary: PortfolioSummary
  positions: Position[]
}
```

### `trademe.portfolio.summary() -> PortfolioSummary | None`

Returns dashboard summary or `None`.

```ts
type PortfolioSummary = {
  totalValueUSD: number
  totalCostUSD: number
  unrealizedPnLUSD: number
  unrealizedPnLPct: number
  realizedPnLUSD: number
  sectorAllocation: Array<{ sector: string; valueUSD: number; pct: number }>
  positionCount: number
  asOf: string
  fxRate: number
  fxAsOf: string
}
```

### `trademe.portfolio.positions() -> list[Position]`

Returns open positions, or `[]` if portfolio data was not requested.

```ts
type Position = {
  ticker: string
  netQuantity: number
  totalBought: number
  totalSold: number
  totalCost: number
  totalProceeds: number
  tradeCount: number
  name: string
  sector?: string
  logoUrl?: string
  currentPriceUSD: number
  priceAsOf: string
  avgCost: number
  valueUSD: number
  unrealizedPnLUSD: number
  unrealizedPnLPct: number
}
```

### `trademe.portfolio.position(ticker: str) -> Position | None`

Returns one position by ticker, case-insensitive, or `None`.

## trademe.market

### `trademe.market.quote(ticker: str) -> Quote | None`

Input:

- `ticker`: symbol such as `"NVDA"`, case-insensitive.

Returns:

```ts
type Quote = {
  ticker: string
  price: number
  previousClose: number
  change: number
  changePct: number
  asOf: string
}
```

Returns `None` if quotes were not requested or unavailable.

### `trademe.market.candles(ticker: str) -> list[Candle]`

Returns requested daily candles, or `[]`.

```ts
type Candle = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number
}
```

Notes:

- Candle range is capped by the tool input.
- Do not assume adjusted prices unless `adjustedClose` is present.
- Use `trademe.utils.closes(candles)` for close-price arrays.

### `trademe.market.fundamentals(ticker: str) -> Fundamentals | None`

Returns:

```ts
type Fundamentals = {
  ticker: string
  asOf: string
  marketCap?: number
  peRatio?: number
  eps?: number
  revenue?: number
  week52High?: number
  week52Low?: number
  dividendYield?: number
  beta?: number
}
```

Returns `None` if fundamentals were not requested or unavailable.

## trademe.news

### `trademe.news.recent(ticker: str) -> list[NewsArticle]`

Returns recent articles requested for the ticker, or `[]`.

```ts
type NewsArticle = {
  id: string
  ticker: string
  headline: string
  summary?: string
  url: string
  source: string
  publishedAt: string
  sentiment?: "positive" | "negative" | "neutral"
}
```

Use news as context, not as a sole basis for a conclusion.

## trademe.utils

### `trademe.utils.closes(candles: list[dict]) -> list[float]`

Extracts numeric close prices from candle dicts and skips candles without `close`.

### `trademe.utils.returns(values: list[float]) -> list[float]`

Computes simple period returns:

```python
(current - previous) / previous
```

Skips periods where the previous value is zero.

## Example

```python
import math
import numpy as np
import trademe_sdk as trademe

bars = trademe.market.candles("NVDA")
closes = trademe.utils.closes(bars)

data_gaps = []
if len(closes) < 2:
    data_gaps.append("Not enough candles to compute returns.")
    trademe.output.write("Checked NVDA candles but not enough data was available.", {
        "ticker": "NVDA",
        "dataGaps": data_gaps,
    })
else:
    returns = np.array(trademe.utils.returns(closes), dtype=float)
    annualized_vol = float(np.std(returns, ddof=1) * math.sqrt(252)) if len(returns) > 1 else None
    peak = np.maximum.accumulate(np.array(closes, dtype=float))
    drawdowns = (np.array(closes, dtype=float) - peak) / peak
    max_drawdown = float(np.min(drawdowns))

    trademe.output.write("Computed NVDA volatility and drawdown from loaded candles.", {
        "ticker": "NVDA",
        "observations": len(closes),
        "annualizedVolatility": annualized_vol,
        "maxDrawdown": max_drawdown,
        "dataGaps": data_gaps,
    })
```
