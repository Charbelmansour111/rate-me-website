'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Remount it (change its key) to get a new token: each one works once. */
export function Turnstile({
  siteKey,
  locale,
  onToken,
}: {
  siteKey: string;
  locale: string;
  onToken: (token: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);

  const render = useCallback(() => {
    if (!box.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(box.current, {
      sitekey: siteKey,
      language: locale,
      theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
      callback: onToken,
      'expired-callback': () => onToken(''),
    });
  }, [siteKey, locale, onToken]);

  useEffect(() => {
    render();
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = undefined;
    };
  }, [render]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={render}
      />
      <div ref={box} className="min-h-[65px]" />
    </>
  );
}
