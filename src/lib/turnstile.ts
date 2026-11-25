/** Cloudflare Turnstile, off unless TURNSTILE_ENABLED=true. */
export const turnstileEnabled = () => process.env.TURNSTILE_ENABLED === 'true';

/** The site key is public; it is empty when Turnstile is off. */
export const turnstileSiteKey = () =>
  turnstileEnabled() ? (process.env.TURNSTILE_SITE_KEY ?? '') : '';

export async function verifyTurnstile(token: unknown): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(6000),
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
