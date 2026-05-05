# Competitors — broker-agnostic portfolio trackers + AI insights layers

> Branched from [IDEA.md](IDEA.md). Maps the **actual** competitor set for a broker-agnostic, AI-augmented, layer-on-top portfolio dashboard for Thai retail investors. (For the underlying broker stack, see [market_landscape.md](market_landscape.md).) Last updated 2026-05-01.

---

## TL;DR

- **The Thai-targeted broker-agnostic-tracker space is almost empty.** Closest local: Portseido (Thai-targeted, weak AI). No Thai-built AI-augmented portfolio overlay exists.
- **The closest functional model globally is Sharesight** (best email-parse data ingestion, mature multi-broker tracker, *no* generative AI / proactive layer).
- **The closest AI-augmented tracker covering the Thai market is Simply Wall St** (has Thai market page, AI analyst narratives) — but research-first, not portfolio-first, no proactive push, no Thai-language AI.
- **The closest model conceptually is InvestMates (India)** — multi-broker aggregation + AI wealth assistant ("Otto AI") + family portfolios. Validates the model in an Asian retail context. The Thai equivalent doesn't exist.
- **Demand signal:** May 2025 Pantip thread ([pantip.com/topic/43194159](https://pantip.com/topic/43194159)) explicitly asks for "apps/Excel to track investment portfolio across Thai stocks, foreign stocks, mutual funds, crypto with auto-update without manual entry." Users are vocally looking; nothing fits.
- **The defensible gap is at the intersection of four things no one combines today:** (1) broker-agnostic ingestion tuned for Thai broker formats, (2) proactive AI push (daily digest, not reactive chat), (3) Thai-language Thai-context AI (SET filings, BOT/baht/foreign-flow context, Pantip sentiment), (4) email digest as a distribution wedge.

---

## Closest direct competitors

### Portseido — closest globally to what we're building

- **Does well:** Explicitly markets a Thai portfolio-tracker page; THB visualization; multi-currency; dividend tracking; supports global stocks (70+ exchanges including SET); freemium with Pro tier.
- **Does poorly:** No AI insight layer at all; no proactive daily digest; no Thai-language AI; no broker-direct sync for Thai brokers (manual + CSV only); no transaction-slip OCR; weak news/sentiment surfacing; basic UX.
- **Gap to exploit:** Match their tracking baseline and add the AI layer they don't have. We become "Portseido but AI-first and Thai-native."
- ([Portseido Thailand](https://www.portseido.com/portfolio-tracker/thailand/), [pricing](https://www.portseido.com/pricing/))

### Sharesight — closest functional ingestion model

- **Does well:** Best-in-class data-in (200+ brokers, **email-parse trade confirmations** = exactly the pattern we need for Thai broker daily PDFs at scale), tax reports, dividend tracking, multi-currency. The reference for "user forwards broker email → portfolio updates in 60s."
- **Does poorly:** No generative AI / portfolio-context AI; no proactive daily digest of "what moved and why in *your* portfolio"; UI is dated; tax-centric framing alienates non-tax-obsessed retail; no Thai broker direct integration (relies on email forwarding, which works but isn't marketed in Thailand).
- **Gap to exploit:** Sharesight proved email/slip parsing works at scale. Build OCR-of-Thai-slip + add the AI insight layer they don't have.
- ([Sharesight email-import](https://www.sharesight.com/blog/automatically-import-trades-to-your-sharesight-portfolio-using-email/), [contract notes](https://www.sharesight.com/partners/contract-notes/))

### Simply Wall St — closest AI-augmented tool that already covers Thai market

- **Does well:** Has a Thailand market page; AI analyst narratives, DCF, fair value; visual "Snowflake" model; supports holdings upload with AI-matching.
- **Does poorly:** Research-first not portfolio-first; no real broker aggregation; no slip OCR; not localized to Thai language; subscription in USD; not optimized for daily/proactive use; doesn't sweep news per holding.
- **Gap to exploit:** Their AI narratives are deep but not push/personal/timely. A daily Thai-language digest sweeping news per holding is a daily-habit wedge they don't build.
- ([Portfolio feature](https://simplywall.st/features/portfolio), [Thai market](https://simplywall.st/markets/th))

### InvestMates (India) — closest conceptual model in an Asian retail context

- **What it is:** Multi-broker aggregation + "Otto AI" wealth assistant + family portfolios + multi-asset (stocks, MF, FD, bonds, PF, insurance). NRI-focused.
- **Why it matters:** This is *exactly* the model — it works for India because they integrated Indian brokers. The Thai equivalent does not exist. Strong validation that the pattern is fundable and works in an Asian retail context.
- ([App Store](https://apps.apple.com/sg/app/investmates-ai-money-manager/id1618762983), [Otto AI](https://investmates.io/otto))

### Magnifi — closest broker-agnostic + AI conversational

- **Does well:** Plain-English search across 15k securities; portfolio health checks; concentration/risk surfacing. **Proves retail will pay $14/mo for AI portfolio chat.**
- **Does poorly:** Tied to its own brokerage for execution; US-only; doesn't deeply integrate news/filings per holding; no proactive push.
- **Gap to exploit:** Drop the brokerage tie, add Thai market, add daily digest = differentiated.

---

## Other relevant trackers (broker-agnostic, varying depth)

| Product | Data-in | AI? | Asset coverage | Thai relevance |
|---|---|---|---|---|
| **Snowball Analytics** | 1,000+ brokers via Yodlee + 15 direct + CSV; manual | "Why is it moving" news (reactive); rebalancing, backtesting | Stocks, ETFs, crypto, multi-currency | Medium — strong analytics, no native SET broker support |
| **Kubera** | 20,000+ banks/exchanges via aggregators; manual for everything (incl. real estate, art) | None | Everything (incl. alternatives) | Medium — premium ($199/yr); strong manual-entry model |
| **GetQuin** | Auto via API + CSV + manual | AI Portfolio Analysis (diversification/risk/fees/macro); portfolio score | Stocks, ETFs, crypto | Medium — community angle; no Thai focus |
| **Parqet** | 50+ broker import; manual; CSV | ETF X-Ray, allocation analytics; not generative AI | Stocks, ETFs, 1k+ crypto, real estate, startups | Low — DACH focus, no SET coverage |
| **Capitally** | Manual, CSV, broker APIs | On-device encryption, MWR/TWR, dividend forecasting | Stocks, ETFs, crypto, real estate, bonds | Low-Medium — analytics depth without AI |
| **Delta by eToro** | 1,600+ broker / 300+ crypto exchanges via API; CSV; manual | Custom alerts; minimal AI | Stocks, crypto, NFTs, mutual funds, bonds | Medium — strong UX template; eToro conflict story |
| **Empower (formerly Personal Capital)** | Auto-sync US brokers/banks | Investment Checkup, retirement score, fee analyzer (not generative) | Stocks, funds, retirement | Low — US-only account sync |
| **Wealthfolio** | Manual / CSV (no broker API by design) | AI assistant for plain-English Q&A; AI insights on allocation | Stocks, ETFs, crypto | Medium — interesting AI pattern, but desktop and DIY |
| **Mezzi** | 10,000+ institutions via Plaid-like layer | Predictive portfolio adjustments, behavioral + macro signals | Multi-asset | Low — US-centric |
| **Yahoo Finance Portfolio** | Manual + brokerage sync (limited markets) | None | Global stocks, crypto | Low — minimal Thai broker support |

---

## Adjacent: AI-augmented research tools (no portfolio context)

These are best-in-class for AI on financial research but don't know what the user holds. Useful as quality reference points, not direct competitors.

| Product | What it does | Holdings-aware? | Notes |
|---|---|---|---|
| **FinChat → Fiscal.ai** | Conversational copilot on 100k+ companies, financial statements, earnings transcripts | No — research only | $24-64/mo. **Best-in-class research AI but no portfolio context — that's the gap we fill** |
| **Quartr Pro** | First-party IR materials AI chat with source traceability; 40M+ documents; mobile AI chat (Oct 2025) | No | Pro/serious-retail; no portfolio layer |
| **AlphaSense** | Generative Grid, sentiment, NLP across 10k sources | No | Enterprise pricing — not retail |
| **Kavout** | InvestGPT, Kai Score, Smart Money Tracker, AI Stock Picker | Light watchlist | 11k+ stocks, US-focused |

### Broker-tied AI co-pilots (not direct competitors but useful patterns)

| Product | Broker-tied to | What's worth copying |
|---|---|---|
| **Robinhood Cortex** | Robinhood Gold | Plain-language portfolio digests synthesizing market/news/analyst per holding; voice/NL trading |
| **Public.com Alpha + AI Agents** | Public.com | GPT-4 powered research; agentic monitoring (Mar 2026) |
| **Composer.trade** | Composer | "Trade with AI" — natural-language strategy → backtested |

---

## Thai-specific landscape (almost empty — verified)

| Product | What it actually is | Layer-on-top? | AI? | Verdict |
|---|---|---|---|---|
| **WealthMagik** | Mutual-fund-focused tracker; NAV alerts, watch lists, "Investment Diary" | MF only; manual entry for stocks/bonds/crypto via newer service | None | MF utility; weak on stocks; no AI |
| **Thai Funds Today** | Mutual fund performance tracking | MF only | None | Niche MF utility |
| **Settrade Streaming "All Portfolio"** | Settrade-stack consolidation across multiple Settrade-broker accounts | **Only within Settrade-broker stack**; doesn't aggregate non-Settrade brokers (Dime, Webull TH, etc.) | None | Limited |
| **Jitta** | Value-investing fundamental analysis + Jitta Score; covers 36k stocks across 40 markets including SET | Not a tracker — research tool | Algorithmic, not gen-AI | Big brand among Thai value investors but in a different category |
| **K-Plus / Wealth PLUS, SCB Easy / Easy Invest, FinVest** | Bank super-apps with investment + robo-advisory | **Only their own products** — no cross-broker aggregation | None | **Walled gardens; reinforce the aggregation gap** |
| **Money Lover (popular in TH)** | Expense tracker; bank-link in Thailand | Workaround "Event" feature for capital gains; no real investment module | No | Not a real investment tracker |

### Pantip demand signal

A May-2025 Pantip thread ([pantip.com/topic/43194159](https://pantip.com/topic/43194159)) explicitly asks for "apps/Excel to track investment portfolio across Thai stocks, foreign stocks, mutual funds, crypto with auto-update without manual entry." The fact that this question is being asked confirms the gap.

### Personal-finance super-apps in Thailand

None do meaningful investment aggregation: Money Lover, Spendee, Toshl, BudgetBakers Wallet — all expense-focused. Bank super-apps (K-Plus, SCB Easy) have investment modules but only for their own products. There is no entrenched daily-spending-app habit to dislodge.

---

## The defensible gap — concrete positioning

The gap is at the intersection of four things no single competitor combines today:

### 1. Broker-agnostic ingestion specifically tuned for Thai broker formats

- No global tracker (Sharesight, Portseido, Snowball) has direct sync with Dime, Webull TH, Liberator, Pi, or any Settrade-stack broker. They all require manual entry or CSV.
- Thai brokers don't expose retail APIs *except* Settrade Open API (~10 brokers). The realistic ingestion paths are **(a) email parse of daily contract notes**, **(b) OCR of trade-slip screenshots/PDFs**, **(c) Settrade Open API for supported brokers**.
- Build these first-class for Thai broker formats and you have a moat — a friction-killer no global player will bother to localize. See [data_ingestion.md](data_ingestion.md).

### 2. Proactive AI push, not on-demand chat

- Every AI competitor today is **reactive** ("ask me a question"). FinChat, Magnifi, Wealthfolio, even Robinhood Cortex's digests are mostly pull.
- The unmet need is **push**: "Here's your morning brief — these 3 holdings moved >2% overnight, here's why in 2 sentences each, here's what filings/news drove it, here's the 1 thing to watch today."
- This is what creates *daily habit*, which is what creates retention, which is what justifies subscription pricing.

### 3. Thai-language, Thai-context AI

- Even Simply Wall St (which covers SET) generates analyst narratives in English on US-formatted reports. A retail Thai investor reading SET-listed stocks needs:
  - Thai-language summarization of SET filings (Form 56-1, 56-One Report) and news
  - Awareness of Thai-specific catalysts (LTF/SSF/ThaiESG fund flows, BOT policy, baht moves, foreign flow data)
  - Pantip / Thai investment forum sentiment digestion
- **No global tool does this.** No Thai tool has the AI layer to do this. **The single most defensible wedge.**

### 4. Email digest as distribution channel

- Sharesight, Portseido — neither has a real daily digest product. Their reports are weekly/monthly tax reports.
- Robinhood Cortex Digests is the closest, but locked to Robinhood holdings.
- A daily Thai-language email arriving at 7:30am with portfolio-personalized AI commentary is a distribution wedge that doesn't require the user to open the app to feel value. Compounding habit + word-of-mouth.

### Concrete one-liner positioning

> **"The morning brief for your entire investment portfolio — across every Thai broker you use."**
>
> Snap a slip from any broker (Dime, Webull TH, Liberator, Pi, KSecurities, Bualuang…) and it's in. Every morning at 7:30, you get a Thai-language email from your AI analyst: what moved, why, what to read today, what to ignore. Open the app for the dashboard, the news sweep, the filing summaries.

### What this beats and why

- **Beats Portseido:** Same broker-agnostic baseline + AI + daily push + Thai-native. Portseido is a passive ledger; we're an active analyst.
- **Beats Sharesight:** Same data-in pattern + AI insight layer they don't have + Thai localization they won't build.
- **Beats Simply Wall St for Thai users:** Localized + portfolio-personal + push.
- **Beats Robinhood Cortex / Public Alpha:** Works across all Thai brokers, not locked to one.
- **Beats bank super-apps (K-Plus, SCB Easy):** Aggregates *across* their walls — neutral, not selling product.
- **Beats Jitta:** Jitta scores companies; we manage *your* portfolio with AI commentary. Different job.
- **Beats Finnomena/StashAway:** They're advisors selling allocations; we're a tool for the DIY investor who wants to *keep* picking but get smarter.

### Risks to flag honestly

- **Sharesight could enter Thailand** with a localization push and email-parse the same brokers — they have the engineering. Defense: speed + Thai-language AI depth + daily-digest habit they don't build today.
- **A Thai broker (Dime / Webull TH) could build an aggregator on top of itself** to lock in users — but they have a structural conflict (don't want to make it easy to see their fees vs competitors), so unlikely to be neutral.
- **Jitta could pivot from research to portfolio-personal AI** — strongest local incumbent risk; mitigated by the fact that Jitta's brand is fundamentals scoring, not portfolio management.
