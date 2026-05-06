import { eq, ilike, or, sql } from "drizzle-orm"
import { getDb } from "@/db/index.server"
import { marketCompanyProfile } from "@/db/schema"
import { MarketNotFoundError } from "../errors"
import { finnhub } from "../vendors/finnhub.server"
import type { CompanyProfile } from "../types"

type ProfileRow = typeof marketCompanyProfile.$inferSelect

function toProfile(row: ProfileRow): CompanyProfile {
  return {
    ticker: row.ticker,
    name: row.name,
    exchange: row.exchange,
    sector: row.sector ?? undefined,
    industry: row.industry ?? undefined,
    country: row.country ?? undefined,
    currency: row.currency ?? undefined,
    ipoDate: row.ipoDate ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    website: row.website ?? undefined,
    description: row.description ?? undefined,
    lastRefreshedAt: row.lastRefreshedAt ?? undefined,
  }
}

function toRow(p: CompanyProfile): typeof marketCompanyProfile.$inferInsert {
  return {
    ticker: p.ticker,
    name: p.name,
    exchange: p.exchange,
    sector: p.sector ?? null,
    industry: p.industry ?? null,
    country: p.country ?? null,
    currency: p.currency ?? null,
    ipoDate: p.ipoDate ?? null,
    logoUrl: p.logoUrl ?? null,
    website: p.website ?? null,
    description: p.description ?? null,
    lastRefreshedAt: p.lastRefreshedAt ?? null,
  }
}

async function readProfile(symbol: string): Promise<CompanyProfile | null> {
  const [row] = await getDb()
    .select()
    .from(marketCompanyProfile)
    .where(eq(marketCompanyProfile.ticker, symbol))
    .limit(1)
  return row ? toProfile(row) : null
}

/**
 * DB-only read. Profiles are populated by the seed script and by
 * ensureCompanyProfile on the trade-create path. Throws if missing — callers
 * that may face an unseeded ticker should call ensureCompanyProfile first.
 */
export async function getCompanyProfile(ticker: string): Promise<CompanyProfile> {
  const symbol = ticker.toUpperCase()
  const profile = await readProfile(symbol)
  if (!profile) throw new MarketNotFoundError(`profile for ${symbol}`)
  return profile
}

/**
 * Returns the existing profile if present, otherwise fetches from Finnhub
 * and inserts. Used at trade-create time so the FK on trade.ticker is
 * satisfied for tickers outside the seeded set.
 */
export async function ensureCompanyProfile(
  ticker: string,
): Promise<CompanyProfile> {
  const symbol = ticker.toUpperCase()
  const existing = await readProfile(symbol)
  if (existing) return existing

  const fresh = await finnhub.fetchCompanyProfile(symbol)
  const withRefresh: CompanyProfile = { ...fresh, lastRefreshedAt: new Date() }
  await getDb()
    .insert(marketCompanyProfile)
    .values(toRow(withRefresh))
    .onConflictDoNothing()
  return withRefresh
}

/**
 * Prefix-match search over ticker and name. Used by the trade-form
 * typeahead. DB-only — never hits Finnhub. Empty query returns the first
 * `limit` rows alphabetically as a default browsing affordance.
 */
export async function searchCompanyProfiles(
  query: string,
  limit = 20,
  offset = 0,
): Promise<Array<CompanyProfile>> {
  const q = query.trim()
  const db = getDb()
  const rows = await (q.length === 0
    ? db
        .select()
        .from(marketCompanyProfile)
        .orderBy(marketCompanyProfile.ticker)
        .limit(limit)
        .offset(offset)
    : db
        .select()
        .from(marketCompanyProfile)
        .where(
          or(
            ilike(marketCompanyProfile.ticker, `${q}%`),
            ilike(marketCompanyProfile.name, `${q}%`),
          ),
        )
        .orderBy(
          sql`case when ${marketCompanyProfile.ticker} ilike ${q + "%"} then 0 else 1 end`,
          marketCompanyProfile.ticker,
        )
        .limit(limit)
        .offset(offset))
  return rows.map(toProfile)
}

/**
 * Upsert used by the seed script. Fetches from Finnhub and writes the row,
 * refreshing lastRefreshedAt. Idempotent across re-runs.
 */
export async function refreshCompanyProfile(
  ticker: string,
): Promise<CompanyProfile> {
  const symbol = ticker.toUpperCase()
  const fresh = await finnhub.fetchCompanyProfile(symbol)
  const withRefresh: CompanyProfile = { ...fresh, lastRefreshedAt: new Date() }
  await getDb()
    .insert(marketCompanyProfile)
    .values(toRow(withRefresh))
    .onConflictDoUpdate({
      target: marketCompanyProfile.ticker,
      set: { ...toRow(withRefresh), updatedAt: new Date() },
    })
  return withRefresh
}
