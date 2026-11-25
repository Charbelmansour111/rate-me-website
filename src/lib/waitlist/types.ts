import type { Role } from './fields';

/** Where someone signed up from. One value today; add more when there are more forms. */
export type WaitlistSource = 'website-pre-register';

/** A validated, normalized signup. This is all a provider ever receives. */
export type WaitlistEntry = {
  name: string;
  /** Trimmed and lowercased. */
  email: string;
  /** E.164 style ("+9613123456"), or an empty string. */
  phone: string;
  role: Role;
  city: string;
  club: string;
  locale: 'en' | 'ar';
  /** ISO timestamp of the moment consent was given, set by the server. */
  consentAt: string;
  source: WaitlistSource;
};

/**
 * Stores signups somewhere. Brevo, MailerLite and a mock exist today.
 *
 * To move to another backend (for example Supabase), write one class with this method and
 * add it to the switch in `provider.ts`. Nothing else changes. See docs/DEPLOY.md.
 */
export interface WaitlistProvider {
  /**
   * Resolves when the person is on the list, including when they already were: callers must
   * not be able to tell the difference. Rejects with a WaitlistProviderError otherwise.
   */
  subscribe(entry: WaitlistEntry): Promise<void>;
}

/** The message is safe to log: never put personal details or API keys in it. */
export class WaitlistProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaitlistProviderError';
  }
}
