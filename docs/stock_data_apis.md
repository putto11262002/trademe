# US equity data APIs — research

> Branched from [IDEA.md](IDEA.md). Maps the US equity data API landscape for both dashboard data needs and AI agent RAG inputs. Recommendations here are research recommendations — vendor choices are made elsewhere. Last updated 2026-05-01.

---

## TL;DR

- **Two-vendor base covers ~95% of needs:** **Polygon.io + FMP**. ~$80/mo at small scale, ~$300/mo at medium scale. Together: prices + history + news + LLM-ready ticker tagging + fundamentals + transcripts + ratings + filings backup.
- **Free prototype is genuinely viable** at $0: Finnhub free + FMP free + SEC EDGAR direct + Marketaux free. Caps at ~50 concurrent users.
- **SEC EDGAR direct is the canonical filings source** — free, official, structured JSON via `data.sec.gov`. Pay sec-api.io ($55–239/mo) only when you need section extraction or WebSocket push on new filings.
- **Critical architecture rule:** **tool-calling for numbers, RAG for text.** Never put fundamentals (EPS, P/E, revenue) into an embedding store — LLM will hallucinate. Always call APIs as tools at synthesis time. RAG only for news bodies, filing sections, transcripts.
- **ToS for AI repackaging is the biggest risk dimension.** Most vendor ToS predate LLMs. Defensible pattern: LLM generates summary in our voice, attribute source, never expose full raw article. Get written sales confirmation from each paid vendor before launch.
- **Don't use:** `yfinance` in production (Yahoo ToS = personal-use only), Seeking Alpha as a transcript feed (hostile to AI), IEX Cloud (shut down Aug 2024), NewsAPI.org for finance use ($449/mo and not finance-tuned).

---

## 1. Vendor survey

### Free / freemium

| Vendor | Coverage | Free tier | Latency | Notes |
|---|---|---|---|---|
| **Yahoo Finance via `yfinance`** | Quotes, history, fundamentals, corp actions, basic news | Effectively unlimited but unofficial | EOD + 15-min delayed | **Personal-use only** per Yahoo Developer ToS. Endpoints break without notice. **Do NOT ship in commercial product.** Fine for hackathon/internal eval. |
| **Alpha Vantage** | Quotes, history, fundamentals, FX, crypto, some news+sentiment | 25 req/day, 5 rpm | 15-min delayed; intraday via premium | Cheap to start. Premium $49.99/mo (75 rpm) → $249.99/mo. Decent fundamentals, weak news. Frequent rate-limit pain on free. |
| **Finnhub** | Quotes, fundamentals, news, SEC filings, transcripts, insider, sentiment | 60 calls/min on free, **real-time US quotes included** | Real-time US (free!) | **Most generous free tier of the bunch.** Premium $11.99–$99.99/mo. Has earnings transcripts and SEC filings sentiment as native endpoints — useful for AI agent. |
| **Tiingo** | EOD prices, fundamentals (Premium add-on), curated news | 1 hr / 1000 req, 50 unique symbols | EOD + IEX real-time | Power tier $10/mo (personal) / $50/mo (commercial). News API curated + ticker-tagged. **"Internal consumption only" by default — commercial plan needed.** |
| **Twelve Data** | Quotes, history, FX, crypto, fundamentals, indicators | 800/day, 8 rpm | Real-time on paid | Pro $79–191/mo, Ultra $832/mo. Good multi-asset; fundamentals OK. |
| **Marketstack** | EOD + intraday prices, 70+ exchanges | 100/mo | EOD on free, intraday on paid | $9.99–$199/mo. Light on fundamentals. |
| **EOD Historical Data (EODHD)** | Prices, fundamentals, options, news, sentiment | 20/day | EOD + delayed/real-time on paid | €19.99–€99.99/mo, all-in-one €99.99 (~$108). **Best European-priced bundle for prices+fundamentals+news at a single SKU.** |
| **Stooq** | EOD prices (US + international) | Free, scrapable | EOD only | CSV downloads, no real API. Useful as backup. |
| **SEC EDGAR** | All filings, full-text search, XBRL | **Free, 10 req/sec** with User-Agent header | Real-time at filing | The canonical free source. Raw — you parse. |
| **Alpaca Market Data** | Real-time IEX quotes (free), SIP feed (paid) | 200 rpm free | Real-time IEX on free | Free data API usable as price source. SIP starts ~$99/mo. |

