# Dashboard design — presentation, framing, guiding, customizability research

> Branched from [IDEA.md](IDEA.md). Research output mapping the design space for retail investment dashboards. Recommendations here are research recommendations — actual product decisions are made elsewhere. Last updated 2026-05-01.

---

## TL;DR

- The "guides thinking" wedge lives in **framing**, not in chart types. Best-in-class differentiation comes from: counterfactuals (Empower You Index, Capitally), TWR + MWR shown together (Sharesight), ETF look-through (Parqet X-Ray), fee/FX drag exposure (Empower Fee Analyzer), and concentration-as-scenario (Magnifi).
- **Mobile-first beginner+intermediate** = card-based holdings + 1 hero metric + 1 chart + 1 visual abstraction (treemap or Snowflake-style). Hide everything else behind progressive disclosure.
- The **single highest-leverage Thai-specific framing** is FX-impact decomposition on US holdings — separating price moves from THB/USD moves. No global product surfaces this intuitively.
- Anti-patterns (hard rules): no confetti, no leaderboards, no recency-bias amplification (no defaulting to "today" P&L), no time-frame favoritism, no fee obscuring, no "you're a genius!" framing, no over-precision on volatile positions.
- Color: green-up/red-down (Western convention) — Thai broker apps follow Western. Add color customization later if covering CN/TW/JP/KR markets.

---

## 1. Best-in-class survey by archetype

### Archetype A — Tax/dividend-grade ledger
*"The spreadsheet, automated." Strong on data, weak on guiding.*

| Product | Does well | Distinctive framing |
|---|---|---|
| **Sharesight** | Email-parse contract notes; both TWR + MWR; tax reports; auto-import 150+ brokers; 2025 added treemaps + customizable columns | **Both TWR and MWR shown side by side** — most retail tools pick one; Sharesight forces both, exposing how cash-flow timing affected returns |
| **Capitally** | MWR/TWR/ROI together; **stack up to 10 benchmarks side-by-side, including a buy-and-hold version of your own portfolio**; on-device encryption | "Buy-and-hold of your own portfolio as a benchmark" is the cleanest *behavioral* benchmark — isolates timing from selection |
| **Stock Events** | Mobile-first dividend tracking; clean UI; dividend by year/month/day/hour, by sector/industry/country | Explicit single-screen design ethic ("just one look is enough") |
| **Snowball Analytics** | Dividend calendar; rebalancing tool; **Portfolio Lab** (backtest your strategy historically); good mobile widgets | Backtesting your real portfolio against historical scenarios — rare in retail |
| **Parqet** | **ETF X-Ray** decomposes ETFs to show true underlying-stock exposure (catches "I own VOO and AAPL = double Apple exposure"); allocation by industry/country/asset class | X-Ray is the single sharpest "guide thinking" feature in this archetype |

### Archetype B — Net-worth/balance-sheet
*Wider scope (all assets), thinner per-position depth.*

| Product | Does well | Distinctive framing |
|---|---|---|
| **Empower (Personal Capital)** | Free; auto-aggregation of US accounts; **Investment Checkup** (allocation vs. recommended, sector over/underweights); **Fee Analyzer** ("silent drag" exposed); **You Index** (your holdings extrapolated backward as a custom index) | **You Index is genuinely original** — gives the user a personal index to compare against benchmarks. Cleanest "compare-yourself-honestly" pattern in retail |
| **Kubera** | Beautiful net-worth tracker; multi-asset (real estate, crypto, NFTs, vehicles, art); manual+auto; "spreadsheet-like" feel | Frames investing as **net-worth-over-time, not return percentages** — different mental model from trading apps |

### Archetype C — Research-first
*Deep per-company analysis layered onto a portfolio.*

| Product | Does well | Distinctive framing |
|---|---|---|
| **Simply Wall St** | **Snowflake** — five-axis radar (value, growth, past, health, dividends), 0-6 checks per axis. Aggregates per-stock Snowflakes into portfolio-weighted Snowflake; sortable; benchmarkable | **The Snowflake is the most-cited single visualization in retail investing** — converts five abstract dimensions into one shape readable in <2 seconds |
| **FinChat / Fiscal.ai** | Conversational copilot on 100k+ companies; sourced answers with charts/tables inline; clean dashboard launchpad | **Sources every AI answer with click-through citation** — the trust pattern to copy |
| **Quartr Pro** | First-party IR documents AI chat with traceability | Source-linked AI chat on filings |

