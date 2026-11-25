import { clientIp, hashIp, type RateLimiter } from '../rate-limit';
import { verifyTurnstile } from '../turnstile';
import type { FieldErrors } from './fields';
import { signupSchema, toFieldErrors } from './schema';
import { WaitlistProviderError, type WaitlistProvider } from './types';

export type SignupResponse =
  | { ok: true }
  | {
      ok: false;
      error: 'bad_request' | 'invalid' | 'rate_limited' | 'challenge_failed' | 'unavailable';
      fields?: FieldErrors;
    };

const MAX_BODY = 8 * 1024;

const reply = (status: number, body: SignupResponse, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } });

/** Browsers send Origin on every POST; another site's form must not post here. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}

export async function handlePreRegister(
  request: Request,
  deps: { getProvider: () => WaitlistProvider; limiter: RateLimiter; now?: () => Date },
): Promise<Response> {
  const isJson = request.headers.get('content-type')?.startsWith('application/json');
  if (!isJson || !sameOrigin(request)) return reply(400, { ok: false, error: 'bad_request' });

  const { allowed, retryAfterSeconds } = deps.limiter.check(hashIp(clientIp(request.headers)));
  if (!allowed) {
    return reply(
      429,
      { ok: false, error: 'rate_limited' },
      { 'retry-after': String(retryAfterSeconds) },
    );
  }

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) {
    return reply(413, { ok: false, error: 'bad_request' });
  }
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return reply(413, { ok: false, error: 'bad_request' });
    const json: unknown = JSON.parse(text);
    if (typeof json !== 'object' || json === null || Array.isArray(json)) throw new Error();
    body = json as Record<string, unknown>;
  } catch {
    return reply(400, { ok: false, error: 'bad_request' });
  }

  // Honeypot: people never see this field. Answer like a success so bots learn nothing.
  if (body.website) return reply(200, { ok: true });

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return reply(422, { ok: false, error: 'invalid', fields: toFieldErrors(parsed.error) });
  }
  if (!(await verifyTurnstile(body.turnstileToken))) {
    return reply(403, { ok: false, error: 'challenge_failed' });
  }

  const { name, email, phone, role, city, club, locale } = parsed.data;
  try {
    await deps.getProvider().subscribe({
      name,
      email,
      phone,
      role,
      city,
      club,
      locale,
      consentAt: (deps.now?.() ?? new Date()).toISOString(),
      source: 'website-pre-register',
    });
  } catch (error) {
    // Provider errors are written to be safe to log; anything else might hold personal data.
    console.error(
      '[pre-register]',
      error instanceof WaitlistProviderError ? error.message : 'unexpected error',
    );
    return reply(503, { ok: false, error: 'unavailable' });
  }
  return reply(200, { ok: true });
}
