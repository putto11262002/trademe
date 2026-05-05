# IDEA.md

> Living document for the Thai retail investor app. Grows as we discuss.
> **Rule:** only contains things we have actually discussed. No assumptions about undiscussed pieces. Items flagged `[needs validation]` are unverified; `[validated]`, `[refined]`, `[refuted]` reflect a research pass — see branched docs for evidence.

---

## Status

- **Stage:** raw / early brainstorm — second validation pass complete (architecture realigned to layer-on-top; competitors and data ingestion researched). v0 scope decided — see [v0.md](v0.md).
- **Current focus:** v0 area design (see [v0.md](v0.md))
- **Last updated:** 2026-05-01

---

## Branched docs

- [v0.md](v0.md) — narrowest first product slice: scope, decisions, what's deferred, open v0 questions
- [architecture.md](architecture.md) — technical design: layered architecture, DAL/Analytics/Domain interfaces, caching strategy
- [target_user.md](target_user.md) — who the user actually is, with research validating Put's assumptions
- [market_landscape.md](market_landscape.md) — the user's existing stack: brokers (we sit on top, NOT competitors) + adjacent wealth-tech
- [competitors.md](competitors.md) — actual competitor set: broker-agnostic portfolio trackers + AI insights layers
- [data_ingestion.md](data_ingestion.md) — manual entry + transaction-slip OCR + Settrade Open API + email forwarding + "Your Data" tailwind; phased ingestion roadmap
- [dashboard_design.md](dashboard_design.md) — dashboard presentation, framing, guiding, customizability research; recommended starting set + open design questions
- [stock_data_apis.md](stock_data_apis.md) — US equity data API landscape (prices, fundamentals, news, filings, transcripts); free/small/scale stack recommendations + RAG architecture
- [regulatory.md](regulatory.md) — Thai SEC info-vs-advice line, robo-advisory licensing, AI rulebooks, cross-border
- [ai_capability.md](ai_capability.md) — Bet #2 validation: AI capability evidence, failure modes, design implications

---

## Product (one-liner)

AI-powered investment dashboard for Thai retail investors. **A layer on top of existing brokers — not a trading platform.**

---

## Architecture

- Users keep using their existing brokers (Dime, Webull TH, Settrade-based broker apps, Liberator, Pi, etc.) for execution and custody.
- Our app sits **on top**: dashboard + AI insights + news sweep + proactive signals + daily digest.
- **Broker-agnostic.** We do not require integration with any specific broker.
- Positions get into our app via:
  1. **Manual entry**, or
  2. **Transaction-slip auto-import** (OCR / parse of broker-issued trade confirmations).
- Other ingestion paths researched (Bitkub API, email-forwarded broker PDFs, Settrade Open API, "Your Data" 2027) — see [data_ingestion.md](data_ingestion.md).
- We are not a broker. No execution, no custody, no order routing.

---

## Target user

### The trend (Put's read)

The average Thai person is getting into the stock market a lot more, driven by *accessibility*. A wave of apps now lets users buy stocks with very low minimums.

`[refined — see target_user.md §A1]` Validated for 2020-2021 (5x growth in new SET accounts; mobile-first low-cost brokers proliferated). **But the boom is over:** SET hit a 7-year low in mid-2025, trading value at 20-year lows, retail share of SET volume dropped from ~50% to 30-35%. **The narrative shifts from "ride a rising tide" to "re-engage the 1.5-2M disillusioned investors who opened accounts during the boom."** Scandals (MORE 2022, STARK, EA, JKN, Thonburi) burned the new cohort.

### Who they are (Put's read)

- Don't know much about stocks — `[validated]`
- Just want to "invest", "grow my money", "make money work" — `[insufficient evidence — fill via interviews]`
- Trade based on vibe and news — `[strongly validated]`. MORE pump-and-dump (Nov 2022) lost retail >4.5B baht
- Don't have time to monitor portfolio — `[mixed — adjacent literature suggests app users actually over-check]`. Likely a population split: active over-checkers vs. dormant under-checkers. Need primary research
- Don't know portfolio-management practices — `[validated indirectly]`