### Archetype D — AI-augmented portfolio assistants
*Closest in DNA to what we're building.*

| Product | Does well | Distinctive framing |
|---|---|---|
| **Magnifi** | Plain-English search across 15k securities; **portfolio health score**; concentration/risk surfacing; cross-account aggregation across Fidelity/E*TRADE/Robinhood | Proves the chat-over-portfolio pattern works ($14/mo WTP) |
| **Wealthfolio** | Open-source, **on-device AI assistant** (privacy-preserving); user controls which tools the AI can access; AI can also add transactions in chat | **Tool-permission model for AI** — user grants AI access to accounts/holdings/activities/performance individually. Strong PDPA story |
| **GetQuin** | Region/sector/asset-class breakdown; IRR + TTWROR; community/anonymized portfolio sharing; broker auto-import | **Social-proof framing** — see anonymized portfolios for learning. Risky for novices (herding) but interesting |
| **Robinhood Cortex Digests** (Gold) | Plain-language daily digest synthesizing market data, news, analyst ratings; surfaces top return driver, top mover, upcoming events per holding | **Push, not pull** — the daily-brief pattern. Closest competitor to long-term vision |
| **Public.com Alpha** | GPT-4-powered research; SEC filings, earnings transcripts, analyst reports, social sentiment; agentic monitoring (Mar 2026); free | **Plain-language risk disclaimer is loud and persistent** — model for regulatory framing |

### Archetype E — Aggregator-tracker mainstream

| Product | Distinctive |
|---|---|
| **Delta by eToro** | Beautiful clean UI; multi-asset; 1,600+ broker connections; price alerts; **Benzinga "Best Portfolio Tracker 2024"** | **UI quality bar to match** — reviews repeatedly cite "clean and not cluttered" as the differentiator |

### Archetype F — Beginner-trader apps (mostly anti-pattern reference)

