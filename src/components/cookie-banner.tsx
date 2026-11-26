'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

import type { Dictionary } from '@/i18n';

const KEY = 'analytics-consent';
/** Sent by the footer's "Cookie settings" to show the choice again. */
export const OPEN_COOKIES = 'rateme:cookies';

/**
 * The only optional thing on the site is visitor statistics (cookie-free, src/config/site.ts:
 * analytics). They stay off until someone accepts here. Accept and Reject are the same size and
 * weight; the choice is kept in the browser and Cookie settings in the footer reopens it. When the
 * statistics are switched off on our side this renders nothing at all.
 */
export function CookieBanner({
  t,
  analytics,
}: {
  t: Dictionary['cookies'];
  analytics: { enabled: boolean; src: string; domain: string };
}) {
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!analytics.enabled) return;
    // Read once the page is up: the server cannot know what this browser chose
    const timer = setTimeout(() => {
      const saved = localStorage.getItem(KEY);
      if (saved === 'yes' || saved === 'no') setChoice(saved);
      else setOpen(true);
    });
    const reopen = () => setOpen(true);
    addEventListener(OPEN_COOKIES, reopen);
    return () => {
      clearTimeout(timer);
      removeEventListener(OPEN_COOKIES, reopen);
    };
  }, [analytics.enabled]);

  if (!analytics.enabled) return null;
  const decide = (value: 'yes' | 'no') => {
    localStorage.setItem(KEY, value);
    setChoice(value);
    setOpen(false);
  };
  return (
    <>
      {choice === 'yes' && (
        <Script src={analytics.src} data-domain={analytics.domain} strategy="afterInteractive" />
      )}
      {open && (
        <section aria-label={t.label} className="cookie-banner panel">
          <p>{t.text}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => decide('no')}>
              {t.reject}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => decide('yes')}>
              {t.accept}
            </button>
          </div>
        </section>
      )}
    </>
  );
}

/** "Cookie settings" in the footer: only where there is a choice to make. */
export function CookieSettingsButton({ label, enabled }: { label: string; enabled: boolean }) {
  if (!enabled) return null;
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center hover:text-accent-text"
      onClick={() => dispatchEvent(new Event(OPEN_COOKIES))}
    >
      {label}
    </button>
  );
}
