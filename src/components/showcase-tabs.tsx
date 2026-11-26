'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import type { Dictionary } from '@/i18n';

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
  highlight: boolean;
};
type View = { id: string; label: string; slides: Slide[] };
type Controls = Dictionary['showcase']['controls'];

/** Coach view | Player view. Without JavaScript both carousels are simply on the page. */
export function ShowcaseTabs({ views, t }: { views: View[]; t: Controls }) {
  const [active, setActive] = useState(0);
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
          <Carousel view={view} t={t} />
        </div>
      ))}
    </>
  );
}

function Carousel({ view, t }: { view: View; t: Controls }) {
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
              {/* A soft orange light behind it, so it floats off the panel */}
              <span
                className="phone-glow"
                data-strong={slide.highlight || undefined}
                aria-hidden="true"
              />
              <TiltedCard className="phone-tilt">
                <div className="phone" data-highlight={slide.highlight || undefined}>
                  <div className="phone-screen">
                    {slide.src ? (
                      <Image
                        src={slide.src}
                        alt={slide.alt ?? slide.title}
                        width={288}
                        height={624}
                        sizes="(min-width: 64rem) 288px, 256px"
                        className="size-full object-cover"
                      />
                    ) : (
                      <svg
                        viewBox="0 20 220 440"
                        className="size-full bg-soft"
                        fill="none"
                        stroke="var(--edge)"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path
                          d={slide.sketch!}
                          stroke={slide.highlight ? 'var(--accent)' : undefined}
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </TiltedCard>
              <figcaption className="mx-auto mt-5 max-w-72 text-center">
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
