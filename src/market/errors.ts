export class MarketError extends Error {
  readonly cause?: unknown
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = "MarketError"
    this.cause = options?.cause
  }
}

export class MarketUpstreamError extends MarketError {
  readonly vendor: string
  readonly status?: number
  constructor(vendor: string, message: string, options?: { status?: number; cause?: unknown }) {
    super(`[${vendor}] ${message}`, { cause: options?.cause })
    this.name = "MarketUpstreamError"
    this.vendor = vendor
    this.status = options?.status
  }
}

export class MarketNotFoundError extends MarketError {
  readonly resource: string
  constructor(resource: string) {
    super(`Not found: ${resource}`)
    this.name = "MarketNotFoundError"
    this.resource = resource
  }
}

export class MarketRateLimitError extends MarketError {
  readonly vendor: string
  readonly retryAfterSeconds?: number
  constructor(vendor: string, retryAfterSeconds?: number) {
    super(`[${vendor}] rate limit exceeded`)
    this.name = "MarketRateLimitError"
    this.vendor = vendor
    this.retryAfterSeconds = retryAfterSeconds
  }
}
