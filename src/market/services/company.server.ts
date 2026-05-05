import { eq } from "drizzle-orm"
import { kvCache } from "../cache/kv.server"
import { getDb } from "@/db/index.server"
import { marketCompanyProfile } from "@/db/schema"
import { finnhub } from "../vendors/finnhub.server"
import type { CompanyProfile } from "../types"

const TTL_SECONDS = 24 * 60 * 60

type ProfileRow = typeof marketCompanyProfile.$inferSelect

function toProfile(row: ProfileRow): CompanyProfile {
  return {
    ticker: row.ticker,
    name: row.name,
    exchange: row.exchange,
    sector: row.sector ?? undefined,
    industry: row.industry ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    website: row.website ?? undefined,
    description: row.description ?? undefined,
  }
}

function toRow(p: CompanyProfile): typeof marketCompanyProfile.$inferInsert {
  return {
    ticker: p.ticker,
    name: p.name,
    exchange: p.exchange,
    sector: p.sector ?? null,
    industry: p.industry ?? null,
    logoUrl: p.logoUrl ?? null,
    website: p.website ?? null,
    description: p.description ?? null,
  }
}

export async function getCompanyProfile(ticker: string): Promise<CompanyProfile> {
  const symbol = ticker.toUpperCase()
  const k = `profile:${symbol}`
  const cached = await kvCache.get<CompanyProfile>(k)
  if (cached) return cached.value

  const [stored] = await getDb()
    .select()
    .from(marketCompanyProfile)
    .where(eq(marketCompanyProfile.ticker, symbol))
    .limit(1)
  if (stored) {
    const profile = toProfile(stored)
    await kvCache.set(k, profile, TTL_SECONDS)
    return profile
  }

  const fresh = await finnhub.fetchCompanyProfile(symbol)
  await getDb()
    .insert(marketCompanyProfile)
    .values(toRow(fresh))
    .onConflictDoUpdate({
      target: marketCompanyProfile.ticker,
      set: { ...toRow(fresh), updatedAt: new Date() },
    })
  await kvCache.set(k, fresh, TTL_SECONDS)
  return fresh
}
