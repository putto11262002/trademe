export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

export const thb = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
})

export const qty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 })

export const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
