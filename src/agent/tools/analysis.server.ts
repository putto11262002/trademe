import { getSandbox } from "@cloudflare/sandbox"
import { tool } from "ai"
import { env } from "cloudflare:workers"
import { z } from "zod"
import {
  getDailyBars,
  getFundamentals,
  getNews,
  getQuote,
} from "@/market/api.server"
import { getPortfolioDashboard } from "@/trade/portfolio.server"
import { PYTHON_ANALYSIS_SDK } from "./analysis-sdk.server"
import type { AnalysisSandbox } from "@/agent/runtime/analysis-sandbox.server"

const MAX_CANDLE_RANGE_DAYS = 730
const MAX_OUTPUT_BYTES = 64_000

const tickerSchema = z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9.-]+$/)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const datasetSchema = z.object({
  includePortfolio: z.boolean().default(false),
  tickers: z.array(tickerSchema).max(10).default([]),
  candles: z.object({
    from: dateSchema,
    to: dateSchema,
  }).optional(),
  includeQuotes: z.boolean().default(true),
  includeFundamentals: z.boolean().default(false),
  newsDays: z.number().int().positive().max(30).optional(),
})

const runAnalysisInput = z.object({
  task: z.string().min(1).max(1_000),
  code: z.string().min(1).max(12_000).describe(
    "Python code. It must import trademe_sdk as trademe, use its data accessors, and write output with trademe.output.write(summary, result).",
  ),
  dataset: datasetSchema.default({
    includePortfolio: false,
    tickers: [],
    includeQuotes: true,
    includeFundamentals: false,
  }),
})

type DatasetInput = z.infer<typeof datasetSchema>

const analysisOutputSchema = z.object({
  summary: z.string().trim().min(1).max(300),
  result: z.unknown(),
})

function logAnalysis(event: string, data: Record<string, unknown>) {
  console.info(JSON.stringify({
    event: `agent.analysis.${event}`,
    ...data,
  }))
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
}

function assertCandleRange(from: Date, to: Date): void {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid candle date")
  }
  if (from > to) throw new Error("Candle from date must be before to date")
  if (daysBetween(from, to) > MAX_CANDLE_RANGE_DAYS) {
    throw new Error(`Candle range cannot exceed ${MAX_CANDLE_RANGE_DAYS} days`)
  }
}

async function buildAnalysisDataset(input: DatasetInput) {
  const tickers = Array.from(
    new Set(input.tickers.map((ticker) => ticker.toUpperCase())),
  )

  const [portfolio, quotes, fundamentals, news, candles] = await Promise.all([
    input.includePortfolio ? getPortfolioDashboard() : Promise.resolve(null),
    input.includeQuotes
      ? Promise.all(tickers.map((ticker) => getQuote(ticker)))
      : Promise.resolve([]),
    input.includeFundamentals
      ? Promise.all(tickers.map((ticker) => getFundamentals(ticker)))
      : Promise.resolve([]),
    input.newsDays != null
      ? Promise.all(
          tickers.map(async (ticker) => ({
            ticker,
            articles: await getNews(ticker, { days: input.newsDays }),
          })),
        )
      : Promise.resolve([]),
    input.candles
      ? Promise.all(
          tickers.map(async (ticker) => {
            const from = parseDate(input.candles!.from)
            const to = parseDate(input.candles!.to)
            assertCandleRange(from, to)
            return {
              ticker,
              bars: await getDailyBars(ticker, { from, to }),
            }
          }),
        )
      : Promise.resolve([]),
  ])

  const marketByTicker: Record<string, {
    quote?: unknown
    fundamentals?: unknown
    candles?: unknown
  }> = Object.fromEntries(tickers.map((ticker) => [ticker, {}]))
  for (const quote of quotes) {
    marketByTicker[quote.ticker.toUpperCase()] ??= {}
    marketByTicker[quote.ticker.toUpperCase()].quote = quote
  }
  for (const item of fundamentals) {
    marketByTicker[item.ticker.toUpperCase()] ??= {}
    marketByTicker[item.ticker.toUpperCase()].fundamentals = item
  }
  for (const item of candles) {
    marketByTicker[item.ticker.toUpperCase()] ??= {}
    marketByTicker[item.ticker.toUpperCase()].candles = item.bars
  }

  return {
    run: {
      asOf: new Date().toISOString(),
    },
    data: {
      tickers,
      portfolio,
      market: marketByTicker,
      news: Object.fromEntries(
        news.map((item) => [item.ticker.toUpperCase(), item.articles]),
      ),
    },
  }
}