- **Robinhood mainline:** large hero P&L, simple line chart, one-tap trade. Pioneered card-based holdings + mobile-first portfolio. **Dark side:** confetti (removed 2021 after MA regulator action), swipe-to-trade, push notifications hyping volatility. Yale Law Journal forum and academic literature consistently cite this as the canonical retail-investing UX anti-pattern.
- **Public.com mainline:** social-feed framing (other users' rationale visible), educational threads inline, strong disclaimer hygiene.

---

## 2. Data dimensions — what dashboards surface

Categorized as **stakes** (every credible product), **differentiator** (only some), **rare** (best-in-class).

### Composition

| Sub-dimension | Common metric/chart | Stakes? |
|---|---|---|
| Per asset | Holdings table; donut/pie for top-N + "other" | Stakes |
| Per asset class | Donut, stacked bar | Stakes |
| Per sector | Donut, **treemap** | Differentiator (Sharesight added 2025, Empower) |
| Per geography | Donut on country/region | Differentiator |
| **ETF look-through** | Decomposed underlying exposure | **Rare — Parqet X-Ray is gold standard** |
| Custom groups | User-defined ("high conviction" vs. "experiment") | Differentiator |

### Performance

| Sub-dimension | Stakes? |
|---|---|
| Absolute return ($/% since inception, per period) | Stakes |
| Period chips (YTD, 1M, 3M, 1Y, 3Y, 5Y, all-time) | Stakes |
| Time-weighted (TWR) — removes effect of contributions | Differentiator |
| Money-weighted (MWR/IRR/XIRR) — user's actual experience | Differentiator |
| **Both shown side-by-side with explainer** | **Rare best-practice (Sharesight)** |
| vs. benchmark (overlay line, SPY default) | Stakes |
| **vs. counterfactual ("if you'd bought SPY at the same times")** | **Rare — Capitally closest** |
| Heatmap by period (year × month grid) | Differentiator (Parqet) |

### Cost / basis

- Cost basis per holding — Stakes
- Realized vs. unrealized gains — Stakes
- **Fee analysis** — Differentiator (Empower Fee Analyzer is canonical)
- **Currency-conversion P&L breakout** — Differentiator (Sharesight; *uniquely useful for Thai-on-US*)

### Risk

- Concentration (top-N % of portfolio) — Stakes
- Sector overweight vs. benchmark — Differentiator (Empower Investment Checkup)
- Volatility / std dev / beta / max drawdown — Power user
- **Health score / Snowflake** — Differentiator with strong UX leverage (Simply Wall St signature; Magnifi parallel)

### Income

- Dividend income (TTM, YTD) — Stakes for dividend-focused, optional otherwise
- Yield, yield on cost — Differentiator
- Dividend calendar — Differentiator
- Forecasted forward income — Differentiator

### Activity

- Transaction list — Stakes
- Deposit/withdrawal log — Stakes
- Recent trades summary on dashboard — Differentiator

### News / events

- Per-holding news feed — Differentiator
- Earnings calendar — Differentiator
- **Per-holding "why did it move"** — Differentiator with high AI leverage

---

## 3. Presentation patterns

### Chart types — when each works

- **Donut/pie** — small N (≤6 + "other"); composition at a single point in time. Used by virtually everyone.
- **Treemap** — better than donut once N gets above ~6; especially with hierarchy (sector → stock); color encodes a second dimension (typically performance). [Adapted to portfolios since Shneiderman's 1992 work](https://www.researchgate.net/publication/2370624_Adapting_Treemaps_To_Stock_Portfolio_Visualization). Limitation: items with near-zero allocation become invisible.
- **Line/area for value** — single most common chart. Smoothing is itself an editorial choice.
- **Stacked area** — composition over time. Useful for showing how allocation shifted.
- **Bar** — periodic returns (monthly, yearly).
- **Radar / spider** — Simply Wall St Snowflake. Strong for comparing N dimensions at a glance.
- **Heatmap** — monthly return grid; calendar-style.
- **Sparkline** — micro-trend in tables (Stock Events, Delta).

### Tables vs. cards vs. visual abstractions

- **Cards** — Robinhood-style. Each holding is a card with logo, name, price, change. Mobile-native. Cost: dense data hard to scan.
- **Tables** — Sharesight, FinChat, GetQuin. Power-user friendly. Mobile cost: horizontal scroll.
- **Visual abstractions** — Snowflake, You Index, Health Score. Compress many numbers into one shape. Strong "guide thinking" but require explainer layer.

**For mobile-first beginner+intermediate:** hybrid — cards for primary "your stocks" view, table behind a tab toggle, one or two visual abstractions on home.

### Progressive disclosure

Pattern that recurs across best-in-class:

1. **First load:** total value, today's $/% change (de-emphasized), one chart (line, period-toggleable), one composition view (donut or treemap).
2. **One scroll down:** holdings list (cards or table).
3. **One tap into a holding:** position detail — cost basis, lots, news, why-it-moved, fundamentals.
4. **Dedicated tabs/screens:** performance analytics (TWR/MWR, benchmark), risk/health, dividends, transactions.
5. **Hidden in settings/"advanced":** custom benchmarks, custom groups, currency overrides.

[NN/g progressive-disclosure guidance](https://www.nngroup.com/articles/progressive-disclosure/): most beneficial when feature usage follows power-law distribution (which it does in finance dashboards — 80% of users only ever use top-of-screen).

### Mobile vs. desktop

- **Mobile** — single-column, tab-bar nav, card-based holdings, hero number first. Robinhood, Stock Events, Delta, GetQuin.
- **Desktop** — multi-pane, simultaneous holding+chart+news visible, sortable wide tables. Sharesight, Empower, Capitally, FinChat.

### Color and iconography

The one place Asia-vs-Western convention matters.

- **US/Europe:** green = up, red = down (traffic-light symbolism).
- **Mainland China and Taiwan:** red = up, green = down (red is auspicious; ties to candlestick origins).
- **Japan, South Korea:** historically red = up; modern apps mixed.
- **Hong Kong:** typically Western (green = up).
- **Thailand:** Thai-language SET broker apps and Settrade Streaming default to **Western convention (green = up, red = down)**. Settrade Streaming offers user color customization. *Worth a primary check by Put — open Dime/Settrade and confirm.*
- **Accessibility:** never rely on color alone. Pair with arrow icons (▲▼) and explicit signs (+/-). 8% of Thai males are red-green colorblind.

[Asia vs Western color schemes deep-dive](https://medium.com/@danvim/deep-dive-into-the-opposing-color-schemes-in-asian-vs-western-stock-market-prices-part-1-origin-4e3ccdb27c99)

---

## 4. Framing / guiding patterns — the "guide thinking" wedge

This is the section that matters most for differentiation.

### 4a. Compare to alternatives (counterfactuals)

Strongest pattern, least common in execution.

- **Empower You Index** — your holdings become a synthetic index; benchmark against any other. User sees "you're tracking 8% behind S&P 500 over 3Y" without you saying it.
- **Capitally "buy-and-hold of your own portfolio"** — strips out trading decisions; isolates "did rebalancing help or hurt?"
- **Unbuilt:** "If you'd bought SPY instead of TSLA on the dates you bought TSLA, you'd have +$X." Computable on demand. Uniquely positioned for AI chat.

### 4b. Time-frame honesty

Most apps default to either YTD or all-time, both of which can flatter or distress depending on entry timing.

- **Best practice:** show multiple time frames simultaneously (small chips: 1M, YTD, 1Y, 3Y, all-time) and don't let user dismiss the bad ones. Sharesight does this; Robinhood mainline actively obscures longer time frames.
- **AI angle:** when user asks "how am I doing," honest answer references multiple time frames. ("YTD: +18%. 1Y: -3%. The recent rebound has recovered most of the 2025 drawdown but you're still below your 1Y entry point.")

### 4c. Surfacing concentration risk

- **Empower Investment Checkup** — flags overweights vs. recommended in plain language.
- **Magnifi portfolio health score** — single number with drill-down.
- **Parqet X-Ray** — exposes hidden concentration through ETF look-through.
- **Pattern:** numeric concentration is necessary but not sufficient. "70% of your portfolio is in 3 stocks" is information; **"If NVDA dropped 30% tomorrow, your portfolio would drop ~17%"** is *guidance*. Convert percentages into scenario-specific dollar consequences.

### 4d. Educational micro-content inline

- **Tooltips** on every uncommon term (TWR, beta, dividend yield, P/E). Trigger: tap-and-hold.
- **"Why does this matter?" callouts** — Simply Wall St on Snowflake axes; Empower on Investment Checkup recommendations.
- **Onboarding tour** — 3-4 key terms, no more.
- **Just-in-time education** — explain "TWR" the first time the user lands on the performance tab, not at sign-up.

### 4e. Goal-anchored framing

Limited applicability if users don't have articulated goals (target_user.md flagged this as `[insufficient evidence]`). If included, frame as **optional aspiration**, not setup gate.

### 4f. Calibrated framing of fees and FX drag

- **Empower Fee Analyzer** — only mainstream tool that prominently exposes fee drag.
- **Currency conversion P&L** — Sharesight breaks out THB/USD effect on a US holding for a non-USD investor.
- **For Thai retail on US stocks:** baht has swung 8-12% vs. USD in recent years; that swing dwarfs many stock picks. **"Your NVDA position: +24% in USD, +18% in THB after FX. The strong baht ate 6 percentage points."** Almost no global product surfaces this intuitively. *Single highest-leverage Thai-specific framing.*

### 4g. Anti-patterns

| Anti-pattern | Where seen | Why it harms novice retail |
|---|---|---|
| **Confetti / celebration on transactions** | Robinhood (removed 2021), copycats | Conditions overtrading; rewards activity not outcome |
| **Surprise stocks / referral gambling rewards** | Robinhood | Slot-machine psychology |
| **Daily/intraday hero number defaulting to "today"** | Robinhood, Webull | Amplifies recency bias; trains users to react to noise |
| **Hiding longer time frames** | Robinhood-style apps | Asymmetric framing — celebrate gains, hide losses |
| **Leaderboards / social shame-pride** | GetQuin community feed risk; eToro CopyTrader | Herding, FOMO, performance-chasing |
| **Push notifications hyping volatility** | Most broker apps | Amplifies overtrading |
| **Burying fees** | Industry-wide; addressed by Empower | 61% of Americans don't know what they pay |
| **Time-frame manipulation** (defaulting to whatever flatters) | Apps that A/B-optimize the chip | Erodes trust when noticed |
| **Per-day P&L as default** | Most retail apps | Forces user to attend to noise |

---

## 5. Customizability patterns

### What existing dashboards let users configure

| Configurable | Tools | Notes |
|---|---|---|
| Time period | All | Standard chip row |
| Chart type | Sharesight (added 2025), Capitally | Treemap vs. donut toggle |
| Benchmark | Empower (built into You Index), Capitally (10 stacked), Sharesight | Default to S&P 500/SPY |
| Currency display | Sharesight, Capitally, Portseido | Critical for non-USD users |
| Layout / widget order | Kubera (custom dashboards), GetQuin partial | Power-user feature |
| Notification thresholds | Delta, Stock Events | Price + rebalancing alerts |
| Asset categorization | Sharesight custom groups | "High conviction" vs. "experiment" |
| Color convention | Settrade Streaming | Asia-relevant |
| AI tool permissions | **Wealthfolio** | Innovative — user grants AI access to specific tools |

### Smart defaults > user choice

- **Default time period:** "all-time" or "1Y," never "today."
- **Default benchmark:** S&P 500 (SPY) for US stocks.
- **Default currency:** show both home (THB) and trading (USD) prominently.
- **Default sort on holdings:** by market value descending.
- **Default chart type:** line for performance, treemap for composition once N>6.

### Avoiding customization fatigue

Best-in-class pattern: **smart defaults visible; customization tucked one tap deeper, never gating.** If user opens app and is asked "what benchmark would you like?" — product has failed.

Wealthfolio's permission model is interesting but probably premature — users don't have intuition for "what tools should the AI access?" Add later when users have a relationship with the AI.

---

## 6. Anti-patterns specific to novice + intermediate retail

Consolidated from §4g and gamification literature.

1. **Bloomberg-Terminal-itis** — too many numbers, too dense, no hierarchy. Cure: progressive disclosure, one hero metric per screen.
2. **Robinhood-style gamification** — confetti, swipe-to-trade, surprise stocks, badges, streaks. Cure: zero celebration animations; reward *not* trading as much as trading.
3. **Hidden fees** — expense ratios buried; FX conversion not surfaced. Cure: fee analyzer panel; FX impact in P&L breakdown.
4. **Recency-bias amplifiers** — daily P&L as hero, push on intraday moves, charts defaulting to 1D. Cure: longer default time windows; throttle notifications to material news.
5. **Time-frame favoritism** — letting user pick the time-frame that flatters. Cure: show multiple frames simultaneously; AI commentary that reads honestly.
6. **Loss obscuring** — burying red, displaying only green. Cure: equal-weight visual treatment; honest AI framing.
7. **Leaderboards / social copying** — encourages herding. Cure: if community is included, anonymized and de-emphasized.
8. **"You're a genius!" framing** — short-term gain attribution without honest counterfactual. Cure: counterfactual-aware AI ("you outperformed SPY by 3% over 3M, but you also took ~2x volatility — small sample").
9. **Over-precision** — showing P&L to the cent on volatile positions creates false specificity. Cure: round to whole baht/dollar; ranges where appropriate.
10. **Forced activity nudges** — "you haven't rebalanced in 90 days." Cure: proactive nudges only when material; explicit "doing nothing is often correct" copy.

---

## 7. Recommended starting set (research recommendation)

For a beginner+intermediate AI-augmented retail dashboard for US stocks, mobile-first, with chat agent alongside.

### Information architecture (5 screens)

1. **Home** (the morning-glance screen) — single screen, scrollable
2. **Position detail** — drill-in from any holding
3. **Performance** — analytics tab (TWR/MWR, benchmark)
4. **Chat** — AI agent surface
5. **Settings/Add** — manual entry, slip upload, preferences

### Home screen content (top-to-bottom)

1. **Hero metric:** total portfolio value in THB, with USD secondary; today's $/% change *de-emphasized* (small subtext, not the headline). **Default time frame: 1Y, not today.**
2. **Portfolio chart:** line/area, period chips (1M / 3M / YTD / 1Y / All) — show *all* of these visible, not hidden. Overlay benchmark (SPY) toggle, defaulting on.
3. **Composition snapshot:** treemap colored by performance, sized by allocation. Top holdings + "other." (Donut as alternative if treemap feels heavy on small mobile screens — A/B candidate.)
4. **One AI insight card:** "Today's note from your analyst" — single 2-3 sentence AI-generated paragraph. ("NVDA reported earnings yesterday — beat on revenue, missed on guidance; it's down 4% pre-market. This is your largest holding at 28%, so it'll move your portfolio meaningfully today.") Tappable to open chat with that context preloaded.
5. **Holdings list (cards):** ticker, name, value (THB+USD toggle), today's change, all-time return %. Tap to drill in.
6. **Footer:** "Add a position" CTA (opens manual entry / slip OCR).

### Position detail content

1. Hero: current value, all-time return $ and %, **with both USD and THB-after-FX broken out**.
2. Price chart with company logo.
3. Cost basis, average buy price, # of lots.
4. **"Why it moved today"** AI card — sourced from news/filings.
5. Recent news (last 7 days), earnings calendar entry.
6. Position-specific ask-the-AI button.

### Performance tab content

1. **Both TWR and MWR, side by side**, with one-line plain-English explainer ("TWR: how your picks did. MWR: how your decisions about *when* to buy/sell did.").
2. vs. SPY benchmark line overlay.
3. Period selector.
4. **Counterfactual card (the differentiator):** "If you'd bought SPY at the same times you bought stocks, you'd be at $X — your stock picks added/cost you $Y." Computable; rare in retail; AI chat can elaborate on demand.
5. **Concentration callout:** "Your top 3 holdings are 67% of your portfolio. A 20% drop in NVDA would move your total by ~6%." Plain language, not just a number.
6. **FX impact callout:** "Of your +$X gain, $Y came from price moves and $Z came from THB weakening vs. USD."

### Visual + interaction defaults

- Color: green up / red down (Western convention), with arrow icons + explicit + and - signs.
- Typography: large hero number; everything else hierarchical and smaller.
- Animation: subtle. **No confetti, no streaks, no badges.**
- Time-frame default: 1Y on first load. Sticky to last selection within session, resets to 1Y on next open.
- Sort default: market value descending.
- Empty state: clear "Add your first position" CTA with three paths.

### Open design questions

1. **Treemap vs. donut as default composition view on mobile.** Treemaps better above ~6 holdings; read poorly on 380px screen. A/B or pick.
2. **Hero metric: today's change shown or not?** If not, first user complaint. If yes, amplifies recency. Compromise: small, secondary, but visible.
3. **THB vs. USD primacy.** Recommend THB-primary, USD-toggle.
4. **AI insight card cadence on home.** Once-a-day refresh (calm, predictable) vs. live (timely, recency-amplifying). Recommend once-a-day.
5. **Counterfactual computation cost.** "If you'd bought SPY instead" requires historical SPY price lookup per transaction date. Worth ingestion overhead?
6. **Chat-agent prominence.** Tab bar entry vs. floating action button vs. inline cards. FAB pattern (Wealthfolio, Magnifi) is lightest but easiest to miss; tab-bar makes it ambient.
7. **How honest should the AI be about losses?** "Your NVDA position is -28%. Selling now locks in the loss; holding doesn't fix anything by itself" — useful or scolding? User-research candidate.
8. **Defaulting on benchmark overlay or off?** Empower defaults on; Robinhood has none (encourages absolute-only thinking, anti-pattern). Recommend default on.
9. **English UI for Thai users — copy register.** Plain English vs. financial English vs. simple-Thai-English-loanword? Usability test candidate.
10. **Disclaimer placement.** SEC AI guidelines and "substance over form" rule — wording matters more than placement, but UI placement matters for trust. Standing footer in chat? Disclaimer modal on first AI insight ever? Discuss with securities lawyer per [regulatory.md](regulatory.md).

---

## Sources

Product reviews and documentation:
- [Sharesight Review (CFOClub)](https://thecfoclub.com/tools/sharesight-review/)
- [Sharesight Time-weighted vs. money-weighted](https://www.sharesight.com/blog/time-weighted-vs-money-weighted-rates-of-return/)
- [Sharesight Diversification](https://www.sharesight.com/blog/calculate-investment-portfolio-diversification-sharesight/)
- [Sharesight December 2025 product update](https://www.sharesight.com/blog/product-updates-december-2025/)
- [Simply Wall St Snowflake explainer](https://support.simplywall.st/hc/en-us/articles/360001740916-How-does-the-Snowflake-work)
- [Empower Review (Rob Berger)](https://robberger.com/empower-review/)
- [Empower Personal Dashboard Review (Wallethacks)](https://wallethacks.com/personal-capital-review/)
- [Empower Portfolio Analysis Tool](https://www.empower.com/tools/portfolio-analysis)
- [Robinhood Cortex Digests](https://robinhood.com/us/en/support/articles/cortex-digests/)
- [Robinhood Cortex Digests methodology](https://robinhood.com/us/en/support/articles/cortex-digests-methodology/)
- [Public Alpha](https://public.com/alpha)
- [Magnifi Review 2025 (Skywork)](https://skywork.ai/skypage/en/Magnifi-Review-2025:-My-Deep-Dive-into-the-AI-Investing-Copilot/1976483893702881280)
- [Wealthfolio](https://wealthfolio.app/)
- [Wealthfolio Review (Machow2)](https://machow2.com/wealthfolio-review/)
- [GetQuin Investment Tracker Review (matchmybroker)](https://www.matchmybroker.com/tools/getquin-review)
- [Capitally Analyze Performance](https://www.mycapitally.com/features/analyze-performance)
- [Capitally Investment Performance Methods](https://www.mycapitally.com/blog/measuring-investment-performance)
- [Stock Events App Review (CoolCuration)](https://coolcuration.com/stock-events-app-review)
- [Stock Events Dividend Tracker](https://stockevents.app/en/dividend-tracker)
- [Snowball Analytics Review (College Investor)](https://thecollegeinvestor.com/44042/snowball-analytics-review/)
- [Parqet X-Ray](https://parqet.com/en/blog/x-ray)
- [Parqet Performance Tree Map](https://parqet.com/en/blog/performance-tree-map)
- [Delta by eToro Review 2026 (matchmybroker)](https://www.matchmybroker.com/tools/delta-investment-tracker-review)
- [Kubera Review 2026 (College Investor)](https://thecollegeinvestor.com/36895/kubera-review/)
- [FinChat / Fiscal.ai Review (WallStreetZen)](https://www.wallstreetzen.com/blog/finchat-io-fiscal-ai-review/)

Design / UX / behavioral:
- [Robinhood Material Design (Google)](https://design.google/library/robinhood-investing-material)
- [Adapting Treemaps to Stock Portfolio Visualization (ResearchGate)](https://www.researchgate.net/publication/2370624_Adapting_Treemaps_To_Stock_Portfolio_Visualization)
- [Progressive Disclosure (NN/g)](https://www.nngroup.com/articles/progressive-disclosure/)
- [Asia vs Western color schemes deep-dive](https://medium.com/@danvim/deep-dive-into-the-opposing-color-schemes-in-asian-vs-western-stock-market-prices-part-1-origin-4e3ccdb27c99)

Behavioral finance / anti-patterns:
- [Robinhood Behavioral Nudges (Brown CS Capstone)](https://cs.brown.edu/media/filer_public/89/2c/892c1ac7-e6d0-4700-a73d-05874a250521/yeceline_capstone_abstract.pdf)
- [Robinhood removes confetti (CNBC)](https://www.cnbc.com/2021/03/31/robinhood-gets-rid-of-confetti-feature-amid-scrutiny-over-gamification.html)
- [Yale Law Journal — Confetti Regulation](https://www.yalelawjournal.org/forum/on-confetti-regulation-the-wrong-way-to-regulate-gamified-investing)
- [Recency Bias (Schwab)](https://www.schwabassetmanagement.com/content/recency-bias)
- [Fee Transparency (Apprise Wealth)](https://apprisewealth.com/news/fee-transparency-you-may-be-paying-more-than-you-think/)
