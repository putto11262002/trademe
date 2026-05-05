# Regulatory framing — Thai SEC, AI rules, info vs. advice

> Branched from [IDEA.md](IDEA.md). Maps Thai SEC rules around investment information vs. advice, robo-advisory licensing, AI guidance, and cross-border (US stock) considerations. Last updated 2026-05-01.
>
> **This is product-design input, not legal advice.** Before launch, retain a Thai securities lawyer (Tilleke & Gibbins, Baker McKenzie Bangkok, Weerawong C&P, or Chandler MHM) for a written opinion on specific product copy and notification flows.

---

## TL;DR

- **The line between information and advice is substance-over-form.** "X dropped 5% on news Y, in your portfolio" = information. "Consider selling X" = advice (regulated).
- **Thai SEC has no separate robo-advisor licence.** Robo-advisors operate under existing securities-business categories (Cat A/C/E investment advisory, or private fund management).
- **Two new AI rulebooks in 2025:**
  - **SEC AI/ML Governance Framework for Capital Markets** — fairness, legal/ethical, accountability, transparency
  - **BoT AI Risk Management Guidelines** (Sept 2025) — RAG, hallucination controls, eval metrics, explainability, AI-use disclosure
- **Disclaimers don't buy you out of licensing.** They protect you only when the underlying activity is genuinely informational.
- **Sept 2024 SEC guidelines for foreign operators** make US-stock coverage cleaner — exemption when assisting Thai investors via locally-licensed intermediaries.

---

## 1. The information-vs-advice line

### Statutory basis

