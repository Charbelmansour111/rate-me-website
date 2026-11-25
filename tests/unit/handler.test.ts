import { afterEach, describe, expect, it, vi } from 'vitest';

import { RateLimiter } from '@/lib/rate-limit';
import { handlePreRegister } from '@/lib/waitlist/handler';
import { MockProvider } from '@/lib/waitlist/mock';

const body = {
  name: 'Rami Haddad',
  email: 'Rami@Club.lb',
  phone: '',
  role: 'coach',
  city: 'Beirut',
  club: '',
  consent: true,
  locale: 'en',
  website: '',
};

function setup(limit = 100) {
  const provider = new MockProvider();
  const limiter = new RateLimiter({ limit, windowMs: 60_000 });
  const post = async (payload: unknown, headers: Record<string, string> = {}) => {
    const response = await handlePreRegister(
      new Request('https://getrateme.space/api/pre-register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', host: 'getrateme.space', ...headers },
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
      }),
      { getProvider: () => provider, limiter, now: () => new Date('2026-11-25T10:00:00Z') },
    );
    return { status: response.status, headers: response.headers, json: await response.json() };
  };
  return { provider, post };
}

afterEach(() => vi.unstubAllEnvs());

describe('POST /api/pre-register', () => {
  it('forwards a normalized signup with the consent time and source', async () => {
    const { post, provider } = setup();
    expect(await post(body)).toMatchObject({ status: 200, json: { ok: true } });
    expect(provider.entries).toEqual([
      {
        name: 'Rami Haddad',
        email: 'rami@club.lb',
        phone: '',
        role: 'coach',
        city: 'Beirut',
        club: '',
        locale: 'en',
        consentAt: '2026-11-25T10:00:00.000Z',
        source: 'website-pre-register',
      },
    ]);
  });

  it('answers a duplicate exactly like a new signup', async () => {
    const { post, provider } = setup();
    const first = await post(body);
    const second = await post(body);
    expect([second.status, second.json]).toEqual([first.status, first.json]);
    expect(provider.entries).toHaveLength(1);
  });

  it('drops a filled honeypot but answers like a success', async () => {
    const { post, provider } = setup();
    expect(await post({ ...body, website: 'http://spam' })).toMatchObject({
      status: 200,
      json: { ok: true },
    });
    expect(provider.entries).toHaveLength(0);
  });

  it('names the wrong fields', async () => {
    const { post, provider } = setup();
    expect(await post({ ...body, email: 'x@yopmail.com', consent: false })).toMatchObject({
      status: 422,
      json: { error: 'invalid', fields: { email: 'emailJunk', consent: 'consentRequired' } },
    });
    expect(provider.entries).toHaveLength(0);
  });

  it('limits each IP, and only that IP', async () => {
    const { post } = setup(1);
    await post(body, { 'x-forwarded-for': '1.1.1.1' });
    const blocked = await post(body, { 'x-forwarded-for': '1.1.1.1' });
    expect(blocked).toMatchObject({ status: 429, json: { error: 'rate_limited' } });
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await post(body, { 'x-forwarded-for': '2.2.2.2' })).status).toBe(200);
  });

  it.each([
    ['another origin', body, { origin: 'https://evil.com' }, 400],
    ['a form post', body, { 'content-type': 'text/plain' }, 400],
    ['broken JSON', '{', {}, 400],
    ['an array', [], {}, 400],
    ['a huge body', { ...body, name: 'x'.repeat(9000) }, {}, 413],
  ])('refuses %s', async (_, payload, headers, status) => {
    const { post, provider } = setup();
    expect((await post(payload, headers as Record<string, string>)).status).toBe(status);
    expect(provider.entries).toHaveLength(0);
  });

  it('hides provider problems and logs no personal details', async () => {
    const { post, provider } = setup();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(provider, 'subscribe').mockRejectedValue(new Error('rami@club.lb failed'));
    expect(await post(body)).toMatchObject({
      status: 503,
      json: { ok: false, error: 'unavailable' },
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('rami');
  });

  it('requires a valid Turnstile token once it is turned on', async () => {
    vi.stubEnv('TURNSTILE_ENABLED', 'true');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const { post, provider } = setup();
    expect((await post(body)).status).toBe(403);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: false })));
    expect((await post({ ...body, turnstileToken: 'bad' })).status).toBe(403);
    expect(provider.entries).toHaveLength(0);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true })));
    expect((await post({ ...body, turnstileToken: 'good' })).status).toBe(200);
    expect(provider.entries).toHaveLength(1);
  });
});
