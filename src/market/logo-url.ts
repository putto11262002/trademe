import type { CompanyProfile } from "./types"

type LogoOptions = {
  /** Pixel width hint passed to CF Image Transformations. */
  size?: number
}

/**
 * Cloudflare zone where Image Transformations is enabled. We always route
 * through this zone — even from dev or preview deploys — so every render
 * hits the same edge-cached transformed image.
 */
const TRANSFORMS_ORIGIN = "https://trademe.sabaiscale.com"

/**
 * Wrap a company-profile logo URL in Cloudflare Image Transformations so the
 * browser caches it (Finnhub's CDN sends no cache headers) and we serve a
 * normalized format/size from the edge.
 */
export function logoUrl(
  profile: Pick<CompanyProfile, "logoUrl">,
  options: LogoOptions = {},
): string | undefined {
  const src = profile.logoUrl
  if (!src) return undefined
  const size = options.size ?? 128
  return `${TRANSFORMS_ORIGIN}/cdn-cgi/image/format=auto,fit=contain,width=${size}/${src}`
}