The Securities and Exchange Act B.E. 2535 defines an "investment advisory service" as **giving advice to the public, directly or indirectly, about the value of securities or the suitability of investing in those securities, and about the purchase or sale of any securities, for a fee or other remuneration**. Carrying it on without a licence breaches the Act. ([Bangkok Post — Regulation of investment advisers in Thailand](https://www.bangkokpost.com/business/general/330278/regulation-of-investment-advisers-in-thailand))

Three elements to test:
1. **Is it advice or just information?** Pure facts (price, news, financials, translations) ≠ advice. Advice = opinion about *value*, *suitability*, or *buy/sell*.
2. **To the public?** A public app counts.
3. **For a fee or remuneration?** Free content is harder to label, but if it's a lead magnet for a paid product or fund-distribution commissions, regulators look through.

### Applied to Put's product

| Notification | Status | Reason |
|---|---|---|
| "X stock dropped 5% on news Y, this is in your portfolio." | **Information** | Price + news + personalisation filter. Like any broker alert. |
| "Consider selling X." | **Advice (regulated)** | Recommendation about suitability. Softening to "you might want to consider…" doesn't save you — substance over form. |
| "X dropped 5%; analysts at [licensed firm] cut their target." | **Information** if faithfully attributed | But AI synthesis of multiple analyst views starts to look derivative-advisory. |

Treat **any AI-generated qualitative summary that implies a buy/sell/hold posture as advisory**.

There's also a separate licence for **Investment Analyst (นักวิเคราะห์การลงทุน, IA)** — the people who write Buy/Sell ratings with target prices. If your AI is the *de facto* analyst, this lens applies too. ([SEC Investment Analyst code](https://publish.sec.or.th/nrs/7901s.pdf))

---

## 2. Robo-advisory licensing

No standalone robo-advisor licence in Thailand. Robo-advisors operate under existing categories:

- **Robo-advisor as fund broker / fund recommender** — Robowealth (first Thai robo-advisor, licensed July 2017), Finnomena. Algorithm recommends fund allocations under licensed mutual-fund brokerage. ([Hubbis — Robowealth](https://www.hubbis.com/article/robo-advisor-robowealth-sending-waves-of-disruption-through-thailand-s-growing-wealth-market))
- **Robo-advisor as private-fund manager** — Jitta Wealth, holds private fund management licence **No. ลค-0105-01**. Algorithmic discretionary portfolios. ([Jitta Wealth — About](https://jittawealth.com/about/))

### 2024-2026 changes

- **18 Sep 2024** — SEC issued first official guidelines for foreign operators providing investment services to Thai investors. Created exemptions / light-touch routes including foreign operators **assisting Thai investors in offshore investments through locally licensed intermediaries**. Fast-track licensing for qualifying foreign firms. ([SEC EN PDF](https://www.sec.or.th/EN/Template3/SECStatement/2024/SECstatementEN-180924.pdf), [Baker McKenzie](https://insightplus.bakermckenzie.com/bm/capital-markets/thailand-the-secs-first-official-guidelines-for-foreign-business-operators-providing-investment-services-to-thai-investors))
- **10 Jun 2025** — Cabinet approved draft amendment to introduce electronic securities.
- **16 Jan 2025** — SEC permitted mutual and private funds to invest in digital assets under specified criteria.
- **SEC's Five Steps Toward Investment Confidence** project explicitly supports **AI deployed *by* a licensed operator** — not as a substitute for one. ([ICLG Fintech Laws Thailand 2025-26](https://iclg.com/practice-areas/fintech-laws-and-regulations/thailand))

**Takeaway:** if the dashboard ever surfaces personalised allocations, target weights, or "rebalance now" recommendations, it is a robo-advisor → needs a licensed entity (own or partner).

---

## 3. AI-specific rules

Three overlapping pieces of 2025 guidance:

### A. SEC AI/ML Governance Framework for Capital Markets

Principle-based. Covers: securities and derivatives firms, asset managers, fund managers, investment advisers and consultants (**explicitly including robo-advisory providers**), derivatives intermediaries.

Four core principles: **fairness, legal & ethical compliance, accountability, transparency.**

Expectations: board-level engagement, dedicated committees with AI expertise, full documentation of data provenance, model development, and testing. Currently best-practice; expected to harden into binding rules. ([Tilleke summary on Lexology](https://www.lexology.com/library/detail.aspx?g=140a00bc-f748-4e47-9e56-a8c46dd55b0a))

### B. BoT AI Risk Management Guidelines for Financial Service Providers

Released **12 September 2025**. Targets financial institutions, special financial institutions, payment providers.

Two pillars: governance + AI development/security controls.

Specific to **generative AI**:
- Adopt **retrieval-augmented generation and prompt engineering to reduce hallucination**
- Set **clear evaluation metrics for accuracy and reliability**
- **Ongoing testing before and after deployment**
- Ensure **explainability of AI outcomes**

Consumer-protection requirements:
- **Disclose material AI use** to affected customers
- **Provide mechanisms for human review or opt-out** where decisions materially affect customers

([Lexology](https://www.lexology.com/library/detail.aspx?g=844d40a6-063c-4661-ab40-9a35c4864b16), [US-ASEAN Business Council](https://www.usasean.org/article/thailand-issues-new-ai-guidance-financial-services))

### C. National AI advertising guidelines

Apply to AI-generated marketing copy more broadly. Relevant if the app's AI generates anything resembling marketing.

### No formal AI sandbox for capital markets

Closest is the principle-based framework above. (There IS a digital-asset regulatory sandbox launched in 2025, but it's separate.)

---

## 4. What disclaimers / framing keep you on the "info" side

Looking at what licensed-but-information-heavy operators do:

- **Finnomena** — content disclaims "does not constitute a prospectus or investment presentation and also does not constitute legal, business, or any kind of financial advice." Notably Finnomena ALSO holds a fund-brokerage licence — disclaimer is belt-and-braces, not the sole basis. ([FINT by Finnomena disclaimer](https://docs.fint.finance/fint-token/disclaimer))
- **Jitta Wealth** — standard regulator-mandated risk language: **"ผลการดำเนินงานในอดีตของกองทุน มิได้เป็นสิ่งยืนยันถึงผลการดำเนินงานในอนาคต"** (past performance is not indicative of future performance) + study product features/returns/risks before investing.

**Disclaimer alone does NOT buy you out of licensing.** Substance-over-form. If you act like an advisor, a footer doesn't save you.

### Practical "stay-on-info" checklist

- **Source attribution.** Every fact, number, news item, analyst quote attributed to original source.
- **No buy/sell/hold ratings.** No model-generated price targets, scores that act as proxies for ratings, or "looks attractive" language.
- **Personalisation = filter, not recommendation.** "These news items mention stocks in your portfolio" = filtering. "Based on your portfolio, we suggest reducing X" = advice.
- **No suitability inference.** Don't collect risk-tolerance and act on it; that's the suitability assessment that triggers advisor obligations.
- **AI-content labelling.** Anything written by the LLM is labelled with hallucination caveat + source links.
- **Educational framing.** Help users understand markets and their holdings; don't tell them what to do.
- **Standard Thai disclaimer pack** — "ข้อมูลเพื่อการศึกษา / เพื่อประกอบการตัดสินใจ" (informational/decision-support), "การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจลงทุน" (investing involves risk; study before deciding), and the past-performance line. Lawyer review recommended.

---

## 5. Cross-border (US stocks)

Two distinct issues.

### A. Does covering US stocks pull in US SEC obligations?

**No** — as long as the product is informational and not soliciting US persons. Reporting on Apple's earnings to Thai users is no more US-regulated than Bangkok Post writing about Apple. Becomes US-regulated if the product facilitates trades or holds US-person clients.

### B. Does covering offshore securities pull in extra Thai SEC obligations?

The **18 Sep 2024 SEC guidelines** are the relevant frame. The exemption is direct:

> "Foreign operators … assisting Thai investors in offshore investments through locally licensed intermediaries are exempt from licensing."

Read in reverse: a Thai-domiciled product that helps Thai investors invest offshore via a partner (like Dime, which routes through a locally licensed intermediary structure to US markets) is the standard architecture the SEC now explicitly accommodates. A pure information overlay sits even further from the regulated perimeter.

### 2025 helpful changes

- **6 May 2025** — SET allows depositary receipts with underlying European/US stocks/indices to trade in a night session (7 PM – 3 AM).
- The same Sep 2024 statement contemplates foreign operators offering investment advice into Thailand under "qualified actions/protocols."

### Watch-outs

- **Don't be the offshore broker.** Stay an information layer.
- **Marketing collateral counts as soliciting** — promotional materials that effectively market specific securities to Thai retail are caught by SEC marketing rules.
- **Tax-information rules are separate.** Surfacing Thai personal-income-tax treatment of overseas capital gains is informational and not licensed, but don't slip into personalised tax advice.

---

## Practical takeaways for product design

### Free zone (no licence, with standard disclaimers)

- Display market data, fundamentals, news, regulatory filings
- Translate / summarise news with AI labels and source links
- Personalise *which* information surfaces based on holdings (filter, not recommend)
- Push notifications about price moves, news, earnings, dividends in their portfolio — written as facts, not calls to action
- Educational explainers (general, not personalised)
- Cover Thai SET + US-listed equities at the information layer

### Yellow zone (with explicit disclosure / care; legal review needed)

- AI-generated qualitative summaries of issuer news → label as AI, attribute sources, no buy/sell/hold language, hallucination controls
- Showing third-party licensed-analyst ratings → faithful republication with attribution; no AI re-interpretation
- "What does this mean for me?" copy → keep educational, not prescriptive
- Risk-tolerance questionnaires → only with a licensed-advisor partner

### Red zone (need licence or licensed partner)

- Recommend specific securities to buy/sell/hold (Cat A/C/E investment advisory)
- Recommend portfolio allocations or rebalancing (robo-advisory under existing categories — partner with Robowealth/Finnomena/Jitta or get licensed)
- Take orders or hold client assets (broker-dealer / custodian licences)
- Manage discretionary portfolios (private fund management licence, like Jitta's ลค-0105-01)
- Solicit specific securities to Thai retail in promotional materials

### Hard requirements to plan for now (even in v1)

- Adopt SEC's four AI principles (fairness, legal/ethical, accountability, transparency) as your AI baseline
- Adopt BoT's hallucination/RAG/eval/explainability/disclosure expectations
- Build AI-content labelling, source attribution, "show your work" affordances from day one
- Keep a model card / documentation trail per the SEC AI/ML framework
- Design notification copy templates that are factually-framed by default and reject "consider…/should…" patterns at the prompt level

### Before launch

1. Engage a Thai securities lawyer for a written opinion on notification copy patterns and the AI-summarisation feature
2. Talk to Thai SEC directly via fintech contact (Five Steps Toward Investment Confidence project)
3. Decide: pure-information product or licensed/partner advisory? Former is faster to ship; latter unlocks much higher willingness-to-pay.
