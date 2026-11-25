# Deploying the Rate Me website

Production: **https://getrateme.space**. App legal URLs: https://getrateme.space/privacy and
https://getrateme.space/terms.

API keys go into Vercel and `.env.local` only. Never commit them or paste them in a chat.

## 1. Email list: Brevo (free)

1. Create an account at https://www.brevo.com and finish its account checks.
2. **Contacts > Lists**: create the list **Rate Me pre-register**. Its number (shown as `#7`) is
   `BREVO_LIST_ID`, without the `#`.
3. **Contacts > Settings > Contact attributes**: add these as type **Text**, with these exact names:
   `FULLNAME`, `PHONE`, `ROLE`, `CITY`, `CLUB`, `LOCALE`, `CONSENT_AT`, `SOURCE`.
   Brevo may drop values for attributes that do not exist, so do this before testing.
4. **Settings > SMTP & API > API keys**: create a key. This is `BREVO_API_KEY`.
5. Leave IP restriction for API keys off: Vercel's addresses change.
6. Before sending a campaign, verify a sender address on getrateme.space (SPF, DKIM, DMARC).

### Or MailerLite

Create the group **Rate Me pre-register** (its ID is `MAILERLITE_GROUP_ID`), create the text fields
`role`, `club`, `locale`, `consent_at`, `source` (`name`, `phone` and `city` exist already), create
an API token (`MAILERLITE_API_KEY`) and set `WAITLIST_PROVIDER=mailerlite`.

## 2. Environment variables

`.env.example` lists all of them. For local use copy it to `.env.local`. For production add them in
Vercel under **Project > Settings > Environment Variables**:

| Variable                                        | Production value                                |
| ----------------------------------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                          | `https://getrateme.space`                       |
| `NEXT_PUBLIC_CONTACT_EMAIL`                     | Required before launch: the legal pages show it |
| `NEXT_PUBLIC_COMMUNITY_URL`                     | Invite link; empty hides the button             |
| `NEXT_PUBLIC_SOCIAL_*`                          | Full `https://` links; empty hides each one     |
| `WAITLIST_PROVIDER`                             | `brevo`                                         |
| `BREVO_API_KEY` (mark as Sensitive)             | Your key                                        |
| `BREVO_LIST_ID`                                 | The list number                                 |
| `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`     | Only with MailerLite                            |
| `TURNSTILE_ENABLED`, `_SITE_KEY`, `_SECRET_KEY` | Optional, see below                             |
| `NEXT_PUBLIC_ANALYTICS_*`                       | Optional, see below                             |

Public, Turnstile and analytics values are read at build time: **redeploy after changing them**. If
the waitlist settings are missing in production, the form shows an error instead of losing signups.
For Preview deployments use `WAITLIST_PROVIDER=mock`, so tests never reach the real list.

## 3. Vercel

1. Push this repository to GitHub.
2. https://vercel.com/new: import `rate-me-website`. Vercel detects Next.js; keep the defaults.
3. Add the variables above and press **Deploy**.
4. Check your plan: Vercel's free Hobby plan is for non-commercial use.

## 4. Domain (Namecheap)

1. Vercel: **Project > Settings > Domains**, add `getrateme.space` and `www.getrateme.space`. Make
   `getrateme.space` the primary one and redirect `www` to it.
2. Vercel shows the DNS records (usually an `A` record for `@` and a `CNAME` for `www`). **Use the
   values Vercel shows.**
3. Namecheap: **Domain List > Manage > Advanced DNS**. Delete Namecheap's parking records for `@` and
   `www`, then add Vercel's records. Keep any mail records (MX, TXT).
4. Wait until Vercel shows both domains as valid. HTTPS is automatic.

## 5. Test end to end

1. Open https://getrateme.space and https://getrateme.space/ar.
2. Pre-register with a real address. Check the contact, its list and all eight attributes in Brevo.
3. Send the same address again: the page shows the same success, Brevo still has one contact.
4. Try `someone@mailinator.com`: the form asks for another address.
5. Check `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml`, and share the link on WhatsApp.
6. Delete the test contact.

If the form says it could not save, open **Vercel > Logs** and look for `[pre-register]`:

| Log                                       | Fix                                               |
| ----------------------------------------- | ------------------------------------------------- |
| `config: …`                               | That variable is missing or wrong                 |
| `brevo: HTTP 401 …`                       | Wrong key, or Brevo blocks the IP (step 1.5)      |
| `brevo: HTTP 400 …` / `brevo: HTTP 404 …` | Wrong list number or an attribute of another type |

## Optional: Turnstile

Create a widget in Cloudflare for `getrateme.space`, set `TURNSTILE_ENABLED=true` and both keys, then
redeploy. The content security policy opens for Cloudflare on its own.

## Optional: analytics

Set `NEXT_PUBLIC_ANALYTICS_ENABLED=true`, the domain and the script address (Plausible or a
compatible tool that uses the `data-domain` attribute), then redeploy. It sets no cookies, so no
cookie banner is needed; the privacy draft already describes it. A tool that uses cookies would need
both a consent banner and new privacy text.

## Protection in place

- Honeypot, same-origin check, 8 KB limit, validation, disposable-email list.
- 10 tries per IP per 10 minutes. IPs are hashed with a random key and live in memory only. Each
  server instance counts separately; for heavy abuse turn on Turnstile or a Vercel Firewall rule.
- New and known emails get the same answer, and a repeat signup cannot change saved details.

## Later: another provider such as Supabase

The site only knows the interface in `src/lib/waitlist/types.ts`:

```ts
interface WaitlistProvider {
  subscribe(entry: WaitlistEntry): Promise<void>;
}
```

1. Add `src/lib/waitlist/supabase.ts` with a class that implements it. Insert on the server, ignore a
   conflict on the unique `email`, and throw `WaitlistProviderError` (no personal data in the
   message) on failure.
2. Table columns: `name, email, phone, role, city, club, locale, consent_at, source`. Turn on row
   level security with no public policies.
3. Add a `case 'supabase'` to `src/lib/waitlist/provider.ts` and its server-only variables to
   `.env.example`.
4. Add tests next to `tests/unit/providers.test.ts`, update the privacy policy, and export the old
   list if you want to move it.
