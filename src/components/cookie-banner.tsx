'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

import type { Dictionary } from '@/i18n';

const KEY = 'analytics-consent';
/** Sent by the footer's "Cookie settings" to show the choice again. */
export const OPEN_COOKIES = 'rateme:cookies';

/** After the first paint, when the page is quiet, and never over the first visit's intro. */
function whenClear(show: () => void) {
  let observer: MutationObserver | undefined;
  const root = document.documentElement;
  const check = () => {
    if (root.dataset.walkGate === 'open') return false;
    observer?.disconnect();
    show();
    return true;
  };
  const start = () => {
    if (check()) return;
    observer = new MutationObserver(check);
    observer.observe(root, { attributes: true, attributeFilter: ['data-walk-gate'] });
  };
  const hasIdle = typeof requestIdleCallback === 'function';
  const idle = hasIdle
    ? requestIdleCallback(start, { timeout: 2500 })
    : window.setTimeout(start, 800);
  return () => {
    if (hasIdle) cancelIdleCallback(idle as number);
    else clearTimeout(idle);
    observer?.disconnect();
  };
}

/**
 * The cookie choice (WEBSITE 25): a small bar at the bottom, on a first visit, once the page has
 * painted and any intro has gone. The site keeps only what it needs in the browser (the theme
 * chosen, the walk's pictures so it loads fast, this choice); the one optional thing is visitor
 * statistics (cookie-free, src/config/site.ts: analytics), which run only after Accept, and only
 * where they are switched on. "Essential only" and "Accept" are the same size and weight; the
 * choice is kept in the browser, and Cookie settings in the footer opens it again.
 */
export function CookieBanner({
  t,
  analytics,
  privacyHref,
}: {
  t: Dictionary['cookies'];
  analytics: { enabled: boolean; src: string; domain: string };
  privacyHref: string;
}) {
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Read once the page is up: the server cannot know what this browser chose
    const stop = whenClear(() => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(KEY);
      } catch {
        // Storage off: asked each visit, nothing optional runs
      }
      if (saved === 'yes' || saved === 'no') setChoice(saved);
      else setOpen(true);
    });
    const reopen = () => setOpen(true);
    addEventListener(OPEN_COOKIES, reopen);
    return () => {
      stop();
      removeEventListener(OPEN_COOKIES, reopen);
    };
  }, []);

  const decide = (value: 'yes' | 'no') => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // Kept for this page only
    }
    setChoice(value);
    setOpen(false);
  };
  return (
    <>
      {analytics.enabled && choice === 'yes' && (
        <Script src={analytics.src} data-domain={analytics.domain} strategy="afterInteractive" />
      )}
      {open && (
        <section aria-label={t.label} className="cookie-banner">
          <p className="cookie-text">
            {t.text}{' '}
            <a href={privacyHref} className="cookie-link">
              {t.privacy}
            </a>
          </p>
          <div className="cookie-actions">
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

/** "Cookie settings" in the footer: the choice, again. */
export function CookieSettingsButton({ label }: { label: string }) {
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
