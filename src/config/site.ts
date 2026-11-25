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

/** The day the legal drafts last changed. */
export const LEGAL_UPDATED = '2026-11-25';
