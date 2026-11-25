import { createHmac, randomBytes } from 'node:crypto';

type Options = { limit: number; windowMs: number; maxKeys?: number; now?: () => number };

/**
 * Sliding-window limiter in memory. Basic on purpose: each server instance counts on its own
 * and forgets on restart, which is enough to slow down a script on a pre-register form.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;
  private readonly now: () => number;

  constructor({ limit, windowMs, maxKeys = 10_000, now = Date.now }: Options) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
    this.now = now;
  }

  check(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = this.now();
    const recent = (this.hits.get(key) ?? []).filter((time) => now - time < this.windowMs);
    // Re-inserting keeps the map ordered by last use, so the stalest key is always first.
    this.hits.delete(key);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) {
      this.hits.delete(this.hits.keys().next().value as string);
    }
    if (recent.length >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + this.windowMs - now) / 1000)),
      };
    }
    recent.push(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/** Random per process and never written anywhere: the hashes cannot be turned back into IPs. */
const salt = randomBytes(32);
export const hashIp = (ip: string) => createHmac('sha256', salt).update(ip).digest('base64url');

/** Vercel sets these headers itself and drops whatever the client sent. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-vercel-forwarded-for') ?? headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || headers.get('x-real-ip') || 'unknown';
}
