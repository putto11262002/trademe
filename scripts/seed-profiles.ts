/**
 * Seed marketCompanyProfile from Finnhub. Run from your laptop:
 *   pnpm seed:profiles                # all S&P 500 constituents
 *   pnpm seed:profiles --limit 30     # first N from the alphabetical list
 *
 * Reads DATABASE_URL and FINNHUB_API_KEY from .dev.vars (loaded via Node
 * --env-file in package.json). Pulls the current S&P 500 constituents from
 * a public dataset, then upserts each profile from Finnhub. Idempotent —
 * re-runs refresh stale rows.
 */
import { parseArgs } from "node:util"
import { refreshCompanyProfile } from "@/market/services/company.server"

const SP500_CSV_URL =
  "https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv"

const RATE_LIMIT_PER_MIN = 50
const DELAY_MS = Math.ceil(60_000 / RATE_LIMIT_PER_MIN)

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

async function fetchSP500Symbols(): Promise<Array<string>> {
  const res = await fetch(SP500_CSV_URL)
  if (!res.ok) throw new Error(`SP500 CSV fetch failed: HTTP ${res.status}`)
  const csv = await res.text()
  const lines = csv.split(/\r?\n/).filter((l) => l.length > 0)
  // Skip header row
  const symbols: Array<string> = []
  for (let i = 1; i < lines.length; i++) {
    const [symbol] = lines[i].split(",")
    if (symbol && /^[A-Z.\-]+$/.test(symbol)) {
      // Finnhub uses dash for share classes (e.g. BRK.B -> BRK-B in some lists);
      // normalize dots to dashes which is Finnhub's convention.
      symbols.push(symbol.replace(/\./g, "-"))
    }
  }
  return symbols
}

function parseLimit(): number | undefined {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { limit: { type: "string" } },
    strict: true,
  })
  if (values.limit === undefined) return undefined
  const n = Number(values.limit)
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`--limit must be a positive integer, got: ${values.limit}`)
  }
  return n
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set")
  if (!process.env.FINNHUB_API_KEY) throw new Error("FINNHUB_API_KEY is not set")

  const limit = parseLimit()

  console.log("Fetching S&P 500 constituents from public dataset...")
  const all = await fetchSP500Symbols()
  const tickers = limit !== undefined ? all.slice(0, limit) : all
  console.log(
    limit !== undefined
      ? `Got ${all.length} tickers; limited to first ${tickers.length}. Upserting profiles...`
      : `Got ${tickers.length} tickers. Upserting profiles...`,
  )

  let ok = 0
  let failed = 0
  const failures: Array<{ ticker: string; error: string }> = []
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i]
    try {
      await refreshCompanyProfile(ticker)
      ok++
      if ((i + 1) % 25 === 0 || i === tickers.length - 1) {
        console.log(`[${i + 1}/${tickers.length}] ok=${ok} failed=${failed}`)
      }
    } catch (e) {
      failed++
      failures.push({
        ticker,
        error: e instanceof Error ? e.message : String(e),
      })
    }
    await sleep(DELAY_MS)
  }

  console.log(`\nDone. ok=${ok} failed=${failed}`)
  if (failures.length > 0) {
    console.log("\nFailures:")
    for (const f of failures) console.log(`  ${f.ticker}: ${f.error}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
