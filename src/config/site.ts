/** Public settings. NEXT_PUBLIC_* must be read by full name so Next.js can inline them. */
const clean = (value: string | undefined) => value?.trim() ?? '';
/** Only real web links: a typo or a "javascript:" value is treated as empty. */
const link = (value: string | undefined) => (/^https?:\/\//.test(clean(value)) ? clean(value) : '');

export const site = {
  name: 'Rate Me',
  url: (link(process.env.NEXT_PUBLIC_SITE_URL) || 'https://getrateme.space').replace(/\/+$/, ''),
  communityUrl: link(process.env.NEXT_PUBLIC_COMMUNITY_URL),
  contactEmail: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  socials: [
    { name: 'Instagram', url: link(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM) },
    { name: 'Facebook', url: link(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK) },
    { name: 'TikTok', url: link(process.env.NEXT_PUBLIC_SOCIAL_TIKTOK) },
    { name: 'YouTube', url: link(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE) },
    { name: 'LinkedIn', url: link(process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN) },
    { name: 'X', url: link(process.env.NEXT_PUBLIC_SOCIAL_X) },
  ].filter((social) => social.url),
  analytics: {
    enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
    domain: clean(process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN) || 'getrateme.space',
    src: link(process.env.NEXT_PUBLIC_ANALYTICS_SRC) || 'https://plausible.io/js/script.js',
  },
} as const;

/**
 * English is the default at "/"; Arabic lives at "/ar". Set to false to launch in English only:
 * the switch, hreflang and sitemap entries go away and /ar answers 404. Rebuild after a change.
 */
export const ARABIC_ENABLED: boolean = true;

/** The day the legal drafts last changed. */
export const LEGAL_UPDATED = '2026-11-27';

/**
 * Who runs Rate Me, shown in the footer and on the privacy page. Every TODO- value is a
 * placeholder to replace with the real details before launch; none of them is real.
 */
export const business = {
  name: 'TODO-legal-or-business-name',
  email: site.contactEmail || 'TODO-contact-email',
  city: 'TODO-city',
  country: 'TODO-country',
  phone: 'TODO-phone',
} as const;

/**
 * How long the waitlist is kept: until this many months after the app launches, or until the person
 * unsubscribes or asks for deletion, whichever comes first. The privacy page reads it; see
 * docs/DATA-RETENTION.md.
 */
export const WAITLIST_RETENTION_MONTHS = 12;
