// Compact USD ($1.2B / $3.4M) and plain USD/qty/pct formatters reused
// across the position-detail page. The /portfolio/format helpers are stricter
// (always 2 decimals) so we layer on top with our own compact helpers here.

export const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

export const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 })

export const pct = (v: number, digits = 2) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`

export function compactUSD(n: number): string {
  if (Math.abs(n) >= 1_000_000_000_000)
    return `$${(n / 1_000_000_000_000).toFixed(2)}T`
  if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(2)}K`
  return usd2.format(n)
}

/** Finnhub returns marketCap in USD-millions */
export function compactMarketCapMillions(n: number): string {
  return compactUSD(n * 1_000_000)
}

export const dash = "—"

export function fmt<T>(v: T | undefined | null, fn: (x: T) => string): string {
  return v == null ? dash : fn(v)
}
