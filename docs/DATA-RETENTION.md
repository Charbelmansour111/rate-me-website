# Data retention

What this website keeps, for how long, and where the number lives. The privacy page
(`src/i18n/legal`) says the same in plain words; if the two ever differ, fix both.

## The waitlist

Pre-registrations (name, email, role, city, optional WhatsApp number and club, language, consent
time and signup source) are kept by the email-list provider (MailerLite, or Brevo if switched) until
the first of:

- **12 months after the app launches** (`WAITLIST_RETENTION_MONTHS` in `src/config/site.ts`);
- the person unsubscribes (the link is in every email);
- the person asks for deletion at the contact email (subject "Data request"; answered within 30
  days).

After someone unsubscribes, the provider may keep their address on a block list so that they are
not emailed again. That is the only copy kept after the end.

To change the period, change `WAITLIST_RETENTION_MONTHS`: the privacy page reads it. A change to the
period is a change to the privacy policy: update `LEGAL_UPDATED` in the same file and have it
reviewed.

## What the site itself keeps

- No database. The form sends a sign-up straight to the provider.
- A hashed IP address, in memory, for a short time, to limit abuse of the form (rate limit). It is
  gone when the server restarts.
- In the visitor's browser: the theme they chose, and, if statistics are switched on, their cookie
  choice (`analytics-consent`). Both stay on their device.

## To do at launch

- Record the launch date, so the 12 months can be counted.
- In the provider, delete or anonymise the list 12 months after launch (MailerLite: Subscribers,
  filter by signup date or group, delete).
