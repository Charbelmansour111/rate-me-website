import { BrevoProvider } from './brevo';
import { MailerLiteProvider } from './mailerlite';
import { MockProvider } from './mock';
import { WaitlistProviderError, type WaitlistProvider } from './types';

type Env = Record<string, string | undefined>;

let mock: MockProvider | undefined;

function required(env: Env, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new WaitlistProviderError(`config: ${key} is not set`);
  return value;
}

/**
 * The provider named by WAITLIST_PROVIDER. Unset means the mock in development only: a live
 * site with a missing setting must fail loudly rather than drop signups.
 */
export function getWaitlistProvider(env: Env = process.env): WaitlistProvider {
  const name = env.WAITLIST_PROVIDER?.trim() || (env.NODE_ENV === 'production' ? '' : 'mock');
  switch (name) {
    case 'brevo': {
      const listId = Number(required(env, 'BREVO_LIST_ID'));
      if (!Number.isInteger(listId) || listId <= 0) {
        throw new WaitlistProviderError('config: BREVO_LIST_ID must be a number');
      }
      return new BrevoProvider(required(env, 'BREVO_API_KEY'), listId);
    }
    case 'mailerlite':
      return new MailerLiteProvider(
        required(env, 'MAILERLITE_API_KEY'),
        required(env, 'MAILERLITE_GROUP_ID'),
      );
    case 'mock':
      if (env.VERCEL_ENV === 'production') {
        throw new WaitlistProviderError('config: the mock provider cannot run in production');
      }
      mock ??= new MockProvider();
      return mock;
    default:
      throw new WaitlistProviderError('config: WAITLIST_PROVIDER is missing or unknown');
  }
}
