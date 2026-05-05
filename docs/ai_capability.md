# AI capability — validating Bet #2

> Branched from [IDEA.md](IDEA.md). Validates the bet that "modern AI outperforms a typical retail investor at financial synthesis." Last updated 2026-05-01.

---

## Verdict

**TRUE TODAY BUT FRAGILE.** Strong on synthesis, education, summarization; weak on numerical accuracy without RAG; legally and reputationally fragile when crossing into recommendation territory.

---

## What the benchmarks show

### CFA exams (most directly investor-relevant)

- Claude 3 Opus and GPT-4o pass Levels I and II (GPT-4o: 90.6% L1, 73.9% L2).
- Dec 2025 paper "Reasoning Models Ace the CFA Exams": GPT-5, Gemini 3.0 Pro, DeepSeek-V3.1, Grok 4 all clear the passing threshold across all three levels on mock exams. ([arxiv](https://arxiv.org/html/2512.08270v1))
- Human pass rates for context: L1 ~43-45%, L2 ~42%, L3 ~50% (2024-2025). Charter takes humans 3-4 years; frontier models clear it in seconds. ([300hours.com — pass rates](https://300hours.com/cfa-pass-rates/))

### FinanceBench (the warning sign)

- 10,231 QA pairs over 10-K, 10-Q, earnings releases for S&P 500.
- Original 2023: GPT-4-Turbo + retrieval **failed/refused 81% of questions**.
- With long-context (full doc in window): GPT-4 Turbo failed 21%; Claude 2 failed 24%. **Retrieval was the bottleneck, not the model.** ([Patronus AI](https://www.patronus.ai/announcements/patronus-ai-launches-financebench-the-industrys-first-benchmark-for-llm-performance-on-financial-questions))

### FinBen (NeurIPS 2024, 42 datasets, 24 tasks)

- LLMs excel at information extraction and textual analysis.
- Struggle on advanced reasoning, text generation, forecasting. ([arxiv](https://arxiv.org/abs/2402.12659))

### BloombergGPT (50B params, finance-specific, 2023)

- Beat similar-size open models on financial NLP by large margins.
- **GPT-4 outperformed BloombergGPT on most financial tasks** including FinQA at 68.79%.
- Stable finding through 2024-2025: **scale + general capability beats domain pretraining at the frontier.** ([arxiv](https://arxiv.org/abs/2303.17564))

### Sentiment analysis

- GPT-4o without chain-of-thought beats FinBERT by up to 10% on Financial PhraseBank, especially on linguistically complex / ambiguous text.
- Counterintuitive: **longer reasoning *hurts* sentiment alignment** with human labels. ([arxiv](https://arxiv.org/html/2506.04574v1))

---

## Real products doing this today

| Product | Audience | What it does | Quality | Relevance to Put |
|---|---|---|---|---|
| **AlphaSense** | Institutional (88% of S&P 100; ~$500M ARR) | Premium content + AI search/gen-summarization | Gold standard. Lowest hallucination via proprietary content + tuned retrieval | Architecture pattern to copy: ground every output in retrieved sources |
| **FinChat.io** | Retail (150K+ users) | Conversational QA over 100K+ companies | Good for company-specific QA, peer compare | Doesn't do real-time push or portfolio-aware narrative |
| **Public.com Alpha** | Retail (Public members) | GPT-4-powered "investing co-pilot" tightly bound to user portfolio. Asset analysis, news for held stocks, earnings call summaries, screener, social sentiment. Heavy "not advice" disclaimer. | **Closest analogue to Put's idea.** Validates the integration pattern works | Model the personalisation + disclaimer pattern |
| **Robinhood Cortex** | Retail | Custom indicators/scans without code; integrated with prediction markets | Tool-use rather than explain | Different design philosophy |
| **BloombergGPT / Bloomberg AI** | Institutional | Entity tagging, sentiment, summarization at scale in Terminal | Production-grade | Not a retail target |
| **Kavout** | Retail intermediate | "Kai Score" + 7 specialized agents (technical, fundamentals, news sentiment, smart-money). $20/mo | Powerful but **overwhelming for true beginners** | Anti-pattern for Put's mass-novice target |
| **Magnifi** | Retail novices | AI portfolio assistant + ETF discovery + brokerage routing | Friendly co-pilot tone | Tone reference |
| **Prospero.ai** | Retail | Newsletter + app; bi-weekly stock picks (claimed 60% win rate vs S&P 2025) | Validates "push insight to user" model commercially | Note: this is exactly the kind of "AI predicts" claim that's getting SEC attention |

### What none of them do well today

- Genuinely portfolio-personalized synthesis (most are still company-by-company)
- **Non-English / non-US-market depth** — huge opening for Thai SET
- Calibrated uncertainty — they all "answer confidently" rather than "I'm not sure"
- True longitudinal memory ("you bought this 3 months ago, here's what changed")
- Distinguishing signal-worth-pushing from noise

---

## Failure modes

### a) Hallucinated numbers in long filings

- 2024 study: AI hallucinations in financial NLP queries up to 41%.
- Specific reported errors: misreading stock-split ratios (6-for-1 reported as 10-for-1), incorrect MD&A conclusions ~15% of cases. ([BizTech](https://biztechmagazine.com/article/2025/08/llm-hallucinations-what-are-implications-financial-institutions))

### b) Stale knowledge cutoffs

- Without retrieval, an LLM will confidently describe last year's CEO, last year's earnings, last year's guidance. Every numeric/factual claim must come from retrieval, not parametric memory.

### c) Miscalibrated sentiment

- Reasoning prompts *worsen* sentiment alignment with humans on financial text.
- Sarcasm, hedged guidance, central-bank speak, quarterly call non-denials are systematically misread.
- Failure surface = the *complex, ambiguous* news that retail investors most need help with.

### d) Hallucinated sources / citations

- ChatGPT documented inventing publication endorsements.
- Nippon Life v. OpenAI suit (March 2026, $10.3M): ChatGPT drafting motions for a case dismissed with prejudice — confidently. ([Stanford Law analysis](https://law.stanford.edu/2026/03/07/designed-to-cross-why-nippon-life-v-openai-is-a-product-liability-case/))

### e) Regulatory: AI-washing

- **SEC charged Delphia and Global Predictions in March 2024 — first AI-washing enforcement actions** for claiming AI capabilities they didn't have. ([SEC Press Release](https://www.sec.gov/newsroom/press-releases/2024-36))
- Securities class actions naming AI misrepresentation up 100% from 2023 to 2024.
- The line: it's fine to *use* AI; not fine to oversell it. "AI predicts which companies will make it big" got Delphia sanctioned. **Directly relevant to product copy.**

---

## The four synthesis tasks Put wants AI to do

### a) Daily news sweep against portfolio holdings

- **Quality bar today: HIGH.** Easiest task in the stack. Entity linking news → tickers is well-suited to LLMs (one study: 90% of articles had no missing tickers; 22% had additional relevant tickers vs. data providers).
- **Failure mode:** false positives ("noise as signal"); missing tickers when companies referenced obliquely (subsidiary names, executive names, sector proxies).
- **Thai-specific risk:** Thai financial NER is immature. No strong public Thai financial NER model.

### b) Synthesizing public filings (SET + SEC)

- **Quality bar today: MEDIUM, only with strong RAG.** FinanceBench: 81% failure without proper grounding. With long-context + tight grounding + per-claim citation, errors drop to 15-25% on US filings.
- **Thai SET:** THaLLE (Thai financial LLM) achieves 72-84% on SET Investment Consultant exam. Promising but immature. Frontier models work on Thai filings but with weaker domain anchoring than US/English. ([THaLLE arxiv](https://arxiv.org/html/2411.18242))
- **Failure mode:** numerical hallucination; conflating period comparisons (YoY vs QoQ, GAAP vs non-GAAP). Cite-and-verify-against-source is mandatory.

### c) Generating actionable signals ("consider X because Y")

- **Quality bar today: LOW for trade signals; MEDIUM for "things worth knowing."** Backtests of LLM-generated signals exist with eye-popping numbers but huge survivorship/snooping concerns. Real products (Prospero.ai 60% win rate claim) sit at "interesting but not advice."
- **Failure mode:** false confidence + regulatory exposure. SEC's Delphia action targeted exactly this language. Calibrated uncertainty largely absent in current LLMs.
- **Practical bar:** "consider reading this earnings transcript because guidance changed" = fine. "consider buying X because Y" = risky. **Frame as informational triggers, not directional recommendations.**

### d) Daily email digest of portfolio health

- **Quality bar today: HIGH.** Mostly templating + summarization + delta-detection. "You're up X today" is deterministic from market data; LLMs add value in narrative ("CPF dropped 2% on news of pork import tariffs") and prioritization.
- **Failure mode:** noise vs. signal threshold. Daily emails fatigue users fast. The risk isn't accuracy — it's relevance calibration. Also: **every digest is potentially a regulated communication.**

---

## The comparative baseline — how good is the typical retail investor?

The bar is **measurably low.**

### Performance

- Barber & Odean (78,000 US households, 1991-1996): buy-and-hold investors earned 18.5% net annual; the most active 20% earned 11.4% — **7-percentage-point underperformance per year.** ([Trading Is Hazardous to Your Wealth](https://faculty.haas.berkeley.edu/odean/papers%20current%20versions/individual_investor_performance_final.pdf))
- Retail investors have negative abnormal gross returns of 4-4.4%/year.

### Behavioral patterns

- Attention-driven buying (clusters in attention-grabbing stocks that subsequently underperform)
- Disposition effect (sell winners, hold losers)
- Underdiversification
- Naive reinforcement learning from past returns
- Overconfidence (especially when the gap between subjective and objective literacy is largest)

### Financial literacy

- Average US investor: **5.3/11** on basic literacy quiz (SEC/FINRA).
- 50% would invest in a "guaranteed risk-free 25% annual return" — i.e., would fall for the textbook fraud.
- Margin trading: 20% know what it is. Short-selling: 23%. ([SEC Financial Literacy Study](https://www.sec.gov/files/917-financial-literacy-study-part1.pdf))

### Implication for Thai market

Put's user description ("trade based on vibe and news from people / TV") matches global findings exactly. **The comparison Put is making is not "LLM vs. CFA charterholder" — it's "LLM-with-disclaimers vs. someone who can't define short-selling and would invest in a 25% risk-free return." That's a fight modern LLMs win comfortably.**

---

## What this means for product design

### Lean into

1. **Daily news sweep + portfolio-personalized digest** — highest quality, lowest risk, most defensible. Make this the spine.
2. **Education and framing** — "help users think like financial people" maps perfectly to what LLMs do best, and is the lowest-risk regulatory surface.
3. **Filing summaries with explicit citations** — always show source paragraph. Never let the model output a number not anchored to a retrieved snippet. This is what AlphaSense does.
4. **Sentiment + entity-linked news clustering** — LLMs are good at this; doing it well in Thai is an actual moat.

### Design defensively around

1. **"Consider buy/sell" language** — frame as "here's what changed; here's why it might matter." Bake the disclaimer into the *form* of the output, not just a footer.
2. **Numerical claims** — every number needs a citation. Use a verifier pass (second model call that checks numbers against retrieved context). Prefer raw filing extracts over LLM-restated numbers.
3. **Thai-language gap** — fine-tune (THaLLE-style) or use frontier model with careful prompting + Thai-specific retrieval. Plan for higher error rates than US/English benchmarks suggest.
4. **Signal threshold for push notifications** — first-class design problem, not a tuning problem. False positives kill trust faster than missed signals.
5. **Regulatory positioning** — "information, not advice" must shape product surface, not be a footer. Get the lawyer involved before MVP.
6. **Calibrated uncertainty** — build a UI vocabulary for "we're confident / we're not sure / we're guessing." Won't come for free; engineer it (e.g., consensus across model calls, retrieval-coverage scores).

### How the two bets compound

Bet #1 (real-time signal beats no signal) and Bet #2 (AI beats vibe-trading retail) compound: AI's strongest surface (daily synthesis + push) is exactly what powers the real-time signal advantage. **Product is well-designed at the bet level. Execution risk lives in numerical accuracy and regulatory framing.**
