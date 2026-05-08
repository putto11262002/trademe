import { verifyUserApiToken } from "@/auth/api-token.server"

function readBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice("Bearer ".length).trim()
}

function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ ok: false, error: message }, { status: 401 })
}

export async function requireSandboxSession(request: Request): Promise<{ userId: string } | Response> {
  const token = readBearerToken(request)
  if (!token) return unauthorized("Missing Bearer token")

  try {
    const { userId } = await verifyUserApiToken(token)
    return { userId }
  } catch {
    return unauthorized("Invalid or expired token")
  }
}
