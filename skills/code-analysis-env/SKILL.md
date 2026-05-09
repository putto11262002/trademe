---
name: code-analysis-env
description: Use for bounded Python analysis over stock, candle, portfolio, market, news, and fundamentals data.
---

# Code Analysis Environment

Use this skill when the user's stock, market, or portfolio question requires calculations that are awkward or lossy in normal text.

Inside `analysis_run_code`, generated Python runs in `/workspace` with:

```python
import trademe_sdk as trademe
```

The sandbox image installs `trademe_sdk`. The Worker writes `/workspace/run_analysis.py`, runs it, then reads `/workspace/output.json`.

The SDK fetches portfolio and market data over authenticated sandbox API calls. Fetch only the data needed for the calculation.

Good use cases:
- candle analysis
- returns
- volatility
- drawdown
- moving averages
- portfolio concentration
- multi-ticker numerical comparison

Available Python libraries:
- Python standard library
- numpy
- pandas
- scipy
- statsmodels
- scikit-learn

Rules:
- Only use code execution for stock, market, portfolio, or investment-analysis tasks.
- Fetch only the data needed for the question through the SDK.
- Do not inspect long candle arrays in text. Load them in code and compute compact metrics.
- Generated Python must import trademe_sdk as trademe.
- Read references/sdk.md before writing non-trivial Python against the SDK.
- Generated Python must finish by calling trademe.output.write(summary, result).
- The summary must be one short sentence describing what the code did for the tool UI.
- The result must be JSON-serializable and compact. Do not return raw candles, large tables, or verbose logs.
- If data is missing, return a compact result with dataGaps rather than inventing values.
- Unexpected HTTP/API failures should fail normally so the tool can surface the error.
- Use trademe.output.fail(summary, details) only for expected data limitations.

Reference files:
- references/sdk.md: SDK API signatures, return shapes, and method behavior.

Prefer direct deterministic tools when they answer the question without custom computation.
