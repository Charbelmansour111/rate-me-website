import { describe, expect, it } from 'vitest';

import { clientIp, hashIp, RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
  it('allows the limit, then blocks until the window has passed', () => {
    let now = 0;
    const limiter = new RateLimiter({ limit: 2, windowMs: 10_000, now: () => now });
    expect(limiter.check('a').allowed).toBe(true);
    now = 4_000;
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('a')).toEqual({ allowed: false, retryAfterSeconds: 6 });
    now = 10_000; // the first hit has expired, the second has not
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });

  it('counts each key on its own', () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });

  it('forgets the stalest key when full, so memory stays bounded', () => {
    const limiter = new RateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2, now: () => 0 });
    limiter.check('a');
    limiter.check('b');
    limiter.check('a'); // blocked, but makes "b" the stalest
    limiter.check('c');
    expect(limiter.check('a').allowed).toBe(false);
    expect(limiter.check('b').allowed).toBe(true);
  });
});

describe('IPs', () => {
  it('are hashed: stable, different per address, and without the address in them', () => {
    expect(hashIp('203.0.113.7')).toBe(hashIp('203.0.113.7'));
    expect(hashIp('203.0.113.7')).not.toBe(hashIp('203.0.113.8'));
    expect(hashIp('203.0.113.7')).not.toContain('203');
  });

  it('come from the platform headers', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' });
    expect(clientIp(headers)).toBe('1.1.1.1');
    headers.set('x-vercel-forwarded-for', '3.3.3.3');
    expect(clientIp(headers)).toBe('3.3.3.3');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
