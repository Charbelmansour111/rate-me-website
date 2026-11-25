'use client';

import { useEffect, useRef, useState } from 'react';

import type { Dictionary } from '@/i18n';

export function FormSuccess({
  t,
  newTab,
  communityUrl,
  shareUrl,
}: {
  t: Dictionary['form']['success'];
  newTab: string;
  communityUrl: string;
  shareUrl: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [note, setNote] = useState('');
  useEffect(() => heading.current?.focus(), []);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Rate Me', text: t.shareText, url: shareUrl });
      } catch {
        // Closing the share sheet is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNote(t.copied);
    } catch {
      setNote(`${t.copyFailed} ${shareUrl}`);
    }
  }

  return (
    <div className="py-6">
      <svg
        viewBox="0 0 64 64"
        className="size-20 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <g className="success-ball">
          <circle cx="32" cy="36" r="24" />
          <path className="success-tick" d="M21 36l8 8 15-16" pathLength={1} />
        </g>
      </svg>
      <h3 ref={heading} tabIndex={-1} className="display h3 mt-5">
        {t.title}
      </h3>
      <p className="mt-3 text-lg">{t.text}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        {communityUrl && (
          <a className="btn btn-primary" href={communityUrl} target="_blank" rel="noopener">
            {t.join}
            <span className="sr-only"> {newTab}</span>
          </a>
        )}
        <button type="button" className="btn btn-ghost" onClick={share}>
          {t.share}
        </button>
      </div>
      <p role="status" className="mt-4 min-h-6 text-muted">
        {note}
      </p>
    </div>
  );
}