### Demand signal (added from research)

A May 2025 Pantip thread ([pantip.com/topic/43194159](https://pantip.com/topic/43194159)) explicitly asks for "apps/Excel to track investment portfolio across Thai stocks, foreign stocks, mutual funds, crypto with auto-update without manual entry." The fact that the question is being asked confirms the gap is felt.

### Segment

Beginner-to-intermediate Thai retail investors who want better signal without doing the work themselves.

### Demographics (added from research)

`[refined — see target_user.md §B2]` 2020-2022 cohort skewed ~60% Gen Y (now 30-46), Bangkok-heavy, tech-native, mid-income (Gen Y above-average ~฿30K/mo). Gen Z entering but more crypto-curious than equity-curious — distinguish *Gen Y first-time SET buyers* from *Gen Z first-time Bitkub buyers*.

---

## Problem 1 — The user's broker app(s) don't help them *think*

The user's existing broker app(s) provide trading and basic portfolio management but don't provide the insight, framing, and proactive-signal layer they need. **Dime is a representative example** of what a modern, popular Thai retail broker offers — it's the user's stack, not our competitor.

### Dime as representative — what works

- Simple
- Easy to understand
- Provides good-enough info for beginners
- Provides good portfolio management

### Dime as representative — what's missing (and these gaps generalize across Thai brokers)

- Doesn't provide framing or guiding to help users *understand* what they're seeing
- Doesn't provide enough detail
- Doesn't provide a high-signal feedback loop on portfolio performance
- Doesn't guide the way users *think about investing*
- **No AI / insights features publicly announced as of 2026** (Dime's 2025 roadmap was breadth — options, insurance, debit card — not AI)
- **Walled garden — only their own products / trades are visible.** Bank super-apps (K-Plus / Wealth PLUS, SCB Easy / Easy Invest, FinVest) have the same problem: investment modules but only for what they sell.

### What we want to build on top

A semantic / presentation layer that does four things:

1. **Wealth signal.** Give the user a clear signal of how their wealth is doing. "I wake up every morning and I want to know how much money I made while I slept."
2. **Proactive reporting.** Push a sense of "how am I doing" to the user without them having to come look. Channel TBD — notification, email, or both. *(Notification system not yet decided.)*
3. **Better presentation / analytics layer.** Find a good balance for beginner *and* intermediate users — most dashboards skew one way or the other.
4. **Guide and framing.** Help beginners think the way financial people think, but in a friendly way.

### Real competitors and the differentiation gap

`[see competitors.md]` The Thai-targeted broker-agnostic-tracker space is **almost empty**. Closest by category:

- **Portseido** (closest globally) — Thai-targeted, weak AI, no proactive layer, no slip OCR
- **Sharesight** (closest functional model) — best email-parse data ingestion at scale, no generative AI, no Thai
- **Simply Wall St** (closest AI tool covering SET) — research-first not portfolio-first, no proactive push, no Thai-language AI
- **InvestMates (India)** (closest conceptual model) — multi-broker + Otto AI assistant + family portfolios; validates the model in an Asian-retail context but Thai equivalent doesn't exist
- **Magnifi (US)** — proves retail will pay $14/mo for AI portfolio chat; broker-tied, US-only

**The defensible gap is at the intersection of four things no one combines today:**
1. Broker-agnostic ingestion specifically tuned for Thai broker formats (Sharesight has the model, doesn't localize)
2. Proactive AI push (daily digest), not on-demand chat (every AI competitor today is reactive)
3. Thai-language Thai-context AI (SET filings, BOT/baht/foreign-flow context, Pantip sentiment)
4. Email digest as a distribution channel that compounds habit

**Adjacent (broker-tied, partial substitutes — not direct competitors):** Finnomena (agentic AI on Google Cloud Mar 2025, but tied to its own fund-distribution business), InnovestX (Earnings Brief on Azure OpenAI, tied to InnovestX brokerage), Jitta Wealth (algorithmic stock ranking, discretionary managed money).

---

## Problem 2 — Users lack knowledge and time

The same users:
- Don't know anything about the market
- Trade based on vibe and news from people / TV
- Don't know portfolio-management practices
- Don't have time to do the work themselves

### Proposed agentic system

An AI agent layer that can:
1. Run **news sweeps**
2. Run **market-analysis sweeps**
3. Surface **suggested actions** based on the user's specific portfolio (the portfolio data they've imported into our app)

The system still needs designing. Premise: AI is good at aggregating data and extracting patterns. Even if it's not world-class analysis, an agent that reads news daily can give the user the most up-to-date picture.

`[research-informed caveat — see ai_capability.md]` The four sub-tasks have very different quality bars today:

| Task | Quality bar | Risk surface |
|---|---|---|
| Daily news sweep against holdings | **HIGH** (well-suited to LLMs) | Low |
| Synthesizing public filings | **MEDIUM, only with strong RAG** | Medium (numerical hallucination) |
| "Suggested actions" / signals | **LOW for trade signals; MEDIUM for "things worth knowing"** | **HIGH** — regulatory + reputational |
| Daily email digest | **HIGH** | Medium (every digest is potentially regulated communication) |

Implication: **lean into news sweep + portfolio-personalized digest + filing summarization with citations. Be very careful with "suggested actions."**

---

## Bets

The product rests on two bets:

1. **Real-time signal beats no signal — even if users still vibe-trade.** Some users check their portfolio once a week; by then the stock has already moved. Bringing the signal to them (rather than waiting for them to come look) catches them before it's too late.
2. **Modern AI outperforms a typical retail investor at financial synthesis.** Not world-class, but compared to a normal person, current AI has more domain knowledge and capacity. Strong on financial benchmarks. — `[validated as TRUE TODAY BUT FRAGILE — see ai_capability.md]`. Frontier models pass CFA L1-L3 mock exams. Real products (Public Alpha, Kavout, FinChat, AlphaSense) ship this premise commercially. Fragile at numerical accuracy without RAG, and at the "AI prediction / recommendation" boundary where SEC AI-washing enforcement starts (Delphia/Global Predictions, March 2024).

**The two bets compound.** AI's strongest surface (daily synthesis + push) is exactly what powers the real-time signal advantage. Product is well-designed at the bet level. Execution risk lives in numerical accuracy and regulatory framing.

---

## Solution shape (running summary)

Two layers + one push channel + an ingestion layer:

- **Layer 1 — Smart dashboard UI:** portfolio composition, performance vs. benchmarks, risk exposure, cost tracking, rebalancing signals. Designed to *guide thinking*, not just show numbers.
- **Layer 2 — AI agent layer:** scans public news, SEC filings, market data; synthesizes sentiment and fundamental shifts against the user's holdings; surfaces actionable signals.
- **Daily email digest:** reports portfolio health every morning. Users wake up knowing how their money is doing.
- **Data ingestion (proposed phased path; see [data_ingestion.md](data_ingestion.md)):**
  - Phase 1: Manual entry + Bitkub API + on-chain wallet tracking (lowest risk, fastest ship)
  - Phase 2: Smart manual entry — NLP "type what you did" + "snap a slip" OCR
  - Phase 3: Email-forwarded daily contract notes (Sharesight model — works for traditional SET brokers)
  - Phase 4: Settrade Open API connector (~10 brokers via user-issued API keys)
  - Phase 5 (2027): "Your Data" Phase-2 connector — BOT/SEC open-finance rails for securities holdings

### Macro tailwind

`[see data_ingestion.md §Your Data]` Bank of Thailand's "Your Data" project (announced Oct 2024) has Phase 2 (capital-markets data — securities + mutual fund holdings) co-regulated by SEC, landing **2027–2028**. Framework explicitly *"promotes the development of data aggregators."* We're positioned to be a first-mover when this lands.

---

## Research / data pipeline

- Public sources only (news, filings, market APIs)
- AI generates original analysis
- No licensing dependencies on paid signal services

---

## Positioning

- **Information and insights platform** — not a financial advisor
- All output framed as educational / informational via disclaimers
- Thai SEC reportedly supports AI and robo-advisory use cases; legal review with a securities lawyer needed before launch — `[validated and refined — see regulatory.md]`

### Validated framing rules (from research)

- The line is **substance over form**: "X dropped 5% on news Y, in your portfolio" = information; "Consider selling X" = advice (regulated). Disclaimer alone does NOT buy you out of licensing.
- Two new AI rulebooks in 2025: **SEC AI/ML Governance Framework for Capital Markets** (fairness/legal/accountability/transparency) + **BoT AI Risk Management Guidelines** (Sept 2025: RAG, hallucination controls, eval metrics, explainability, AI-use disclosure, human-review opt-out).
- **PDPA caveat:** Thai PDPA classifies financial data as **sensitive** under Section 26 — same tier as health/biometric. Needs explicit, granular consent; cross-border transfer constraints (e.g., sending PDFs to OpenAI/Anthropic in US needs explicit user consent). First major fines issued August 2025 (~21.5M THB). Prefer on-device or self-hosted parsing where feasible. See [data_ingestion.md §PDPA](data_ingestion.md).
- US-stock coverage is straightforward as an information layer (Sept 2024 SEC guidelines accommodate via locally-licensed-intermediary route).
- **No standalone robo-advisor licence in Thailand** — operates under existing securities-business categories. If we ever cross into recommending allocations, we need a licensed entity (own or partner).

---

## Candidate one-liner positioning (from research, for discussion)

> **"The morning brief for your entire investment portfolio — across every Thai broker you use."**
>
> Snap a slip from any broker (Dime, Webull TH, Liberator, Pi, KSecurities, Bualuang…) and it's in. Every morning at 7:30, you get a Thai-language email from your AI analyst: what moved, why, what to read today, what to ignore. Open the app for the dashboard, the news sweep, the filing summaries.

This needs Put's gut-check before adopting.

---

## Open questions / parking lot

### Sharpened by research, still need a decision

- **"Scandal protection" wedge** — surfaced by research, not by Put yet. AI is well-suited to anomaly detection on financials, ownership concentration, related-party transactions, sudden volume changes. May be a sharper wedge than generic "growth advice." Discuss?
- **Notification system + signal threshold** — false positives kill trust faster than missed signals. First-class design problem.
- **Adopt the candidate one-liner positioning above?** Or refine?

### Open from research

- **Multi-broker reality** — primary research needed. How many Thai retail users actually have positions at multiple brokers? Aggregation value depends on this.
- **Engage early with BOT/SEC on "Your Data" Phase 2?** (Industry working group forming late 2026.) First-mover advantage on the rails would be a moat.
- **PDPA architecture decision** — on-device parsing vs. self-hosted in-region vs. cross-border with explicit consent. Affects what we build and where.
- **Settrade Open API ToS** — legal read needed: do brokers permit aggregator use of user-issued API keys, or restrict to "personal use"?

### Still completely undiscussed

- Onboarding flow
- Monetization model (Magnifi proves $14/mo WTP for AI portfolio chat — but in US, not Thailand)
- Languages — Thai-only, Thai+English?
- Data sources for SET stock prices and fundamentals (SET API, Settrade, third-party?)
- Team / build vs. buy
- Success metrics

### Primary research to do (Put → users)

- Portfolio-checking frequency by segment (active vs. dormant)
- Stated goals — concrete or vague?
- Trust/sentiment shifts after MORE/STARK/EA — leaving SET for what?
- Information sources at the moment of trade (Pantip, LINE, finfluencer, broker push, analyst note?)
- **How many brokers does a typical user actually have? (Single-broker = no aggregation value; multi-broker = aggregation is a real wedge.)**
- Quick experiments by Put: open accounts at Dime / Liberator / Webull TH and observe what email/PDF artifacts each broker actually sends post-trade — see [data_ingestion.md §Open verification items](data_ingestion.md).
