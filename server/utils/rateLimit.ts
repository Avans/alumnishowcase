import type { H3Event } from 'h3'

const hits = new Map<string, number[]>()

/**
 * Small in-memory sliding-window limiter. It is per server instance, which is
 * enough to blunt casual abuse; put a WAF or Turnstile in front for more.
 */
export function enforceRateLimit(event: H3Event, { max, windowMs }: { max: number; windowMs: number }) {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)

  if (recent.length >= max) {
    const retryAfter = Math.ceil((windowMs - (now - recent[0]!)) / 1000)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'You have submitted a lot recently. Please try again later.',
      data: { code: 'rateLimited' },
    })
  }

  recent.push(now)
  hits.set(ip, recent)

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(key)
    }
  }
}
