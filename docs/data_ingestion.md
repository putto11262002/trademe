# Data ingestion — getting Thai broker positions into our app

> Branched from [IDEA.md](IDEA.md). Maps the realistic ingestion paths for a broker-agnostic Thai investment dashboard, with an opinionated v0–v2 roadmap. Last updated 2026-05-01.

---

## TL;DR

- **Six viable ingestion paths**, in order of "easy now" → "best in 2 years":
  1. **Manual entry** (always available, polish required)
  2. **Crypto: Bitkub API + on-chain wallets** (free, low-PDPA-risk, ship early)
  3. **Smart manual entry** — NLP "type what you did" + "snap a slip" OCR (cheap with current LLMs)
  4. **Email-forwarded daily contract notes** (Sharesight model — works for traditional SET brokers)
  5. **Settrade Open API** (retail-issued keys, ~10 supported brokers, real moat)
  6. **"Your Data" Phase 2** (BOT/SEC open-finance rails — securities holdings — 2027–2028)
- **Macro tailwind:** Bank of Thailand's "Your Data" project, announced Oct 2024, has Phase 2 (capital-markets data — securities + mutual fund holdings) co-regulated by SEC, landing **2027–2028**. The framework explicitly *"promotes the development of data aggregators."* We're positioned to be a first-mover when this lands.
- **PDPA caveat:** Thai PDPA classifies financial data as **sensitive** under section 26 (same tier as health/biometric). Needs explicit, granular consent, cross-border transfer constraints. First major fines issued August 2025 (~21.5M THB).
- **Don't build:** Gmail OAuth (CASA cert overhead), SMS parsing (unreliable for trade detail), screen-scraping broker portals (legally fraught, breaks).

---

## What Thai brokers actually output after a trade

| Broker | Confirmation channel | Format | Notes |
|---|---|---|---|
| **Bualuang Securities (BLS)** | Email (E-Document) + web portal download (E-Service → E-Document → Stock Trading Confirmation Note); 2-yr history | Structured PDF | Standard pattern |
| **Settrade-platform brokers** (Phillip, RHB, Yuanta, KSecurities, Thanachart, DBSV, AIRA, Maybank, etc.) | In-app order/deal history; daily contract note PDF emailed by each broker (each brands their own E-Document) | Structured PDF, generated server-side from common Settrade template | Streaming app shows orders/portfolio in-session; settled daily confirmation in each broker's E-Document portal |
| **Krungsri Securities (KSS)** | E-Trade portal + E-Document email | Structured PDF | Standard |
| **Pi Securities** | Pi Financial app + Settrade Streaming + E-Document email | Structured PDF | **Supports Settrade Open API** |
| **Liberator** | Mobile-first; in-app trade history + E-Document/email | Structured PDF | Newer no-fee broker; less public doc |
| **Dime! (KKP)** | Mobile-only app; in-app order history + monthly statement; in-app "shareable transfer slip" | App-generated PDF / image; statement PDF | Public docs sparse — likely no per-trade email PDF; rather monthly/event statements |
| **Webull TH** | In-app history; account statements & trade confirmations downloadable as PDF; CSV export of order history (limit: once/day) | PDF + CSV | Webull global pattern |
| **Bitkub** | In-app order history + email confirmations; **full retail API** (Account/Trade/Withdraw scopes) | Email + native API | Best ingestion target — see §Crypto |

**Key implication:** for traditional SET brokers, the canonical artifact is a **structured daily PDF emailed to the user's registered address**. This is *much* better for ingestion than per-trade scanned slips: machine-generated, consistent layout per broker, has a text layer (not raster) — `pdfplumber` + LLM normalization gets ~99% accuracy at ~$0.005/doc.

Mobile-only brokers (Dime, Liberator, Webull TH) skew to in-app receipts and monthly statements. Users need to screenshot or export.

**Open verification items** (worth a 30-min test each by Put):
- Dime's exact email/PDF behavior post-trade
- Liberator's E-Document specifics
- Webull TH PDF format

---

## Settrade Open API — the surprise finding

Settrade — the SET-affiliated technology platform powering most Thai brokers — exposes a **retail-accessible Open API**. This is the most underappreciated path.

