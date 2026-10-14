import "server-only";

/**
 * Sliding-window rate limiter.
 *
 * The default store is in-memory, which is per server instance. On Vercel (many
 * instances) use a shared store such as Upstash Redis by implementing
 * RateLimitStore; see README "Rate limiting in production".
 */
export interface RateLimitStore {
  /** Records a hit and returns the number of hits inside the window (including this one). */
  hit(key: string, windowMs: number, now: number): Promise<number>;
}

class MemoryStore implements RateLimitStore {
  private hits = new Map<string, number[]>();
  async hit(key: string, windowMs: number, now: number) {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < windowMs);
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) if (v.every((t) => now - t >= windowMs)) this.hits.delete(k);
    }
    return recent.length;
  }
}

const store: RateLimitStore = new MemoryStore();

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const count = await store.hit(key, windowMs, Date.now());
  return { ok: count <= limit, retryAfterSec: Math.ceil(windowMs / 1000) };
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}
