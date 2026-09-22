// Approximate per-instance rate limiter (token bucket per key).
//
// Architecture note: on Cloudflare Workers each isolate keeps its own
// counters, so this is defense-in-depth friction, NOT a global quota.
// Hard quotas already exist where they matter: Supabase Auth rate-limits
// sign-in natively, chat has a persisted 30/day budget, uploads are capped
// at 15 MB with teacher-only access. Use this only for cheap abuse
// friction on expensive operations (e.g. PDF upload starts).

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { allowed: boolean; retryAfterMs: number } {
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (current.count < limit) {
    current.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }
  return { allowed: false, retryAfterMs: Math.max(0, current.resetAt - now) };
}

/** Test seam: clear all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}
