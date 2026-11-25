import { callApi } from './http';
import { WaitlistProviderError, type WaitlistEntry, type WaitlistProvider } from './types';

const API = 'https://api.brevo.com/v3';

/**
 * Attributes must exist in Brevo first (docs/DEPLOY.md). The phone goes to our own PHONE
 * attribute: Brevo's built-in SMS one must be unique, and two people may share a number.
 */
export class BrevoProvider implements WaitlistProvider {
  constructor(
    private readonly apiKey: string,
    private readonly listId: number,
  ) {}

  async subscribe(entry: WaitlistEntry): Promise<void> {
    const headers = { 'api-key': this.apiKey };
    // updateEnabled is false so a stranger who knows an email cannot overwrite its details.
    const created = await callApi('brevo', `${API}/contacts`, {
      method: 'POST',
      headers,
      body: {
        email: entry.email,
        listIds: [this.listId],
        updateEnabled: false,
        attributes: {
          FULLNAME: entry.name,
          PHONE: entry.phone,
          ROLE: entry.role,
          CITY: entry.city,
          CLUB: entry.club,
          LOCALE: entry.locale,
          CONSENT_AT: entry.consentAt,
          SOURCE: entry.source,
        },
      },
    });
    if (created.status >= 200 && created.status < 300) return;
    if (created.status !== 400 || created.body.code !== 'duplicate_parameter') {
      throw new WaitlistProviderError(
        `brevo: HTTP ${created.status} (${String(created.body.code)})`,
      );
    }

    // Known contact: make sure they are on this list. 400 means they already are.
    const added = await callApi('brevo', `${API}/contacts/lists/${this.listId}/contacts/add`, {
      method: 'POST',
      headers,
      body: { emails: [entry.email] },
    });
    if (added.status >= 300 && added.status !== 400) {
      throw new WaitlistProviderError(`brevo: list add HTTP ${added.status}`);
    }
  }
}
