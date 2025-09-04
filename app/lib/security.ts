import { headers } from 'next/headers'

type RateBucket = { count: number; resetAt: number }
const rateBuckets = new Map<string, RateBucket>()

export function getClientIp(): string {
  const hdrs = headers()
  const xff = hdrs.get('x-forwarded-for') || ''
  const ip = xff.split(',')[0].trim() || hdrs.get('x-real-ip') || 'unknown'
  return ip
}

export function ensureSameOrigin(): { ok: true } | { ok: false; error: string } {
  const hdrs = headers()
  const origin = hdrs.get('origin') || ''
  const referer = hdrs.get('referer') || ''
  const site = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (!site) return { ok: true }
  const siteUrl = new URL(site)

  const matchesOrigin = origin ? new URL(origin).host === siteUrl.host : true
  const matchesReferer = referer ? new URL(referer).host === siteUrl.host : true
  if (!matchesOrigin || !matchesReferer) {
    return { ok: false, error: 'Cross-site request blocked' }
  }
  return { ok: true }
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000): { ok: true } | { ok: false; error: string } {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (bucket.count >= limit) {
    return { ok: false, error: 'Too many requests. Please slow down.' }
  }
  bucket.count += 1
  return { ok: true }
}


