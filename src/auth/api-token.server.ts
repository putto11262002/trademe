const DEFAULT_EXPIRY_SECONDS = 300

function base64url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  let str = ""
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/")
  const padLen = (4 - (padded.length % 4)) % 4
  const decoded = atob(padded + "=".repeat(padLen))
  return Uint8Array.from(decoded, (c) => c.charCodeAt(0))
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
}

function getSecret(): string {
  const secret = process.env.API_TOKEN_SECRET
  if (!secret) throw new Error("API_TOKEN_SECRET is not configured")
  return secret
}

export async function createUserApiToken(userId: string, opts?: { expiresInSeconds?: number }): Promise<string> {
  if (!userId) throw new Error("Cannot create API token without user id")

  const secret = getSecret()
  const enc = new TextEncoder()

  const header = base64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })))
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (opts?.expiresInSeconds ?? DEFAULT_EXPIRY_SECONDS)
  const payload = base64url(enc.encode(JSON.stringify({ sub: userId, iat: now, exp })))

  const key = await importKey(secret)
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${payload}`))

  return `${header}.${payload}.${base64url(sig)}`
}

export async function verifyUserApiToken(token: string): Promise<{ userId: string }> {
  const secret = getSecret()
  const enc = new TextEncoder()

  const parts = token.split(".")
  if (parts.length !== 3) throw new Error("Invalid token format")

  const [header, payload, sig] = parts
  const key = await importKey(secret)
  const sigBytes = base64urlDecode(sig)
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, enc.encode(`${header}.${payload}`))
  if (!valid) throw new Error("Invalid token signature")

  let claims: Record<string, unknown>
  try {
    claims = JSON.parse(new TextDecoder().decode(base64urlDecode(payload)))
  } catch {
    throw new Error("Malformed token payload")
  }

  const now = Math.floor(Date.now() / 1000)
  if (typeof claims.exp !== "number" || claims.exp < now) throw new Error("Token expired")
  if (typeof claims.sub !== "string" || !claims.sub) throw new Error("Token missing subject")

  return { userId: claims.sub }
}
