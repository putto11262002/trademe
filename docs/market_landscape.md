# Market Landscape — the user's existing stack

> Branched from [IDEA.md](IDEA.md). Maps the brokers and adjacent wealth-tech the Thai retail investor already uses. **This is NOT competitor analysis** — we are a layer on top of these tools, not competing with them. For the actual competitor set (broker-agnostic portfolio trackers + AI insights layers), see [competitors.md](competitors.md). Last updated 2026-05-01.

---

## TL;DR

- Thai retail users typically hold positions at one or more **brokers**: Dime, Webull TH, Liberator, Pi, Settrade-based broker apps (Bualuang, Krungsri, etc.). These are the user's underlying execution and custody stack — we sit on top of whatever they use.
- **No Thai broker provides an AI insights / proactive signal layer as of 2026.** Dime in particular has shipped no AI features (its 2025 roadmap was breadth: options, insurance, debit card). This is the gap our layer fills.
- **Adjacent wealth-tech (Finnomena, InnovestX, Jitta Wealth) does ship AI features — but they're tied to their own fund-distribution / brokerage businesses, not broker-agnostic.** They're partial substitutes for some users; not direct competitors for a broker-agnostic layer.
- Settrade Streaming is the de-facto Thai-stock retail trading plumbing across 30+ brokers. Webull Thailand is the fastest-rising US-stock execution player (300K+ users in 8 months).

---

## The broker stack (where users hold positions — we sit on top)

