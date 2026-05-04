import { MarketUpstreamError } from "../errors"
import { frankfurterLatestSchema } from "../schemas"
import type { Currency, FXRate } from "../types"

const BASE_URL = "https://api.frankfurter.app"

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new MarketUpstreamError("frankfurter", `HTTP ${res.status}`, { status: res.status })
  }
  return (await res.json()) as T
}

export const frankfurter = {
  async fetchLatest(from: Currency, to: Currency): Promise<FXRate> {
    if (from === to) {
      return { from, to, rate: 1, asOf: new Date() }
    }
    const raw = await get<unknown>(`/latest?from=${from}&to=${to}`)
    const parsed = frankfurterLatestSchema.safeParse(raw)
    if (!parsed.success) {
      throw new MarketUpstreamError("frankfurter", "invalid /latest response", {
        cause: parsed.error,
      })
    }
    const rate = parsed.data.rates[to]
    if (rate == null) {
      throw new MarketUpstreamError("frankfurter", `no rate returned for ${from}->${to}`)
    }
    return {
      from,
      to,
      rate,
      asOf: new Date(parsed.data.date),
    }
  },
}
