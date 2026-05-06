import { z } from "zod"

export const BROKERS = [
  { slug: "dime", label: "Dime!" },
  { slug: "liberator", label: "Liberator" },
  { slug: "webull_th", label: "Webull TH" },
  { slug: "bls", label: "Bualuang Securities (BLS)" },
  { slug: "kss", label: "Krungsri Securities (KSS)" },
  { slug: "pi", label: "Pi" },
  { slug: "phillip", label: "Phillip Securities" },
  { slug: "rhb", label: "RHB Securities" },
  { slug: "yuanta", label: "Yuanta Securities" },
  { slug: "ksecurities", label: "KSecurities" },
  { slug: "thanachart", label: "Thanachart" },
  { slug: "dbsv", label: "DBS Vickers" },
  { slug: "aira", label: "AIRA Securities" },
  { slug: "maybank", label: "Maybank Securities" },
  { slug: "bitkub", label: "Bitkub" },
] as const

export type BrokerSlug = (typeof BROKERS)[number]["slug"]
export const BROKER_SLUGS = BROKERS.map((b) => b.slug) as [BrokerSlug, ...BrokerSlug[]]

export const brokerSchema = z.enum(BROKER_SLUGS)

export function brokerLabel(slug: BrokerSlug | null | undefined): string | null {
  if (!slug) return null
  return BROKERS.find((b) => b.slug === slug)?.label ?? slug
}
