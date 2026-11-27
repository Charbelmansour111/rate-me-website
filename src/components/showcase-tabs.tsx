'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import type { Look } from '@/config/screens.config';
import type { Dictionary } from '@/i18n';

import { AppTabBar, type AppRole, type AppTab } from './app-tab-bar';
import { PhoneFrame } from './phone-frame';
import { TiltedCard } from './react-bits/tilted-card';

export type Slide = {
  id: string;
  title: string;
  text: string;
  /** What the picture shows, where the title does not say it all. */
  alt?: string;
  src: string | null;
  sketch: string | null;
  soon: string | null;
  /** The glow behind the phone: orange for the middle one. */
  look: Look;
  /** Drawn as the app's player card instead of a phone. */
  card: boolean;
  /** Three facts, shown when the phone is opened. */
  details: readonly string[] | null;
  /** The app's tab bar over the screenshot, where the app shows one. */
  tab: { role: AppRole; active: AppTab; lang: 'en' | 'ar' } | null;
  /** A dark status bar above the screen. */
  dark: boolean;
};
type View = { id: string; label: string; slides: Slide[] };
type Controls = Dictionary['showcase']['controls'];
type Opened = { view: View; slide: Slide; from: HTMLElement };

/** Coach view | Player view. Without JavaScript both carousels are simply on the page. */
export function ShowcaseTabs({
  views,
  t,
  card,
  preRegister,
}: {
  views: View[];
  t: Controls;
  /** The player card, rendered on the server: nothing of it runs here. */
  card: ReactNode;
  preRegister: string;
}) {
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState<Opened | null>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(event: KeyboardEvent) {
    const rtl = document.documentElement.dir === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    const step = event.key === forward ? 1 : event.key === back ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (active + step + views.length) % views.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <>
      {/* The chosen pill glides between them, and each leans to the mouse (src/motion). */}
      <div
        role="tablist"
        aria-label={t.views}
        data-glide
        className="showcase-tabs mt-8"
        onKeyDown={onKey}
      >
        {views.map((view, i) => (
          <button
            key={view.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            data-magnet
            role="tab"
            id={`tab-${view.id}`}
            aria-controls={`view-${view.id}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
          >
            {view.label}
          </button>
        ))}
      </div>
      {views.map((view, i) => (
        <div
          key={view.id}
          role="tabpanel"
          id={`view-${view.id}`}
          aria-labelledby={`tab-${view.id}`}
          data-active={i === active}
          className="showcase-view"
        >
          <Carousel
            view={view}
            t={t}
            card={card}
            onOpen={(slide, from) => setOpened({ view, slide, from })}
          />
        </div>
      ))}
      <ScreenDialog
        opened={opened}
        t={t}
        preRegister={preRegister}
        onClose={() => setOpened(null)}
      />
    </>
  );
}

/**
 * The screen in the site's one phone frame (phone-frame.tsx): the screenshot (or a sketch until
 * there is one), with the app's tab bar drawn over it where the app shows one.
 */
function PhoneScreen({ slide, large = false }: { slide: Slide; large?: boolean }) {
  return (
    <PhoneFrame dark={slide.dark}>
      {slide.src ? (
        <div className="phone-shot">
          <Image
            src={slide.src}
            alt={slide.alt ?? slide.title}
            width={780}
            height={1688}
            sizes={large ? '17rem' : '(min-width: 64rem) 21.25rem, 18rem'}
            className="block h-auto w-full"
          />
          {slide.tab && <AppTabBar {...slide.tab} />}
        </div>
      ) : (
        <svg
          viewBox="0 20 220 440"
          className="phone-sketch bg-soft"
          fill="none"
          stroke="var(--edge)"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d={slide.sketch!} />
        </svg>
      )}
    </PhoneFrame>
  );
}

function Carousel({
  view,
  t,
  card,
  onOpen,
}: {
  view: View;
  t: Controls;
  card: ReactNode;
  onOpen: (slide: Slide, from: HTMLElement) => void;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const last = view.slides.length - 1;

  useEffect(() => {
    const list = track.current!;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrent([...list.children].indexOf(entry.target));
        }
      },
      { root: list, rootMargin: '0px -49% 0px -49%' },
    );
    for (const slide of list.children) observer.observe(slide);
    return () => observer.disconnect();
  }, []);

  function show(index: number) {
    const list = track.current!;
    const slide = list.children[Math.max(0, Math.min(last, index))];
    const a = slide.getBoundingClientRect();
    const b = list.getBoundingClientRect();
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollBy({
      left: a.left + a.width / 2 - (b.left + b.width / 2),
      behavior: calm ? 'instant' : 'smooth',
    });
  }
  function onKey(event: KeyboardEvent) {
    // Arrows inside an open phone's button belong to the carousel too
    const rtl = document.documentElement.dir === 'rtl';
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    show(current + (rtl ? -step : step));
  }
  const arrow = (direction: 1 | -1, label: string) => (
    <button
      type="button"
      aria-label={label}
      disabled={direction === 1 ? current === last : current === 0}
      onClick={() => show(current + direction)}
      className="grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-text hover:border-accent hover:text-accent-text disabled:border-line disabled:text-edge"
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

  return (
    <div role="group" aria-roledescription={t.carousel} aria-label={view.label}>
      <ul
        ref={track}
        tabIndex={0}
        aria-label={t.slides}
        onKeyDown={onKey}
        className="showcase-track mt-6"
      >
        {view.slides.map((slide, i) => (
          <li key={slide.id} className="showcase-slide" data-current={i === current || undefined}>
            <figure data-parallax className="showcase-figure">
              {/* A soft light behind it, so it floats off the panel */}
              <span className="phone-glow" data-look={slide.look} aria-hidden="true" />
              {/* Its shadow on the ground under it: a gradient, nothing to repaint */}
              <span className="phone-ground" aria-hidden="true" />
              {slide.card ? (
                card
              ) : (
                <TiltedCard className="phone-tilt">
                  <PhoneScreen slide={slide} />
                  {/* A button over the whole phone opens what the screen does. Over it, not
                      round it: the phone's own words (the clock, the tabs) stay out of its name. */}
                  <button
                    type="button"
                    className="phone-button"
                    aria-haspopup="dialog"
                    aria-label={`${slide.title}: ${t.open}`}
                    onClick={(event) => onOpen(slide, event.currentTarget)}
                  />
                </TiltedCard>
              )}
              <figcaption className="mx-auto mt-5 max-w-80 text-center">
                <span className="text-lg font-semibold">{slide.title}</span>
                {slide.soon && (
                  <span className="mt-1 block">
                    <span className="rounded-full border-[1.5px] border-accent bg-tint px-3 py-0.5 text-sm font-semibold text-accent-text">
                      {slide.soon}
                    </span>
                  </span>
                )}
                <span className="mt-1 block text-base text-muted">{slide.text}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {/* On a computer all three stand side by side: nothing to turn. */}
      <div className="mt-4 flex items-center justify-center gap-4 lg:hidden">
        {arrow(-1, t.previous)}
        {/* Too many for 44px targets side by side on a phone: there they only show the place. */}
        <div className="flex gap-2 sm:hidden" aria-hidden="true">
          {view.slides.map((slide, i) => (
            <span
              key={slide.id}
              className={`size-2.5 rounded-full ${i === current ? 'bg-accent' : 'bg-edge'}`}
            />
          ))}
        </div>
        <div className="hidden sm:flex">
          {view.slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={slide.title}
              aria-current={i === current || undefined}
              onClick={() => show(i)}
              className="group grid size-11 place-items-center"
            >
              <span className="size-2.5 rounded-full bg-edge group-aria-current:bg-accent" />
            </button>
          ))}
        </div>
        {arrow(1, t.next)}
      </div>
    </div>
  );
}

/**
 * What a screen does: a modal dialog (focus stays inside, Esc closes, focus returns to the phone)
 * that grows out of the phone with GSAP, at once under reduced motion.
 */
function ScreenDialog({
  opened,
  t,
  preRegister,
  onClose,
}: {
  opened: Opened | null;
  t: Controls;
  preRegister: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialog.current!;
    if (!opened) return;
    el.showModal();
    // Focus starts on Close, not on the scrolling panel
    el.querySelector<HTMLElement>('.screen-dialog-close')?.focus();
    const panel = el.querySelector<HTMLElement>('.screen-dialog-panel')!;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // From the phone that was opened to the middle of the screen
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
    // Esc, the close button or the link: back to the phone it came from
    const closed = () => {
      const from = opened?.from;
      onClose();
      from?.focus({ preventScroll: true });
    };
    el.addEventListener('close', closed);
    return () => el.removeEventListener('close', closed);
  }, [opened, onClose]);

  const slide = opened?.slide;
  return (
    <dialog
      ref={dialog}
      className="screen-dialog"
      aria-labelledby="screen-dialog-title"
      // A click on the dim ground outside the panel closes it, as Esc does
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current!.close();
      }}
      // Tab goes round inside it, never out to the page or the browser
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const stops = [...dialog.current!.querySelectorAll<HTMLElement>('button, a[href]')];
        const first = stops[0];
        const last = stops[stops.length - 1];
        const at = document.activeElement;
        if (event.shiftKey && (at === first || !dialog.current!.contains(at))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (at === last || !dialog.current!.contains(at))) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      {slide && (
        <div className="screen-dialog-panel panel">
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
          <div className="screen-dialog-phone">
            <PhoneScreen slide={slide} large />
          </div>
          <div className="screen-dialog-text">
            <p className="kicker">{opened.view.label}</p>
            <h3 id="screen-dialog-title" className="display h3 mt-3">
              {slide.title}
            </h3>
            <p className="mt-3 text-muted">{slide.text}</p>
            {slide.details && (
              <ul className="screen-dialog-facts mt-6">
                {slide.details.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            )}
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
