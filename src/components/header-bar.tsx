'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { trapTab } from '@/lib/dialog';

/**
 * The header's own state, with no scroll handler: whether the page is at its top (see-through
 * bar) and, on the home page, which stage of the walk is under the bar (its colours). Once the
 * walk is scrubbed the stage colours come live from src/motion/stages.ts instead, and the orange
 * progress line is moved by GSAP (src/motion/chrome.ts); under reduced motion CSS moves it.
 */
export function HeaderBar({ onHome, children }: { onHome: boolean; children: ReactNode }) {
  const bar = useRef<HTMLElement>(null);
  const top = useRef<HTMLSpanElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [stage, setStage] = useState('locker');

  useEffect(() => {
    const seen = new IntersectionObserver(([entry]) => setAtTop(entry.isIntersecting));
    seen.observe(top.current!);
    if (!onHome) return () => seen.disconnect();
    // A thin line just under the bar: the part of the page it crosses is the one behind the bar
    const under = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setStage((entry.target as HTMLElement).dataset.stage!);
        }
      },
      { rootMargin: '-72px 0px -95% 0px' },
    );
    for (const group of document.querySelectorAll('.walk-group')) under.observe(group);
    return () => {
      seen.disconnect();
      under.disconnect();
    };
  }, [onHome]);

  return (
    <>
      <span ref={top} className="bar-sentinel" aria-hidden="true" />
      <header
        ref={bar}
        className="site-bar"
        data-home={onHome || undefined}
        data-stage={onHome ? stage : undefined}
        data-top={atTop || undefined}
      >
        <div className="site-bar-inner">
          {children}
          <span className="site-bar-progress" aria-hidden="true" />
        </div>
      </header>
    </>
  );
}

/** On a phone: a menu button and the navigation in a modal dialog. */
export function MenuDialog({
  open,
  close,
  label,
  children,
}: {
  open: string;
  close: string;
  label: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = dialog.current!;
    const closed = () => {
      setShown(false);
      button.current?.focus({ preventScroll: true });
    };
    el.addEventListener('close', closed);
    return () => el.removeEventListener('close', closed);
  }, []);

  return (
    <>
      <button
        ref={button}
        type="button"
        className="bar-menu-button"
        aria-haspopup="dialog"
        aria-expanded={shown}
        aria-controls="site-menu"
        onClick={() => {
          dialog.current!.showModal();
          setShown(true);
          dialog.current!.querySelector<HTMLElement>('.menu-close')?.focus();
        }}
      >
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">{open}</span>
      </button>
      <dialog
        ref={dialog}
        id="site-menu"
        className="menu-dialog panel"
        aria-label={label}
        onKeyDown={(event) => trapTab(event, dialog.current)}
        onClick={(event) => {
          // A link or the dim ground closes it; a link then goes where it points
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.closest('a')) dialog.current!.close();
        }}
      >
        <button
          type="button"
          className="menu-close"
          aria-label={close}
          onClick={() => dialog.current!.close()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {shown && <div className="menu-body">{children}</div>}
      </dialog>
    </>
  );
}
