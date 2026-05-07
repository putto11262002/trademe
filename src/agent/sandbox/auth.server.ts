type SandboxSession = {
  token: string
}

function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ ok: false, error: message }, { status: 401 })
}

function forbidden(message = "Sandbox API token is not configured"): Response {
  return Response.json({ ok: false, error: message }, { status: 403 })
}

function readBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice("Bearer ".length).trim()
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false

  let result = 0
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export function requireSandboxSession(
  request: Request,
  env: Env,
): SandboxSession | Response {
  const configured = env.SANDBOX_API_TOKEN?.trim()
  if (!configured) return forbidden()

  const token = readBearerToken(request)
  if (!token || !constantTimeEqual(token, configured)) return unauthorized()

  return { token }
}

