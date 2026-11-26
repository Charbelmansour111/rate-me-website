import { describe, expect, it, vi } from 'vitest';

import { BrevoProvider } from '@/lib/waitlist/brevo';
import { MailerLiteProvider } from '@/lib/waitlist/mailerlite';
import { ROLES } from '@/lib/waitlist/fields';
import { MockProvider } from '@/lib/waitlist/mock';
import { getWaitlistProvider } from '@/lib/waitlist/provider';
import type { WaitlistEntry } from '@/lib/waitlist/types';

const entry: WaitlistEntry = {
  name: 'Rami Haddad',
  email: 'rami@club.lb',
  phone: '+9613123456',
  role: 'coach',
  city: 'Beirut',
  club: 'FC Test',
  locale: 'en',
  consentAt: '2026-11-25T10:00:00.000Z',
  source: 'website-pre-register',
};

/** Answers each request with the next [status, body] and records what was sent. */
function mockFetch(...answers: [number, unknown?][]) {
  const fetch = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => {
    const [status, body] = answers.shift()!;
    const empty = status === 204;
    return new Response(empty ? null : JSON.stringify(body ?? {}), { status });
  });
  vi.stubGlobal('fetch', fetch);
  return {
    count: () => fetch.mock.calls.length,
    call: (i: number) => {
      const [url, init] = fetch.mock.calls[i];
      return {
        url,
        method: init.method,
        headers: init.headers as Record<string, string>,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      };
    },
  };
}

describe('Brevo', () => {
  const provider = new BrevoProvider('brevo-key', 7);

  it('creates the contact on the list with every attribute', async () => {
    const api = mockFetch([201, { id: 1 }]);
    await provider.subscribe(entry);
    const call = api.call(0);
    expect(call.url).toBe('https://api.brevo.com/v3/contacts');
    expect(call.headers['api-key']).toBe('brevo-key');
    expect(call.body).toEqual({
      email: 'rami@club.lb',
      listIds: [7],
      updateEnabled: false,
      attributes: {
        FULLNAME: 'Rami Haddad',
        PHONE: '+9613123456',
        ROLE: 'coach',
        CITY: 'Beirut',
        CLUB: 'FC Test',
        LOCALE: 'en',
        CONSENT_AT: '2026-11-25T10:00:00.000Z',
        SOURCE: 'website-pre-register',
      },
    });
  });

  it.each([201, 400])('treats a known contact as a success (list add: %i)', async (status) => {
    const api = mockFetch([400, { code: 'duplicate_parameter' }], [status]);
    await expect(provider.subscribe(entry)).resolves.toBeUndefined();
    expect(api.call(1).url).toBe('https://api.brevo.com/v3/contacts/lists/7/contacts/add');
    expect(api.call(1).body).toEqual({ emails: ['rami@club.lb'] });
  });

  it('fails without leaking personal details or the key', async () => {
    mockFetch([401, { code: 'unauthorized', message: 'rami@club.lb brevo-key' }]);
    const error = await provider.subscribe(entry).catch((e: Error) => e);
    expect(String(error)).toBe('WaitlistProviderError: brevo: HTTP 401 (unauthorized)');
  });

  it('turns a network failure into a provider error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    await expect(provider.subscribe(entry)).rejects.toThrow('brevo: network error or timeout');
  });
});

describe('MailerLite', () => {
  const provider = new MailerLiteProvider('ml-key', '99');

  it('creates a new subscriber in the group with every field', async () => {
    const api = mockFetch([404], [201]);
    await provider.subscribe(entry);
    expect(api.call(0).url).toBe('https://connect.mailerlite.com/api/subscribers/rami%40club.lb');
    expect(api.call(1).headers.authorization).toBe('Bearer ml-key');
    expect(api.call(1).body).toEqual({
      email: 'rami@club.lb',
      groups: ['99'],
      fields: {
        name: 'Rami Haddad',
        phone: '+9613123456',
        city: 'Beirut',
        role: 'coach',
        club: 'FC Test',
        locale: 'en',
        consent_at: '2026-11-25T10:00:00.000Z',
        signup_source: 'website-pre-register',
      },
    });
  });

  it('only adds a known subscriber to the group, without changing their details', async () => {
    const api = mockFetch([200, { data: { id: '55' } }], [201]);
    await provider.subscribe(entry);
    expect(api.count()).toBe(2);
    expect(api.call(1)).toMatchObject({
      url: 'https://connect.mailerlite.com/api/subscribers/55/groups/99',
      method: 'POST',
      body: undefined,
    });
  });

  it.each([
    ['the lookup', [[500]]],
    ['the create', [[404], [422]]],
    ['the group add', [[200, { data: { id: '55' } }], [404]]],
  ] as [string, [number, unknown?][]][])('fails when %s fails', async (_, answers) => {
    mockFetch(...answers);
    await expect(provider.subscribe(entry)).rejects.toThrow('mailerlite:');
  });
});

describe('roles reach the providers as they are', () => {
  it.each(ROLES)('%s', async (role) => {
    const brevo = mockFetch([201]);
    await new BrevoProvider('k', 7).subscribe({ ...entry, role });
    expect(brevo.call(0).body.attributes.ROLE).toBe(role);
    const mailerlite = mockFetch([404], [201]);
    await new MailerLiteProvider('k', '9').subscribe({ ...entry, role });
    expect(mailerlite.call(1).body.fields.role).toBe(role);
  });
});

describe('provider selection', () => {
  it('keeps one entry per email in the mock', async () => {
    const mock = new MockProvider();
    await mock.subscribe(entry);
    await mock.subscribe(entry);
    expect(mock.entries).toEqual([entry]);
  });

  it('follows WAITLIST_PROVIDER', () => {
    expect(
      getWaitlistProvider({ WAITLIST_PROVIDER: 'brevo', BREVO_API_KEY: 'k', BREVO_LIST_ID: '7' }),
    ).toBeInstanceOf(BrevoProvider);
    expect(
      getWaitlistProvider({
        WAITLIST_PROVIDER: 'mailerlite',
        MAILERLITE_API_KEY: 'k',
        MAILERLITE_GROUP_ID: '9',
      }),
    ).toBeInstanceOf(MailerLiteProvider);
    expect(getWaitlistProvider({ NODE_ENV: 'development' })).toBeInstanceOf(MockProvider);
  });

  it.each([
    { NODE_ENV: 'production' },
    { WAITLIST_PROVIDER: 'mock', VERCEL_ENV: 'production' },
    { WAITLIST_PROVIDER: 'brevo', BREVO_API_KEY: 'k', BREVO_LIST_ID: 'abc' },
    { WAITLIST_PROVIDER: 'brevo', BREVO_LIST_ID: '7' },
    { WAITLIST_PROVIDER: 'typo' },
  ])('refuses the broken setup %j', (env) => {
    expect(() => getWaitlistProvider(env)).toThrow('config:');
  });
});