| Broker | Parent | Target user | Asset coverage | Distinctive | AI / Insights | Fee model |
|---|---|---|---|---|---|---|
| **Dime!** | KKP | Gen Z / mass-retail | Thai + US stocks (fractional), funds, gold, savings, options, insurance | All-in-one super-app, low minimums | None publicly | Subscription tier for Thai stocks |
| **Webull Thailand** | Webull (US-listed) | US-stock-focused younger retail | US stocks, ETFs, options; HK + China A-shares from Jan 2026 | **300K+ users in 8 months. Most-downloaded brokerage app in Thailand on both stores Nov-Dec 2024.** | Standard charts/screeners; no LLM AI | Low/zero commission US |
| **Liberator** | Liberator Securities | Cost-sensitive active traders | Thai stocks (zero commission), US stocks, TFEX, gold, FX | Lifetime zero commission Thai; community/social; TradingView integration | Educational + technical tools | Zero commission Thai |
| **Pi Securities** | Pi | Mid-tier active traders | Thai, US, HK stocks, derivatives, ~1,700 funds | Strong account optionality; broker research | Analyst notes; no AI feature | Standard broker fees |
| **Settrade Streaming** | SET (since 2000) | All Thai-stock active traders | Thai equities + derivatives | **De-facto standard** white-labeled across virtually every Thai broker | None (it's plumbing) | Broker-set commissions |
| **Bualuang mTrading / Trade Master** | Bualuang Securities | BBL retail | Thai equities, derivatives, 2,000+ funds | "Technical Signals" scanner, Quick Trade, Auto Chart | Rule-based technical signals | Standard |
| **Krungsri Stock Expert / KSS iGlobal** | Krungsri Securities | BAY customers, foreign-stock-curious | Thai + global, derivatives, funds, Thai ESG | iGlobal app for overseas | Analyst tools | Standard |
| **StashAway Thailand** | StashAway (SG) | Cross-border / English-comfortable | Global ETFs via managed portfolios | Globally proven robo-advisor | Algorithmic allocation | 0.2-0.8%/yr |
| **Bitkub** | Bitkub Online | Crypto-curious | Crypto | ~90% domestic crypto market share, ~300K+ customers | Standard | Per-trade fees |

### Multi-broker reality

Many Thai retail users plausibly hold positions at more than one broker (e.g., Dime for fractional US + a Settrade-based broker for SET + Bitkub for crypto). **Aggregation across brokers is a real value prop only if this is common** — needs validation in primary user research (added to IDEA.md research list).

---

## Representative broker audit: Dime

Useful as evidence of "what a popular, modern Thai retail broker provides" — and what it doesn't.

### Scale

- AUM **~104.49B baht** as of FY2025 reporting (243% YoY growth). ([InfoQuest](https://www.infoquest.co.th/2026/589250))
- ~2M+ downloads (>50% Gen Z). ([Alpaca](https://alpaca.markets/blog/dime-revolutionizing-investing-in-thailand-with-alpaca/))
- 3-year stated target: 8M MAU.
- First profitable year FY2025 — 802M baht revenue.

### Asset coverage

- US stocks (fractional, from ~50 THB)
- Thai SET stocks (added 2023, monthly membership model)
- ~1,700 mutual funds from 20 AMCs
- Gold (99.99%, from 100 THB)
- Dime! Save (high-yield deposit) and Dime! FCD (FX deposit)
- US stock options (2025)
- "Dime Jai" travel insurance, "Dime Nen" debit card (2025)
- **Does NOT cover** non-US foreign markets

### Order types & risk tools

- Market and limit orders
- **GTC orders** (Good-Till-Cancelled, up to 90 days) — closest thing to a stop-loss preset
- No true stop-loss / conditional / trailing-stop orders; no margin lending

### Portfolio analytics & alerts

- "Dime! Analytics" — composition, performance, diversification, allocation
- Real-time asset tracker, trending lists
- Standard price/movement notifications
- **No public evidence of AI-generated insights, predictive analytics, or behavior-aware alerts**

### AI / insights as of 2026

- **None publicly announced.** Dime's 2025 PR was about product breadth, not AI. → **The insights gap our layer fills is real and not being plugged by Dime itself.**

### User complaints (signal for the data-ingestion side of our product)

- Slow/awkward withdrawals
- No FX hedging on USD positions
- Hidden tax/transfer costs
- Login issues after forced updates
- Confusing operating-hours messaging

---

## Adjacent wealth-tech with AI features (broker-tied; partial substitutes)

These are NOT direct competitors for a broker-agnostic layer like ours, but they're the closest things in the Thai market to an "AI insights for retail investors" product. Worth understanding.

| Player | What it is | AI features | Why it's NOT a direct competitor |
|---|---|---|---|
| **Finnomena** | Standalone wealth-tech, ~780K users, USD 2B+ AUA, 3,200+ licensed advisors. IPO planning 2026-27. | **Agentic AI deployed with Google Cloud (Mar 2025).** Custom AI on Vertex AI / BigQuery. Email-summarization agents. "Mr Messenger" / FundTalk / MEVT Call advisory bands via LINE. | Tied to its own fund-distribution business; users get Finnomena's AI by using Finnomena as their fund broker. Not broker-agnostic. ([TechNode](https://technode.global/2025/03/12/finnomena-ties-up-with-google-cloud-to-provide-agentic-ai-solutions-to-enhance-services-for-investors/), [Google Cloud Press](https://www.googlecloudpresscorner.com/2025-03-12-Finnomena-Deploys-Agentic-AI-Solution-with-Google-Cloud-to-Better-Serve-Its-Diverse-and-Fast-Growing-Investor-Base,-Enabling-Its-Next-Phase-of-Business-Growth)) |
| **InnovestX (SCBX)** | SCBX broker, Thai + global stocks (31 markets), funds, crypto, Intelligent Portfolios. | **"Earnings Brief" AI-generated fundamental summaries on Azure OpenAI** (Dec 2023+). | Tied to InnovestX as the broker. Users see AI insights only on InnovestX-traded holdings. ([SCBX](https://www.scbx.com/en/news/innovestx-collab-microsoft-investment-insights-with-microsoft-azure-openai/)) |
| **Jitta Wealth** | Thailand's largest *private* fund manager (~13.4B THB AUM). AI-driven stock ranking + auto-rebalance. Holds private fund mgmt licence ลค-0105-01. | Algorithmic stock selection IS the product. "Jitta Market Prediction." | Discretionary managed money — different product shape from a self-directed insights overlay. ([Jitta Wealth](https://jittawealth.com/)) |
| **Robowealth / odini** | First Thai robo-advisor, 5 risk buckets (4-12% target). odini BLACK for 500K+ THB clients. | Rule-based "AI" allocation. | Discretionary fund DCA — handles allocation for you, doesn't surface signals for self-directed investors. |
| **SCB EASY (Robo Advisor inside)** | SCB retail banking + 1,200+ funds. | Rule-based + Morningstar partner. | Bank-channel fund recommendations, not a layer-on-top insights product. |
| **FinVest** | KBank + Lufax + Robowealth. | Not a major AI story. | Bank-backed offshore fund access. |

### Implications for our positioning

- **Reaffirms Problem 1:** even the most popular Thai retail brokers don't provide an insight / framing / proactive-signal layer.
- **Adjacent wealth-tech (Finnomena, InnovestX) shows AI insights are commercially valid in Thailand** — proof-of-market, not proof-of-competition.
- **Their broker-tied model is the opening:** users who span brokers (Dime for fractional US + a SET broker + Bitkub for crypto) can't get a unified view from any one wealth-tech. We can.
- The differentiation question becomes: are we deeper / more proactive / better-personalized than Finnomena's content-style delivery on a *single* user's slice? And/or do we win because we cover holdings across *all* their brokers, not just one?

---

## Sources

- [Bangkok Post — KKP Dime set to double assets to B10bn](https://www.bangkokpost.com/business/general/2654197/kkp-dime-set-to-double-assets-to-b10bn)
- [InfoQuest — KKP Dime AUM ทะลุแสนล้าน, target 8M users](https://www.infoquest.co.th/2026/589250)
- [Alpaca — Dime!: Revolutionizing Investing in Thailand](https://alpaca.markets/blog/dime-revolutionizing-investing-in-thailand-with-alpaca/)
- [Money & Banking Magazine — Dime! launches options, Dime Jai, Dime Nen (2025)](https://en.moneyandbanking.co.th/2025/193264/)
- [Money & Banking — Dime! launches Thai stock trading](https://en.moneyandbanking.co.th/2023/62819/)
- [Webull Thailand — 300K users in 8 months](https://www.prnewswire.com/apac/news-releases/webull-thailand-named-best-online-trading-platform-for-us-market-access-by-the-global-economics-302360106.html)
- [Liberator — no-fee app](https://www.nationthailand.com/business/trading-investment/40024179)
- [Settrade Streaming](https://play.google.com/store/apps/details?id=com.settrade.streaming)
- [About Finnomena](https://www.finnomena.com/about-us/)
- [TechNode Global — Finnomena agentic AI with Google Cloud (Mar 2025)](https://technode.global/2025/03/12/finnomena-ties-up-with-google-cloud-to-provide-agentic-ai-solutions-to-enhance-services-for-investors/)
- [SCBX — InnovestX x Microsoft Azure OpenAI](https://www.scbx.com/en/news/innovestx-collab-microsoft-investment-insights-with-microsoft-azure-openai/)
- [Jitta Wealth — About](https://jittawealth.com/about/)
- [Hubbis — Robowealth](https://www.hubbis.com/article/robo-advisor-robowealth-sending-waves-of-disruption-through-thailand-s-growing-wealth-market)
- [Pi Securities](https://www.pi.financial/en)
- [StashAway Thailand](https://www.stashaway.co.th)