- **Endpoints:** Account, Portfolio, Deal information (positions, trade history), plus order placement (which we don't need).
- **Languages:** Python, Excel/VBA, AmiBroker. SDK on GitHub: [settrade/stt-open-api-sdk-example](https://github.com/settrade/stt-open-api-sdk-example).
- **Auth model:** **API-key, not OAuth-redirect.** Each user generates an Application ID + Secret tied to their broker account, then signs requests. The user creates the key inside their broker portal.
- **Supported brokers (partial list, 2024-2025):** Pi Securities, Phillip Securities (POEMS), RHB Securities, Yuanta, Krungsri Securities (derivatives), Country Group, Globlex, Classic Ausiris. Live broker list at developer.settrade.com/open-api/document/broker-list.
- **Sandbox:** yes, free.
- **Cost to user:** typically free; some brokers ~200-500 THB/month for derivatives.

**This is the best programmatic path for SET stocks & TFEX positions** until "Your Data" lands. Caveats:
- It's designed for algo traders, not "log in once and we'll sync forever." UX is "go to your broker portal, find the API menu, generate keys, paste here" — non-trivial friction but achievable with a guided wizard. Sharesight uses analogous flow for many US brokers.
- **Brokers NOT on Settrade Open API:** Bualuang Securities (uses Bangkok Bank's own infra), Dime, Webull TH, Liberator. These need email-parse or OCR.
- **Open question:** do brokers consider use of Settrade Open API by an aggregator (vs. by the user themselves) a ToS violation? Each broker's API terms need a legal read.

Sources:
- [Settrade Open API developer portal](https://developer.settrade.com/open-api/)
- [Pi Securities — Settrade API setup](https://support.pi.financial/hc/en-us/articles/6333789684121-How-to-set-up-Settrade-Open-API)
- [Phillip Securities Settrade API manual](https://poems-static-prod.azureedge.net/media/EN_2024_Phillip_Settrade_API_manual_guide_18ba5a47c3.pdf)

---

## "Your Data" — the macro tailwind

Bank of Thailand's open-finance initiative, announced October 2024.

- **Phase 1 (deposit data):** late 2026 go-live, regulated by BOT.
- **Phase 2 (capital-markets data — securities + mutual fund holdings):** 2027–2028, **SEC** as co-regulator. Explicitly named in scope: *"information regarding securities and mutual fund holdings."*
- **Phase 3 (insurance):** 2027–2028, OIC.
- **Architecture:** user-consent-based digital data-sharing rails, standardized formats determined by SEC + industry working groups. **The framework explicitly "promotes the development of data aggregators."** BOT is essentially inviting a Plaid-equivalent to exist.
- **Earlier precedent:** dStatement (BOT, live since 2022) enables consented bank-statement sharing between banks for credit assessment — proven plumbing.
- **National Digital ID (NDID):** live, broadly used for KYC across banks and brokers. Useful for our auth/onboarding flow today.

**Strategic implication:** a layer-on-top portfolio app launched in 2026 is positioned to be one of the first consumers of Phase-2 capital-markets data when it lands in 2027. Worth engaging early with the SEC's industry working group and BOT's Open Data team — they want aggregator participation.

Comparison: Singapore's **SGFinDex** is live and covers SGX brokers + CDP holdings via Singpass — what Thailand's Phase 2 essentially aspires to.

Sources:
- [BOT — Project Your Data](https://www.bot.or.th/en/financial-innovation/digital-finance/open-data/Your_Data_Project.html)
- [BOT introduces open banking data initiative — Bangkok Post](https://www.bangkokpost.com/business/general/2877327/central-bank-introduces-open-banking-data-initiative)
- [Thailand Unveils 'Your Data' — Fintech Singapore](https://fintechnews.sg/102016/thailand/thailand-unveils-your-data/)

---

## OCR / parsing state of the art (2026)

| Approach | Accuracy on structured fin-docs | Cost / 1000 pages | When to use |
|---|---|---|---|
| **PDF text-layer extraction + LLM normalization** (`pdfplumber` → Claude/GPT) | 98%+ on structured PDF; near-zero on scans | Few cents (~$1–5/1000) | **Default for emailed daily confirmation PDFs** |
| **Gemini 2.5 / GPT-5 vision direct on PDF** | ~94% invoice-extraction accuracy | ~$5–20/1000 | Mixed quality, scans, screenshots |
| **Claude vision** | ~90%; lowest hallucination rate, most consistent | Similar | Best when stability > accuracy ceiling |
| **AWS Textract AnalyzeExpense** | Industry-leading table extraction (82% line-item on 6-col tables) | $8/1000 | Pure-cloud, no LLM |
| **Google Document AI Form Parser** | Strong form, weaker on dense tables | $30/1000 (drops to $0.60 at 5M+ scale) | High-volume structured forms |
| **PaddleOCR-VL / GLM-OCR (open-source VLMs)** | 92–94 on OmniDocBench, beats GPT-5 on documents; 167× cheaper self-hosted | Self-hosted | When PDPA pushes off cloud LLMs |

**Recommended stack for v0–v1:** `pdftotext` / `pdfplumber` first pass → Claude (or GPT-5) with a per-broker schema prompt to normalize fields → human review queue for low-confidence extractions. Per-broker template captured once gives ~99% at $0.005/doc.

### Failure modes

- **Scanned-image PDFs** (rare from major brokers, common from very small or older brokers): OCR error rate 2–5% on numeric fields → mis-quantified positions.
- **Layout drift:** brokers redesign PDFs occasionally. Sharesight builds per-broker templates and warns this breaks ingestion. Plan for monitoring + a "this confirmation didn't parse, please review" UX.
- **Thai-language column headers** mixed with Roman numerals: most modern VLMs handle Thai fine; Tesseract-only pipelines need `tha.traineddata` + tuning.
- **Multiple accounts per broker** (cash, credit balance, derivative, foreign): users have separate confirmations and may forward only one.
- **Corporate actions** (XD, XR, splits, conversions): rarely look like trades on a confirmation; need separate ingestion path or pricing-data overlay.
- **Rounding/fees mismatches:** Thai commission VAT is 7% of brokerage; easy to mis-attribute.
- **Forwarding hygiene:** users sometimes forward the *receipt* email rather than the broker email, breaking sender-based authentication.

---

## Email parsing approach

**Sharesight is the canonical reference.** Each portfolio gets a unique forwarding address (e.g., `portfolio-xyz@sharesight.com`); user either (a) sets that as a CC inside their broker preferences, or (b) sets up a Gmail filter that auto-forwards trade confirmations. Sharesight reads the PDF attachment server-side, extracts trade fields, and posts them to the portfolio within 60 seconds. They support 200+ brokers via per-broker templates and explicitly recruit users to send sample contract notes for new-broker support.

Sources:
- [Sharesight email-import](https://www.sharesight.com/blog/automatically-import-trades-to-your-sharesight-portfolio-using-email/)
- [Sharesight contract notes inbox](https://help.sharesight.com/viewing-the-contract-notes-inbox/)

### Permission models

- **Forward-only** (Sharesight model): zero OAuth, low risk, user-controlled. Friction: user must remember to set up forwarding; broker-side CC fields often don't exist in Thailand.
- **Gmail OAuth read** (`gmail.readonly` or narrower `gmail.metadata` + label filters): low friction once granted, but Google's "restricted scope" review is brutal — needs CASA Tier 2/3 security assessment, ~$15-75K USD and 6-12 weeks. **Not recommended for v0/v1.**
- **Native mailbox app sidecar** (least common): iOS Mail rule that auto-forwards. iOS doesn't expose this without MDM; not viable.

### Viability

- **Realistic** for traditional SET brokers (BLS, KSS, Phillip, RHB, Yuanta, Maybank, KSecurities, AIRA) where daily contract note is delivered by email.
- **Less reliable** for mobile-first brokers (Dime, Liberator, Webull TH) where in-app receipt is canonical and email may only carry monthly statements.
- **Not relevant** for Bitkub — use the API.

---

## Crypto-specific ingestion — easiest path on the roadmap

### Bitkub

- **Public REST API with user-issued keys**: full retail access. Permissions scoped (Account / Trade / Withdraw / Deposit). For our use, request **Account-only keys** — read balance, wallet addresses, order history.
- Documentation: [bitkub/bitkub-official-api-docs](https://github.com/bitkub/bitkub-official-api-docs/blob/master/restful-api.md). SDKs in Python, Go.
- Endpoints: `/api/v3/market/wallet` (balances), `/api/v3/market/my-order-history`, `/api/v3/market/my-trade-history`.
- UX: same API-key-paste flow as Settrade Open API. Educate users to *uncheck Trade and Withdraw*.

### Other Thai crypto exchanges

- **Binance TH** (JV with Gulf Energy): Binance API model, retail keys with read-only scopes.
- **Bitazza:** REST API, less documented; CSV export reliable.
- **Zipmex:** troubled / partially defunct; CSV export only.

### On-chain / wallet ingestion

- **Public address tracking:** works for any EVM chain (Ethereum, BSC, Polygon, Arbitrum) and Bitcoin via xpub/zpub. CoinTracker is the canonical reference.
- **xpub/zpub** for Bitcoin-family — generates many addresses; widely supported by hardware wallets. Never request seed phrase.
- **Privacy:** purely public-data, no PDPA exposure beyond storing the address linked to the user.

**Recommendation: build crypto first.** Lowest-risk, highest-completeness ingestion on the entire roadmap. Also signals to Thai users that the dashboard is holistic.

---

## Manual entry UX — best practices

Patterns that work across Sharesight, Snowball, GetQuin, Stock Events, Kubera, Capitally, Delta:

**Reduce friction:**
- Ticker autocomplete with company names + logos (use SET symbol list + Thai/EN names)
- Prefilled current price; let user override for historical fills
- "Add another lot" inline rather than form-reset
- Bulk paste from clipboard / spreadsheet
- Smart defaults: lot size (Thai stocks 100-share board default), per-broker fee % (set once per profile)
- Recently traded quick-pick

**Corporate actions handled for the user:**
- Auto-applied splits and bonus shares from market-data feed (Sharesight goes back 20 years). **Critical** — manual handling of Thai stock splits / XB / XR is the #1 reason DIY trackers go stale.
- Auto-detected dividends with confirm-tap (Sharesight surfaces pending dividend with orange dot; user taps once)
- Don't try to be too clever on cost basis — default FIFO with single switch to avg-cost in settings

**Multi-currency:**
- Auto FX-convert at trade-date rate; store both native and home currency. Critical for US/HK/CN exposure via Dime, Liberator, Pi.
- Show both "in THB" and "in USD" toggles

**Lot tracking:**
- Track per-lot for tax reporting; collapse to per-symbol for portfolio view. Thai PIT on Thai-listed-equity capital gains is currently exempt for individuals; mutual-fund/foreign-equity treatment is more complex — keep lots intact.

**NLP / voice — emerging differentiator:**
- No major tracker has shipped voice yet.
- LLM-powered "type what you did" (e.g., `"bought 500 PTT at 38.50 today via Pi"`) is feasible with current models. Prefill the manual form rather than committing directly — keeps user-in-the-loop, avoids mis-entry liability.
- "Photo of a paper slip → autofill" — same model as transaction-slip OCR pipeline, surfaced as a "scan slip" entry method.

**Pitfalls observed in competitor reviews:**
- Forcing manual dividend entry kills retention (Stock Events historically; mostly fixed)
- Over-elaborate fee modeling (commission + clearing + VAT + SET fee + TFEX fee on derivatives) confuses users — start with single "fees" field
- Hiding cash balance — Thai retail keeps meaningful cash they want to see

---

## PDPA constraints

Thailand's PDPA classifies financial data as **sensitive personal data** under section 26 (same tier as health and biometric). Consequences:

- **Explicit, granular, written/electronic consent** specifically for processing financial data, separate from generic ToS click-through
- Consent must be **revocable** at any time, with deletion downstream
- **First major fines** issued August 2025 (~21.5M THB total). Grace period over.
- If we store the raw PDF (not just extracted fields), the PDF itself is sensitive data — KMS encryption at rest, audit logs, retention policy, breach notification within 72 hours
- **Cross-border transfer** (e.g., sending PDF to OpenAI/Anthropic in US for vision parsing) requires data-subject consent *or* adequacy decision *or* binding corporate rules. Simplest path: explicit consent in onboarding — *"We send your trade confirmations to [provider] in [country] for parsing. You can opt out by entering trades manually."*
- Practical implication: prefer **on-device parsing** (Apple Vision/MLKit OCR + small on-device LLM) where feasible, or **self-hosted PaddleOCR-VL in Singapore/Thailand region** to minimize cross-border exposure

Sources:
- [Thailand PDPA — DLA Piper](https://www.dlapiperdataprotection.com/index.html?t=law&c=TH)
- [Thailand PDPA 2026 guide — Cookie Information](https://cookieinformation.com/blog/what-is-the-thailand-pdpa/)
- [Thailand PDPA — Norton Rose Fulbright](https://www.nortonrosefulbright.com/en/knowledge/publications/e29d223d/overview-of-thailand-personal-data-protection-act-be2562-2019)

---

## Recommended phased ingestion path (opinionated)

### Constraints worth naming

1. Small team. Each ingestion path has a long tail of edge cases.
2. PDPA makes financial-data handling non-trivial. Minimize what we store; prefer on-device.
3. We don't control any broker — every integration is at the broker's mercy.
4. "Your Data" rails land in 2027–28 and obsolete most workarounds for SET brokers. Don't over-invest in plumbing that becomes a relic.
5. Thai retail investors hold a mix: SET stocks (often across 2+ brokers), US stocks via Dime/Webull/Liberator, crypto on Bitkub, mutual funds via banks. A v0 that handles only one is not useful enough to retain.

### Phase 1 (months 0–3) — Manual + Bitkub + on-chain

- Polished manual entry. Symbol search with SET + US universes, Thai + EN names. Per-broker fee defaults. Auto-corporate-actions from a market-data feed (SET official feeds; for US, polygon.io or alpha-vantage).
- Bitkub API connection (read-only key flow with guided wizard).
- On-chain wallet address tracking (free — leverages public node APIs).
- **Why:** ships fast, validates positioning and UX, near-zero PDPA surface, gives crypto-heavy users a real reason to use us.

### Phase 2 (months 3–5) — Smart manual entry

- "Type what you did" NLP entry → prefills manual form. Cheap with prompt + structured-output LLM call.
- "Snap a slip" — photo of any broker confirmation, parsed by Claude/Gemini vision into prefilled entry. Same UX, different input modality. Low PDPA surface (user explicitly invokes per-trade).
- Bulk CSV import for users migrating from spreadsheets or competitor trackers.

### Phase 3 (months 5–9) — Email-forwarded daily contract notes

- Sharesight model: each user gets unique forwarding address. They forward the daily E-Document email from their broker. We parse the structured PDF.
- Start with the 3 brokers our beta cohort actually uses. Expand demand-driven.
- Build the "this didn't parse, please confirm" review queue UX from day one.
- PDPA: add explicit consent for cross-border parsing (or self-host PaddleOCR-VL in-region).

### Phase 4 (months 9–12) — Settrade Open API connector

- Guided wizard for users to generate broker API keys and paste them.
- Most reliable, repeatable SET data path until "Your Data" lands.
- Differentiator vs. anyone else in the market.

### Phase 5 (2027) — "Your Data" Phase-2 connector

- First-mover advantage on SEC-led data-sharing framework. Engage with industry working group in late 2026.
- Eventually retire forwarded-email and Settrade-key flows for brokers covered by Your Data.

### What we should NOT build in year one

- **Gmail OAuth integration:** high CASA cert overhead; forwarding works.
- **Thai SMS parsing:** Thai brokers don't reliably send trade detail by SMS — only login OTPs and balance alerts.
- **Direct screen-scraping of broker portals:** legally fraught, breaks constantly, no user-trust upside.
- **Per-broker custom OCR templates** (à la Sharesight) for >5 brokers early on: it's a treadmill. Lean on multimodal LLMs for the long tail.

### One-sentence positioning

> Manual entry as the ground floor, with progressively heavier ingestion lifted by AI (slip OCR, NLP entry) and crypto-API connectors early; broker-PDF-by-email and Settrade Open API mid; Your Data rails late.

---

## Open verification items (worth small experiments by Put)

- Dime's exact email/PDF behavior post-trade — open an account, place a 100-baht trade, observe what arrives
- Liberator's E-Document specifics — same drill
- Webull TH PDF format
- Settrade Open API exact endpoint shape and rate limits — `developer.settrade.com` + GitHub SDK, 30 minutes of poking
- Whether brokers consider use of Settrade Open API by an aggregator (vs. by the user themselves) a ToS violation — legal read of each broker's API terms
- PDPC's exact stance on aggregator services — they legitimize aggregators by name in Project Your Data, but no aggregator-licensing framework yet
