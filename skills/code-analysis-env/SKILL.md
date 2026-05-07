---
name: code-analysis-env
description: Use for bounded Python analysis over stock, candle, portfolio, market, news, and fundamentals data.
---

# Code Analysis Environment

Use this skill when the user's stock, market, or portfolio question requires calculations that are awkward or lossy in normal text.

Good use cases:
- candle analysis
- returns
- volatility
- drawdown
- moving averages
- portfolio concentration
- multi-ticker numerical comparison

Rules:
- Only use code execution for stock, market, portfolio, or investment-analysis tasks.
- Request only the dataset needed for the question.
- Do not inspect long candle arrays in text. Load them in code and compute compact metrics.
- Generated Python must import trademe_sdk as trademe.
- Read references/sdk.md before writing non-trivial Python against the SDK.
- Generated Python must finish by calling trademe.output.write(summary, result).
- The summary must be one short sentence describing what the code did for the tool UI.
- The result must be JSON-serializable and compact. Do not return raw candles, large tables, or verbose logs.
- If data is missing, return a compact result with dataGaps rather than inventing values.

Available Python libraries:
- Python standard library
- numpy
- pandas
- scipy
- statsmodels
- scikit-learn

Reference files:
- references/sdk.md: Python SDK surface available inside analysis_run_code.

Prefer direct deterministic tools when they answer the question without custom computation.