### Paid retail-friendly

| Vendor | Coverage | Pricing | Notes |
|---|---|---|---|
| **Polygon.io** | Quotes, history, fundamentals, options, FX, crypto, news with ticker+sentiment | Free (limited rps), Starter $29/mo (15-min delayed, unlimited calls), Developer $79/mo (10 yrs history + real-time WebSockets + indicators), Advanced $199/mo, Business custom | **Best price/feature for our scale.** News endpoint has LLM-extracted tickers, sentiment, summaries — built to feed AI products. |
| **Financial Modeling Prep (FMP)** | Prices, fundamentals (deepest), corp actions, dividends, **earnings transcripts**, ratings, calendars | Free 250 req/day, Starter $19/mo, Premium ~$50/mo, Ultimate ~$100/mo | **Best "all-in-one bundle" at <$100/mo.** Includes transcripts as native endpoint (Polygon doesn't). Strongest fundamentals breadth at this price. |
| **Tiingo Pro** | EOD + IEX real-time + curated news + fundamentals add-on | $10–$50/mo | Cleanest news for the price; good ticker-tagging. |
| **Intrinio** | Fundamentals, real-time, options, ratings | Starts $150/mo, scales to $1,600+/mo | Higher quality / cleaner data than FMP, but 5–10× the cost. Worth it once revenue justifies. |
| **Nasdaq Data Link (Quandl)** | Mixed datasets — many free, premium per-dataset | Per-dataset purchase | Use case-specific. WIKI prices is dead. EOD US Stock Prices dataset is solid. |
| **TradingView Data** | Charts, technicals | Widget licensing, not true data API | Useful as embedded chart, not backend feed. |

### Institutional (mostly out of scope)

Five-figure annual minimums. Skip until ~$100k MRR.

- **Refinitiv** (now LSEG) — gold-standard fundamentals + news + estimates
- **Bloomberg B-PIPE / BLPAPI** — terms forbid embedding in consumer apps without enterprise license
- **FactSet** — estimates, ownership, fundamentals
- **S&P Capital IQ** — fundamentals, estimates, ratings

### News-specific

| Vendor | Strength | Cost / ToS for AI |
|---|---|---|
| **Polygon.io news** | Ticker-tagged, sentiment-labeled, hourly refresh, included in stock plans | Bundled. ToS prohibits raw redistribution; LLM-generated summaries with attribution = gray-but-defensible. Confirm with sales. |
| **Finnhub news** | Per-ticker filter, fast, free tier | Free; same redistribution caveats. |
| **Benzinga API** | Pro-grade headlines + analyst actions | No public pricing; sales-quoted. Free tier with headlines+teasers+link-out; full body costs more. **Best-in-class US retail news quality.** Expensive. |
| **MarketAux** | 5,000+ sources, 30 languages, ticker filter | Free 100/day; paid $19–$249/mo. Aggregator of public sources — quality varies. Good cheap fallback. |
| **NewsAPI.org** | Generic news, not finance-tuned | $449/mo for commercial. **Skip — Marketaux/Polygon do this better cheaper.** |
| **Webz.io** | Web/forum scraping at scale | Enterprise pricing. Overkill. |
| **Tickertick** | Per-ticker free news aggregator | Free, lightweight. Useful free supplement. |
| **Anthropic web fetch / Claude with citations** | On-demand fetch + cite of public web pages | Pay-per-token. Useful for "go research this ticker now" patterns rather than continuous feed. |

### Filings-specific

| Vendor | Cost | When to use |
|---|---|---|
| **SEC EDGAR** | Free (10 rps with User-Agent) | **Default. Always.** XBRL JSON endpoints give structured financials; full-text search works. |
| **sec-api.io** | Free 100 calls/mo, $55/mo Personal, $239/mo Business; **Enterprise tier explicitly grants redistribution rights** | Pay only when (a) need 10-K/10-Q section extraction without writing it yourself, (b) need real-time WebSocket on new filings, (c) need PDF rendering. Section extractors are the real value-add. |
| **FMP filings** | Bundled in plan | Useful if already on FMP — saves separate vendor. |
| **edgar.tools** | Cheaper sec-api alternative; includes MCP server for AI agents | Worth evaluating in 2026 — newer, tuned for AI workflows. |

### Earnings call transcripts

| Vendor | Cost | ToS for AI |
|---|---|---|
| **FMP transcripts** | Bundled in $19+/mo plans | **Best-value path.** Covers most large/mid-caps. |
| **Quartr API** | Custom enterprise pricing; explicitly markets to "LLM-optimized" use cases | Top quality. Live transcripts, paragraph confidence, 14k+ companies. ToS friendly to AI but $$$. |
| **Seeking Alpha** | License required; expensive | Best human-edited transcripts. **ToS hostile to redistribution. Avoid as feed source.** |
| **AlphaSense** | Institutional ($$$$$) | Out of scope. |

### Analyst ratings

- **FMP ratings** — bundled, sufficient for early launch
- **TipRanks** — via Nasdaq Data Link or scraping; expensive direct license
- **Zacks** — license required; sales-led
- **Refinitiv I/B/E/S** — institutional

---

## 2. Comparison axes for our scale

### Cost at low scale (≤1000 active users)

Realistic minimum stack for full feature coverage:

- **Prices + fundamentals + corp actions + news + filings + transcripts:** Polygon.io Starter ($29) + FMP Premium (~$50) = **~$80/mo**. Or all-in-one EODHD All-in-One (~$108/mo).
- **Filings extras:** SEC EDGAR free + sec-api.io free tier (or $55 if you outgrow it).
- **Total: $80–$200/mo.** Trivial.

### Cost at medium scale (≤10k active users)

Concerns: rate limits, redistribution clauses, latency for real-time quotes.

- Polygon.io Developer ($79) or Advanced ($199) — real-time + WebSockets
- FMP Ultimate (~$100/mo) or migrate fundamentals to Intrinio Silver ($150–300/mo)
- Benzinga news contract ($500–2,000/mo typical)
- sec-api.io Business ($239/mo) for filings redistribution rights
- **Total: ~$700–3,000/mo.** Still trivial vs. LLM costs at 10k users.

### Free-tier viability for prototyping

**Yes, you can build a real prototype at $0.**

```
Prices/history     Alpha Vantage (or Finnhub for real-time)
Fundamentals       FMP free (250/day)
News               Finnhub free + Marketaux free + SEC EDGAR for filing news
Filings            SEC EDGAR direct
Transcripts        FMP free (low volumes)
Ratings            FMP free
```

Switch to paid the moment you onboard real users. Free tiers will rate-limit you out at ~50 concurrent.

### Latency

Our use case doesn't need real-time tick. **15-min delayed is fine for dashboard; EOD is fine for morning brief; real-time only matters if we add price-alert notifications.** Almost every paid tier here gives 15-min delayed for free or near-free.

### Vendor lock-in / data export ease

- **Polygon, FMP, EODHD, Alpha Vantage, Finnhub** — all REST/JSON, no SDK lock-in, easy to swap.
- **Intrinio, Refinitiv** — proprietary schemas, rewrite cost on swap.
- **SEC EDGAR** — universal, will outlive every vendor.

Build a thin internal abstraction (`PriceProvider`, `NewsProvider`, `FilingsProvider`) so swapping a vendor is a one-file change.

### ToS for AI repackaging — the critical axis

Pattern across the industry as of May 2026:

1. **Almost every vendor prohibits raw redistribution** (showing data 1:1 to non-licensed users / making data downloadable from your app).
2. **"Display in your UI to your end users" is generally permitted** under standard commercial tiers, with attribution.
3. **AI/LLM-generated summaries are a gray zone.** Most ToS were written pre-LLM. Defensible pattern:
   - LLM generates summary in our voice
   - We attribute the source ("Per Reuters via Polygon.io...")
   - We do not expose the full raw article body
   - We do not sell the data feed itself
4. **Vendors who have publicly addressed AI use:**
   - **Polygon.io** — uses LLMs themselves to enrich news; tone is AI-friendly; ToS still prohibits redistribution
   - **sec-api.io Enterprise** — explicitly includes redistribution rights
   - **Quartr** — explicitly markets transcripts as "LLM-optimized"
   - **FMP** — permissive in practice; ToS doesn't explicitly bless AI processing — written sales confirmation recommended
   - **Benzinga** — most explicit and most expensive; they've thought about this
   - **Yahoo / yfinance** — **personal-use only** per Yahoo Developer ToS
   - **Seeking Alpha transcripts** — hostile to redistribution
5. **Practical recommendation:** get a **one-paragraph written confirmation from sales at every vendor you use** ("Confirming our team can ingest [endpoint X] data, generate AI summaries from it, and display those summaries to our end users with source attribution"). Costs nothing, protects you in court.

### PDPA / data residency

US data APIs all process in US/EU. Your *user data* (portfolios) stays where you put it. **The data-residency concern isn't the US data feeds — it's our outbound LLM calls** if we send portfolio context (sensitive under Thai PDPA Section 26) to OpenAI/Anthropic in US. Covered in [data_ingestion.md §PDPA](data_ingestion.md). Data-API choice is residency-neutral.

---

## 3. Specific stack recommendations

### Best free path (prototype, $0)

```
Prices + history    → Alpha Vantage (free) + Finnhub (free, real-time US)
Fundamentals        → FMP free (250 req/day)
Corp actions        → FMP free / Alpha Vantage
News (per-ticker)   → Finnhub free + Marketaux free
Filings             → SEC EDGAR direct (free, 10 rps)
Transcripts         → FMP free (low volume)
Analyst ratings     → FMP free
```

Ships a working AI portfolio agent at $0. Caps at ~50 concurrent users.

### Best paid stack at small scale (<$500/mo, ~1k users)

```
Prices + news       → Polygon.io Starter $29/mo (or Developer $79/mo for real-time)
Fundamentals + transcripts + ratings + corp actions → FMP Premium ~$50/mo
Filings             → SEC EDGAR direct (free) + sec-api.io free tier as backup
Total               → ~$80–130/mo
Optional add-ons    → Marketaux Pro $19/mo for broader news sources
                    → Tiingo News $50/mo for cleaner curated stream
```

**Recommended baseline.** Two vendors covers ~95% of needs.

### Best paid stack at scale (~10k users, ~$1–3k/mo)

```
Prices (real-time)  → Polygon.io Advanced $199/mo
Fundamentals        → FMP Ultimate ~$100/mo or migrate to Intrinio Silver $150–300/mo
News                → Polygon news (bundled) + Benzinga API ($500–2,000/mo)
Filings             → sec-api.io Business $239/mo (gets redistribution rights)
Transcripts         → FMP or Quartr API (negotiate)
Total               → ~$1,000–3,000/mo
```

Vendor consolidation matters at this stage — fewer contracts, fewer ToS reads, fewer single points of failure.

### Bundling: who's "all-in-one" vs. specialty

**All-in-one:**
- **FMP** — broadest coverage at lowest price. Fundamentals + transcripts + filings + ratings + news in one API.
- **Polygon.io** — strong on prices/quotes/news; light on fundamentals/transcripts.
- **EODHD** — European pricing, all-in-one bundle.
- **Finnhub** — surprisingly broad on free tier.

**Specialists:**
- **SEC EDGAR / sec-api.io** for filings depth
- **Benzinga** for premium news signal
- **Quartr** for transcripts when quality matters

---

## 4. AI agent layer specifics

### News feeds with good per-ticker filtering

Ranked best to worst for **per-ticker filtering quality + RAG suitability:**

1. **Polygon.io news** — already LLM-enriched (tickers extracted, sentiment, summaries). Bundled in stock plan. Best signal-to-noise for AI ingestion.
2. **Benzinga API** — institutional-grade ticker tagging; expensive but gold standard.
3. **Finnhub news** — solid free tier, real-time, per-ticker filter.
4. **Tiingo News** — curated set of sources, clean ticker tags, good for "high quality, low volume."
5. **Marketaux** — broadest source coverage; noisier; cheap.

### Earnings call transcripts

| Path | Cost | Quality | ToS for AI |
|---|---|---|---|
| **FMP transcripts** | $19–100/mo bundled | Good for large/mid-caps; weaker on small | Permissive in practice; get sales confirmation |
| **Quartr API** | Custom (likely $1–5k/mo) | Best — paragraph confidence, LLM-optimized, 27 markets | Explicit AI-friendly positioning |
| **Build it ourselves** (record + Whisper) | LLM/transcription cost only | Variable; needs audio source | No redistribution issue but infra burden |

### SEC filings — EDGAR vs. sec-api.io

**Default: EDGAR direct.** Free, official, no rate-limit pain at our scale (10 rps), canonical source.

**Pay for sec-api.io when:**
- Need **section extractors** (10-K Item 1A Risk Factors, 10-Q MD&A) — building these from raw HTML is non-trivial; they ship them.
- Need **WebSocket push** when new filing lands.
- Need **PDF rendering** of filings.
- Cross into **redistribution** (showing parsed sections directly to users) — Enterprise tier covers.

**Hybrid:** EDGAR direct for filing index/metadata + XBRL fundamentals (free, structured JSON via `data.sec.gov`). FMP or sec-api.io free tier for parsed 10-K/10-Q sections to feed RAG.

### RAG pipeline architecture for financial data — typical pattern (2026)

Based on industry consensus ([CFA Institute](https://rpc.cfainstitute.org/research/the-automation-ahead-content-series/retrieval-augmented-generation), [Microsoft](https://www.zenml.io/llmops-database/building-production-grade-rag-systems-for-financial-document-analysis), [FinSage](https://arxiv.org/pdf/2504.14493)):

```
1. Ingestion / chunking
   - News: per-article, full text → chunked at paragraph
   - Filings: per-section (Item 1A, MD&A, Risk Factors) → chunked + table-extracted separately
   - Transcripts: per-speaker-turn chunks; Q&A vs prepared remarks tagged
   - Tag every chunk with: ticker(s), filing/article date, source, section type

2. Embedding
   - Domain-tuned models matter: FinBERT or finance-aware embedding models
     (Voyage finance-2, Cohere embed-v3-finance) > generic OpenAI ada
   - Store in pgvector / Qdrant / Pinecone

3. Hybrid retrieval (the 2026 standard)
   - Semantic (vector) + BM25 keyword + structured filters (ticker, date range, source)
   - Re-rank with cross-encoder

4. Numeric data: do NOT put in RAG
   - Fundamentals (EPS, P/E, revenue) — call APIs as tools at synthesis time
   - LLM hallucinates numbers if they're in text context; tool-calling fixes this
   - Polygon, FMP both have tool-friendly endpoints

5. Generation with citations
   - Always cite chunk source (article URL, filing URL + section)
   - Forces the model to ground; gives users an audit trail (regulator-friendly)

6. Freshness
   - News: hourly index refresh
   - Filings: WebSocket push from sec-api.io OR poll EDGAR submissions feed every 15 min
   - Transcripts: post-earnings, push event triggered by earnings calendar
```

**Tool-calling vs. RAG split:**

- **Tool-calling** (call API at runtime): prices, fundamentals, ratios, ratings, calendar
- **RAG** (pre-indexed corpus): news bodies, filing sections, transcripts, analyst report text

**This split is the single most important architectural decision.** Most teams that fail at financial AI put numerical data into RAG and watch the model hallucinate P/E ratios.

---

## 5. Anti-recommendations

1. **`yfinance` in production.** Yahoo Developer ToS = personal-use only. Will break without notice. Will get cease-and-desist. **Prototype only.**
2. **Building your own broad news scraper.** Polygon + Finnhub + Marketaux at the bottom of the price stack covers it. Maintenance cost (parser breakage, IP bans, copyright exposure) higher than $30/mo Polygon.
3. **NewsAPI.org for finance use.** $449/mo and not finance-tuned. Marketaux ($19) does this better.
4. **Direct SEC EDGAR scraping over paid SEC API:** use EDGAR direct unless you need section extraction or WebSocket push. Paying for sec-api.io makes sense at the **section extraction** point — re-implementing it is genuinely hard work. Don't pay just for "easier API" — EDGAR's JSON endpoints are already easy.
5. **IEX Cloud — confirmed dead.** Shut down August 31, 2024. Don't write integration code against any IEX Cloud sample. Former exec team relaunched assets as **Blue Sky Data** (early access, unproven). Polygon and Alpha Vantage are the obvious migration paths.
6. **Seeking Alpha as a transcript feed.** ToS hostile to redistribution and AI processing.
7. **Bloomberg / Refinitiv / FactSet at early stage.** Five-figure annual minimums. Sales-led six-month procurement. Wait until enterprise revenue justifies.
8. **TradingView's data API as a backend.** Their offering is widget licensing, not a true data feed. Use as embedded chart UX only.
9. **Restrictive ToS to watch:**
   - **Yahoo / yfinance** — personal only
   - **Seeking Alpha** — hostile to AI redistribution
   - **Bloomberg B-PIPE** — terms forbid embedding in consumer apps without enterprise license
   - **Standard tier of any real-time SIP feed** — usually limits "display to non-professional subscribers" in ways that may require us to register users as "non-pro" via attestation
10. **Vendor changes worth flagging:**
    - **IEX Cloud:** dead Aug 2024
    - **Quandl** rebranded to **Nasdaq Data Link** (2021); WIKI free dataset is dead; many former-free datasets now paid
    - **Alpaca** has been consolidating — IEX free is fine, SIP starts $99/mo
    - **Polygon.io** rebranded its corporate name to **Massive** in 2025 (same product, same domain still works)

---

## Sources

- [Polygon.io Pricing](https://polygon.io/pricing)
- [Polygon.io Stocks Pricing (Massive)](https://massive.com/pricing)
- [Polygon for Businesses Terms of Service](https://polygon.io/legal/businesses-terms-of-service)
- [Financial Modeling Prep Pricing](https://site.financialmodelingprep.com/pricing-plans)
- [FMP Earnings Transcripts API docs](https://site.financialmodelingprep.com/developer/docs/stable/earnings-transcript-list)
- [Alpha Vantage Premium](https://www.alphavantage.co/premium/)
- [Alpha Vantage Review 2026](https://tradingtoolshub.com/review/alpha-vantage/)
- [Tiingo Pricing](https://www.tiingo.com/about/pricing)
- [Tiingo Terms of Use](https://app.tiingo.com/tos/)
- [Tiingo News API](https://www.tiingo.com/products/news-api)
- [Twelve Data Pricing](https://twelvedata.com/pricing)
- [Marketstack Pricing](https://marketstack.com/pricing)
- [Finnhub Pricing](https://finnhub.io/pricing)
- [Finnhub SEC Filings API](https://finnhub.io/docs/api/filings)
- [Benzinga API Product Suite](https://www.benzinga.com/apis/data/)
- [Benzinga Basic Financial News API (free tier)](https://aws.amazon.com/marketplace/pp/prodview-xwgvhwowjmw3g)
- [MarketAux API Documentation](https://www.marketaux.com/documentation)
- [MarketAux Pricing](https://www.marketaux.com/pricing)
- [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
- [SEC EDGAR API Rate Limits Best Practices (TLDRFiling)](https://tldrfiling.com/blog/sec-edgar-api-rate-limits-best-practices)
- [sec-api.io Pricing](https://sec-api.io/pricing)
- [edgar.tools vs sec-api.io comparison](https://www.edgar.tools/vs/sec-api)
- [Quartr API for Financial Research Platforms](https://quartr.com/use-cases/financial-research-platforms-api)
- [EODHD Pricing](https://eodhd.com/pricing)
- [The 2026 Market Data API Scorecard (EODHD)](https://eodhd.com/financial-academy/financial-faq/the-2026-market-data-api-scorecard-comparing-6-leading-providers)
- [Best Financial Data APIs in 2026 (NB Data)](https://www.nb-data.com/p/best-financial-data-apis-in-2026)
- [Best Stock Market and Financial Data APIs in 2026 (APIScout)](https://apiscout.dev/guides/best-stock-market-financial-apis-2026)
- [Yahoo Developer API Terms of Use](https://legal.yahoo.com/us/en/yahoo/terms/product-atos/apiforydn/index.html)
- [Intrinio Pricing](https://intrinio.com/pricing)
- [Alpaca Market Data docs](https://docs.alpaca.markets/docs/about-market-data-api)
- [IEX Cloud Has Shut Down: Analysis & Migration Guide (Alpha Vantage)](https://www.alphavantage.co/iexcloud_shutdown_analysis_and_migration/)
- [IEX Cloud Shuttered (Integrity Research)](https://www.integrity-research.com/iex-cloud-shuttered-though-former-execs-acquire-assets/)
- [RAG for Finance — CFA Institute](https://rpc.cfainstitute.org/research/the-automation-ahead-content-series/retrieval-augmented-generation)
- [Microsoft RAG for Financial Document Analysis (ZenML)](https://www.zenml.io/llmops-database/building-production-grade-rag-systems-for-financial-document-analysis)
- [FinSage Multi-aspect RAG for Financial Filings (arxiv)](https://arxiv.org/pdf/2504.14493)
- [LLMs for Financial Document Analysis (IntuitionLabs)](https://intuitionlabs.ai/articles/llm-financial-document-analysis)
- [Polygon News Extraction with LLMs (arxiv)](https://arxiv.org/html/2407.15788v1)
