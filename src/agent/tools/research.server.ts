import { tool } from "ai"
import { Readability } from "@mozilla/readability"
import { parseHTML } from "linkedom"
import { z } from "zod"

const TAVILY_SEARCH_ENDPOINT = "https://api.tavily.com/search"
const DEFAULT_SEARCH_RESULTS = 5
const MAX_SEARCH_RESULTS = 10
const DEFAULT_PAGE_CHARS = 12_000
const MAX_PAGE_CHARS = 20_000
const PAGE_FETCH_TIMEOUT_MS = 12_000

const blockedHostPatterns = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
  /^169\.254\./,
  /^\[?::1\]?$/i,
  /\.local$/i,
]

const searchInput = z.object({
  query: z.string().trim().min(3).max(300).describe("Web search query"),
  recencyDays: z.number().int().positive().max(366).optional().describe("Optional recency filter in days"),
  domains: z.array(z.string().trim().min(1).max(120)).max(5).optional().describe("Optional domains to restrict search to"),
  maxResults: z.number().int().positive().max(MAX_SEARCH_RESULTS).default(DEFAULT_SEARCH_RESULTS).describe("Maximum results to return"),
})

const readPageInput = z.object({
  url: z.string().trim().url().max(2_000).describe("HTTP or HTTPS URL to read"),
  maxChars: z.number().int().positive().max(MAX_PAGE_CHARS).default(DEFAULT_PAGE_CHARS).describe("Maximum readable text characters to return"),
})

type ResearchCitationRegistry = {
  citationForUrl: (url: string) => number
}

type TavilyResult = {
  title?: string
  url?: string
  content?: string
  score?: number
  published_date?: string
  favicon?: string
}

type TavilyResponse = {
  query?: string
  results?: TavilyResult[]
  response_time?: number
  usage?: { credits?: number }
  request_id?: string
}

function tavilyTimeRange(recencyDays?: number): "day" | "week" | "month" | "year" | undefined {
  if (!recencyDays) return undefined
  if (recencyDays <= 1) return "day"
  if (recencyDays <= 7) return "week"
  if (recencyDays <= 31) return "month"
  if (recencyDays <= 366) return "year"
  return undefined
}

function normalizeDomains(domains?: string[]): string[] {
  return domains?.map((domain) => domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "")).filter(Boolean) ?? []
}

function assertPublicHttpUrl(value: string): URL {
  const url = new URL(value)
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs can be read")
  }
  if (blockedHostPatterns.some((pattern) => pattern.test(url.hostname))) {
    throw new Error("Private, local, and internal URLs cannot be read")
  }
  return url
}

function createResearchCitationRegistry(): ResearchCitationRegistry {
  const citationsByUrl = new Map<string, number>()
  let nextCitation = 1
  return {
    citationForUrl: (value) => {
      const url = new URL(value).toString()
      const existing = citationsByUrl.get(url)
      if (existing != null) return existing
      const citation = nextCitation
      nextCitation += 1
      citationsByUrl.set(url, citation)
      return citation
    },
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
}

function extractMeta(document: Document, names: string[]): string | null {
  for (const name of names) {
    const selector = `meta[name="${name}"], meta[property="${name}"]`
    const value = document.querySelector(selector)?.getAttribute("content")?.trim()
    if (value) return decodeHtmlEntities(value)
  }
  return null
}

function extractReadablePage(html: string, maxChars: number) {
  const { document } = parseHTML(html)
  const article = new Readability(document).parse()
  const text = article?.textContent?.replace(/[ \t\f\v]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() ?? ""
  const truncated = text.length > maxChars
  return {
    title: article?.title ?? (document.title || null),
    byline: article?.byline ?? null,
    excerpt: article?.excerpt ?? null,
    siteName: article?.siteName ?? null,
    publishedAt: extractMeta(document, ["article:published_time", "date", "pubdate", "timestamp"]),
    text: truncated ? text.slice(0, maxChars) : text,
    truncated,
    charCount: text.length,
  }
}

export function createResearchTools() {
  const citations = createResearchCitationRegistry()

  return {
    research_search_web: tool({
      description:
        "Search the public web for current or external source context. Use for latest market/company context, source discovery, or facts not covered by built-in market data. Returns compact results with citation numbers; read important pages with research_read_page before citing details.",
      inputSchema: searchInput,
      execute: async ({ query, recencyDays, domains, maxResults = DEFAULT_SEARCH_RESULTS }) => {
        const apiKey = process.env.TAVILY_API_KEY
        if (!apiKey) throw new Error("TAVILY_API_KEY is not configured")

        const body: Record<string, unknown> = {
          query,
          search_depth: "basic",
          topic: "general",
          max_results: Math.min(maxResults, MAX_SEARCH_RESULTS),
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_favicon: true,
          include_usage: true,
        }
        const includeDomains = normalizeDomains(domains)
        if (includeDomains.length) body.include_domains = includeDomains
        const timeRange = tavilyTimeRange(recencyDays)
        if (timeRange) body.time_range = timeRange

        const response = await fetch(TAVILY_SEARCH_ENDPOINT, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        })
        if (!response.ok) {
          throw new Error(`Search failed with HTTP ${response.status}`)
        }

        const data = await response.json() as TavilyResponse
        const results = (data.results ?? []).slice(0, maxResults).map((result) => ({
          citation: result.url ? citations.citationForUrl(result.url) : null,
          title: result.title ?? "Untitled",
          url: result.url ?? "",
          snippet: result.content ?? "",
          source: result.url ? new URL(result.url).hostname : null,
          publishedAt: result.published_date ?? null,
          score: result.score ?? null,
          favicon: result.favicon ?? null,
        })).filter((result) => result.url)

        return {
          query,
          recencyDays: recencyDays ?? null,
          domains: domains ?? [],
          results,
          responseTime: data.response_time ?? null,
          usageCredits: data.usage?.credits ?? null,
          requestId: data.request_id ?? null,
        }
      },
    }),

    research_read_page: tool({
      description:
        "Read a public HTTP/HTTPS page and return cleaned readable text for grounding and citations. Reuses the page's citation number from research_search_web when possible. Does not execute browser JavaScript.",
      inputSchema: readPageInput,
      execute: async ({ url, maxChars = DEFAULT_PAGE_CHARS }) => {
        const target = assertPublicHttpUrl(url)
        const citation = citations.citationForUrl(target.toString())
        const response = await fetch(target, {
          signal: AbortSignal.timeout(PAGE_FETCH_TIMEOUT_MS),
          headers: {
            "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
            "User-Agent": "PholioResearchBot/0.1 (+https://pholio.markets)",
          },
        })
        if (!response.ok) {
          throw new Error(`Page read failed with HTTP ${response.status}`)
        }

        const contentType = response.headers.get("content-type") ?? ""
        const raw = await response.text()
        const page = contentType.includes("html")
          ? extractReadablePage(raw, maxChars)
          : {
            title: null,
            byline: null,
            excerpt: null,
            siteName: null,
            publishedAt: null,
            text: raw.length > maxChars ? raw.slice(0, maxChars) : raw,
            truncated: raw.length > maxChars,
            charCount: raw.length,
          }

        return {
          citation,
          url: target.toString(),
          contentType,
          ...page,
        }
      },
    }),
  }
}
