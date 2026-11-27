'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import type { Dictionary } from '@/i18n';
import { trapTab } from '@/lib/dialog';

export type FeatureCard = {
  id: string;
  title: string;
  benefit: string;
  bullets: readonly string[];
  /** What the photo shows. */
  alt: string;
  src: string | null;
  soon: string | null;
};
type Controls = Dictionary['features']['controls'];

const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key]));

/**
 * "What you get" as a carousel: three cards a view on a computer, one and a half on a phone. It
 * scrolls sideways and snaps (swipe, or drag with a mouse), with arrows, dots and the arrow keys;
 * all mirror in Arabic. Each card is a button that opens its detail in a dialog (the same pattern
 * as the phones in "Inside the app": focus stays inside, Esc closes, focus returns to the card).
 * Without JavaScript it is a row you can scroll.
 */
export function FeatureCarousel({
  cards,
  faces,
  t,
  label,
  preRegister,
}: {
  cards: FeatureCard[];
  /** What each card shows, rendered on the server (src/components/feature-card-face.tsx). */
  faces: ReactNode[];
  t: Controls;
  label: string;
  preRegister: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [first, setFirst] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  /** The last card wholly in view: the dots fill up to it, the counter says it. */
  const [lastSeen, setLastSeen] = useState(0);
  const [opened, setOpened] = useState<{ card: FeatureCard; from: HTMLElement } | null>(null);
  const last = cards.length - 1;

  // Which cards are in view, and whether the row has reached its end: read from the scroll
  // position the browser already keeps, once a frame at most.
  useEffect(() => {
    const list = track.current!;
    let frame = 0;
    const read = () => {
      frame = 0;
      const slides = [...list.children] as HTMLElement[];
      const edge = list.getBoundingClientRect();
      const rtl = getComputedStyle(list).direction === 'rtl';
      const start = slides.findIndex((slide) => {
        const box = slide.getBoundingClientRect();
        return rtl ? box.right <= edge.right + 4 : box.left >= edge.left - 4;
      });
      const whole = slides.map((slide) => {
        const box = slide.getBoundingClientRect();
        return box.left >= edge.left - 4 && box.right <= edge.right + 4;
      });
      const end = Math.abs(list.scrollLeft) + list.clientWidth >= list.scrollWidth - 4;
      setFirst(Math.max(0, start));
      setAtEnd(end);
      // At the end the last card counts as seen even if a phone shows only most of it
      setLastSeen(end ? slides.length - 1 : Math.max(0, whole.lastIndexOf(true)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    list.addEventListener('scroll', onScroll, { passive: true });
    const resized = new ResizeObserver(onScroll);
    resized.observe(list);
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener('scroll', onScroll);
      resized.disconnect();
    };
  }, []);

  const show = useCallback(
    (index: number, focus = false) => {
      const list = track.current!;
      const slide = list.children[Math.max(0, Math.min(last, index))] as HTMLElement;
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const box = slide.getBoundingClientRect();
      const edge = list.getBoundingClientRect();
      const rtl = getComputedStyle(list).direction === 'rtl';
      list.scrollBy({
        left: rtl ? box.right - edge.right : box.left - edge.left,
        behavior: calm ? 'instant' : 'smooth',
      });
      if (focus)
        buttons.current[Math.max(0, Math.min(last, index))]?.focus({ preventScroll: true });
    },
    [last],
  );

  function onKey(event: KeyboardEvent) {
    const rtl = document.documentElement.dir === 'rtl';
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const at = buttons.current.findIndex((b) => b === document.activeElement);
    show((at < 0 ? first : at) + step, true);
  }

  // Dragging with a mouse (fingers and trackpads scroll it natively)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag.current = { x: event.clientX, left: track.current!.scrollLeft, moved: false };
  }
  function onPointerMove(event: PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      track.current!.dataset.dragging = '';
      track.current!.setPointerCapture(event.pointerId);
    }
    track.current!.scrollLeft = d.left - dx;
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    const list = track.current!;
    delete list.dataset.dragging;
    // Settle on the nearest card, and do not count the drag as a click on it
    show(first);
    const swallow = (e: Event) => e.stopPropagation();
    list.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => list.removeEventListener('click', swallow, { capture: true }), 0);
  }

  // At either end its arrow stays in the Tab order, dimmed and saying it does nothing (aria-disabled)
  const arrow = (direction: 1 | -1) => {
    const off = direction === 1 ? atEnd : first === 0 && !atEnd;
    return (
      <button
        type="button"
        aria-label={direction === 1 ? t.next : t.previous}
        aria-controls="feature-track"
        aria-disabled={off}
        onClick={() => {
          if (!off) show(first + direction);
        }}
        className="carousel-arrow"
      >
        <svg
          viewBox="0 0 24 24"
          className={`size-5 ${direction === 1 ? 'rtl:-scale-x-100' : '-scale-x-100 rtl:scale-x-100'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  };

  return (
    <div
      role="region"
      aria-roledescription={t.carousel}
      aria-label={label}
      className="feature-carousel"
    >
      <div
        ref={track}
        id="feature-track"
        className="feature-track"
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {cards.map((card, i) => (
          <div
            key={card.id}
            data-card-reveal
            className="feature-slide"
            role="group"
            aria-roledescription={t.slide}
            aria-label={fill(t.position, { n: i + 1, total: cards.length })}
          >
            {/* The card is a picture with words; a button over all of it opens it. Over it, not
                round it: its name is the title, its description the line under it. */}
            <div className="feature-card look-paper">
              {faces[i]}
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                className="feature-card-hit"
                aria-haspopup="dialog"
                aria-labelledby={`feature-${card.id}-title`}
                aria-describedby={`feature-${card.id}-benefit`}
                onClick={(event) => setOpened({ card, from: event.currentTarget })}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="carousel-controls">
        {arrow(-1)}
        {/* One dot a card: a button on a computer, a mark on a phone (too many 44px targets) */}
        <div className="carousel-dots" data-small aria-hidden="true">
          {cards.map((card, i) => (
            <span key={card.id} data-on={i <= lastSeen || undefined} />
          ))}
        </div>
        <div className="carousel-dots" data-large>
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              aria-label={fill(t.show, { title: card.title })}
              aria-current={i === first || undefined}
              aria-controls="feature-track"
              data-on={i <= lastSeen || undefined}
              onClick={() => show(i)}
            >
              <span />
            </button>
          ))}
        </div>
        {arrow(1)}
        {/* How far along: "4 of 7", "7 of 7" at the end */}
        <p className="carousel-count" data-count>
          {fill(t.position, { n: lastSeen + 1, total: cards.length })}
        </p>
      </div>
      <FeatureDialog
        opened={opened}
        t={t}
        preRegister={preRegister}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}

/** A feature in full: a bigger photo, three facts, Pre-register. */
function FeatureDialog({
  opened,
  t,
  preRegister,
  onClose,
}: {
  opened: { card: FeatureCard; from: HTMLElement } | null;
  t: Controls;
  preRegister: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current!;
    if (!opened) return;
    el.showModal();
    el.querySelector<HTMLElement>('.screen-dialog-close')?.focus();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const panel = el.querySelector<HTMLElement>('.feature-dialog-panel')!;
    const from = opened.from.getBoundingClientRect();
    const to = panel.getBoundingClientRect();
    let cancelled = false;
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return;
      gsap.fromTo(
        panel,
        {
          x: from.left + from.width / 2 - (to.left + to.width / 2),
          y: from.top + from.height / 2 - (to.top + to.height / 2),
          scale: Math.min(1, from.width / to.width),
          opacity: 0.4,
        },
        { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out', clearProps: 'all' },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [opened]);

  useEffect(() => {
    const el = dialog.current!;
    const closed = () => {
      const from = opened?.from;
      onClose();
      from?.focus({ preventScroll: true });
    };
    el.addEventListener('close', closed);
    return () => el.removeEventListener('close', closed);
  }, [opened, onClose]);

  const card = opened?.card;
  return (
    <dialog
      ref={dialog}
      className="screen-dialog feature-dialog"
      aria-labelledby="feature-dialog-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current!.close();
      }}
      onKeyDown={(event) => trapTab(event, dialog.current)}
    >
      {card && (
        <div className="feature-dialog-panel look-ink">
          <button
            type="button"
            className="screen-dialog-close"
            aria-label={t.close}
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
          <div className="feature-dialog-photo">
            {card.src && (
              <Image
                src={card.src}
                alt={card.alt}
                fill
                sizes="(min-width: 48rem) 26rem, 90vw"
                className="object-cover"
              />
            )}
          </div>
          <div className="feature-dialog-text">
            {card.soon && <span className="feature-soon static">{card.soon}</span>}
            <h3 id="feature-dialog-title" className="display h3 mt-3">
              {card.title}
            </h3>
            <p className="mt-3 text-lg">{card.benefit}</p>
            <ul className="screen-dialog-facts mt-6">
              {card.bullets.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <a
              href={preRegister}
              className="btn btn-primary mt-8"
              onClick={() => dialog.current!.close()}
            >
              {t.preRegister}
            </a>
          </div>
        </div>
      )}
    </dialog>
  );
}
