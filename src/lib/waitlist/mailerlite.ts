import { callApi } from './http';
import { WaitlistProviderError, type WaitlistEntry, type WaitlistProvider } from './types';

const API = 'https://connect.mailerlite.com/api';

/** Custom fields must exist in MailerLite first (docs/DEPLOY.md). */
export class MailerLiteProvider implements WaitlistProvider {
  constructor(
    private readonly apiKey: string,
    private readonly groupId: string,
  ) {}

  async subscribe(entry: WaitlistEntry): Promise<void> {
    const headers = { authorization: `Bearer ${this.apiKey}` };
    // POST /subscribers updates existing people, so look first: a stranger who knows an email
    // must not be able to overwrite its details.
    const known = await callApi(
      'mailerlite',
      `${API}/subscribers/${encodeURIComponent(entry.email)}`,
      { method: 'GET', headers },
    );
    if (known.status === 200) {
      const id = (known.body.data as { id?: string } | undefined)?.id;
      if (!id) throw new WaitlistProviderError('mailerlite: lookup returned no id');
      const added = await callApi('mailerlite', `${API}/subscribers/${id}/groups/${this.groupId}`, {
        method: 'POST',
        headers,
      });
      if (added.status >= 300) {
        throw new WaitlistProviderError(`mailerlite: group add HTTP ${added.status}`);
      }
      return;
    }
    if (known.status !== 404) {
      throw new WaitlistProviderError(`mailerlite: lookup HTTP ${known.status}`);
    }

    const created = await callApi('mailerlite', `${API}/subscribers`, {
      method: 'POST',
      headers,
      body: {
        email: entry.email,
        groups: [this.groupId],
        fields: {
          name: entry.name,
          phone: entry.phone,
          city: entry.city,
          role: entry.role,
          club: entry.club,
          locale: entry.locale,
          consent_at: entry.consentAt,
          // MailerLite reserves "source".
          signup_source: entry.source,
        },
      },
    });
    if (created.status >= 300) {
      throw new WaitlistProviderError(`mailerlite: HTTP ${created.status}`);
    }
  }
}