function parseAnalysisOutput(content: string): z.infer<typeof analysisOutputSchema> {
  if (content.length > MAX_OUTPUT_BYTES) {
    throw new Error(`Analysis output cannot exceed ${MAX_OUTPUT_BYTES} bytes`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("Analysis output must be valid JSON")
  }

  const result = analysisOutputSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data
}

function sandboxId(): string {
  return `analysis-${crypto.randomUUID()}`
}

export const analysisTools = {
  analysis_run_code: tool({
    description:
      "Run bounded Python analysis over portfolio and market data. Use for calculations over price history, technical indicators, drawdown, volatility, concentration, comparisons, and other numerical work. Python should import trademe_sdk as trademe and finish with trademe.output.write(summary, result). The summary must be one short sentence describing what was done. Do not use for trade execution or portfolio writes.",
    inputSchema: runAnalysisInput,
    execute: async ({ task, code, dataset }) => {
      const runId = crypto.randomUUID()
      const startedAt = Date.now()
      logAnalysis("start", {
        runId,
        task,
        tickers: dataset.tickers,
        includePortfolio: dataset.includePortfolio,
        includeQuotes: dataset.includeQuotes,
        includeFundamentals: dataset.includeFundamentals,
        newsDays: dataset.newsDays ?? null,
        candles: dataset.candles ?? null,
        codeLength: code.length,
      })

      const analysisDataset = await buildAnalysisDataset(dataset)
      logAnalysis("dataset_ready", {
        runId,
        tickers: analysisDataset.data.tickers,
        hasPortfolio: analysisDataset.data.portfolio != null,
        marketTickers: Object.keys(analysisDataset.data.market),
        newsTickers: Object.keys(analysisDataset.data.news),
      })

      const sandbox = getSandbox<AnalysisSandbox>(
        env.ANALYSIS_SANDBOX,
        sandboxId(),
        { keepAlive: false },
      )

      await Promise.all([
        sandbox.writeFile("/workspace/input.json", JSON.stringify({
          run: {
            task,
            asOf: analysisDataset.run.asOf,
          },
          data: analysisDataset.data,
        })),
        sandbox.writeFile("/workspace/trademe_sdk.py", PYTHON_ANALYSIS_SDK),
        sandbox.writeFile("/workspace/run_analysis.py", code),
      ])
      logAnalysis("files_written", { runId })

      const result = await sandbox.exec("python3 /workspace/run_analysis.py", {
        cwd: "/workspace",
        timeout: 15_000,
        env: {
          PYTHONPATH: "/workspace",
        },
      })
      logAnalysis("exec_finished", {
        runId,
        success: result.success,
        exitCode: result.exitCode,
        durationMs: result.duration,
        stdoutBytes: result.stdout.length,
        stderrBytes: result.stderr.length,
      })

      if (!result.success) {
        const error = result.stderr.trim() || result.stdout.trim() || "Python execution failed"
        logAnalysis("failed", {
          runId,
          phase: "exec",
          durationMs: Date.now() - startedAt,
          error: error.slice(0, 1_000),
        })
        return {
          success: false,
          phase: "exec",
          summary: "Python execution failed.",
          error,
          exitCode: result.exitCode,
          stdout: result.stdout.slice(0, 4_000),
          stderr: result.stderr.slice(0, 4_000),
        }
      }

      let parsed: z.infer<typeof analysisOutputSchema>
      try {
        const output = await sandbox.readFile("/workspace/output.json")
        parsed = parseAnalysisOutput(output.content)
        logAnalysis("output_valid", {
          runId,
          outputBytes: output.content.length,
          summary: parsed.summary,
        })
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        logAnalysis("failed", {
          runId,
          phase: "output",
          durationMs: Date.now() - startedAt,
          error: error.slice(0, 1_000),
        })
        return {
          success: false,
          phase: "output",
          summary: "Analysis ran, but the output was invalid.",
          exitCode: result.exitCode,
          stdout: result.stdout.slice(0, 2_000),
          stderr: result.stderr.slice(0, 2_000),
          error,
        }
      }

      logAnalysis("finish", {
        runId,
        durationMs: Date.now() - startedAt,
        execDurationMs: result.duration,
      })
      return {
        success: true,
        runId,
        durationMs: result.duration,
        summary: parsed.summary,
        result: parsed.result,
        stdout: result.stdout.slice(0, 2_000),
        stderr: result.stderr.slice(0, 2_000),
      }
    },
  }),
}
