import { z } from "zod"

// Finnhub /quote — https://finnhub.io/docs/api/quote
export const finnhubQuoteSchema = z.object({
  c: z.number(), // current price
  d: z.number().nullable(), // change
  dp: z.number().nullable(), // change percent
  h: z.number(), // high of day
  l: z.number(), // low of day
  o: z.number(), // open of day
  pc: z.number(), // previous close
  t: z.number(), // unix seconds
})

export type FinnhubQuote = z.infer<typeof finnhubQuoteSchema>

// Frankfurter /latest — https://www.frankfurter.app/docs/
export const frankfurterLatestSchema = z.object({
  amount: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
})

export type FrankfurterLatest = z.infer<typeof frankfurterLatestSchema>

// Finnhub /company-news — https://finnhub.io/docs/api/company-news
export const finnhubNewsItemSchema = z.object({
  id: z.number(),
  category: z.string().optional(),
  datetime: z.number(),
  headline: z.string(),
  image: z.string().optional(),
  related: z.string().optional(),
  source: z.string(),
  summary: z.string().optional(),
  url: z.string(),
})

// Finnhub /stock/profile2 — https://finnhub.io/docs/api/company-profile2
export const finnhubProfileSchema = z.object({
  country: z.string().optional(),
  currency: z.string().optional(),
  exchange: z.string().optional(),
  finnhubIndustry: z.string().optional(),
  ipo: z.string().optional(),
  logo: z.string().optional(),
  marketCapitalization: z.number().optional(),
  name: z.string().optional(),
  shareOutstanding: z.number().optional(),
  ticker: z.string().optional(),
  weburl: z.string().optional(),
})

// Finnhub /stock/metric?metric=all — https://finnhub.io/docs/api/company-basic-financials
export const finnhubMetricSchema = z.object({
  metric: z
    .record(z.string(), z.union([z.number(), z.string(), z.null()]))
    .optional(),
})

// Finnhub /stock/price-target — https://finnhub.io/docs/api/price-target
export const finnhubPriceTargetSchema = z.object({
  symbol: z.string().optional(),
  targetHigh: z.number().nullable().optional(),
  targetLow: z.number().nullable().optional(),
  targetMean: z.number().nullable().optional(),
  targetMedian: z.number().nullable().optional(),
  numberOfAnalysts: z.number().nullable().optional(),
  lastUpdated: z.string().optional(),
})

// Finnhub /stock/recommendation — https://finnhub.io/docs/api/recommendation-trends
export const finnhubRecommendationSchema = z.array(
  z.object({
    symbol: z.string(),
    period: z.string(),
    buy: z.number(),
    hold: z.number(),
    sell: z.number(),
    strongBuy: z.number(),
    strongSell: z.number(),
  }),
)

// Finnhub /calendar/earnings — https://finnhub.io/docs/api/earnings-calendar
export const finnhubEarningsSchema = z.object({
  earningsCalendar: z
    .array(
      z.object({
        date: z.string(),
        epsActual: z.number().nullable().optional(),
        epsEstimate: z.number().nullable().optional(),
        hour: z.string().optional(),
        quarter: z.number().optional(),
        revenueActual: z.number().nullable().optional(),
        revenueEstimate: z.number().nullable().optional(),
        symbol: z.string(),
        year: z.number().optional(),
      }),
    )
    .nullable()
    .optional(),
})
