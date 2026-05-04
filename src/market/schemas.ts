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
