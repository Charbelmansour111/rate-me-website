'use client';

import { useEffect, useRef, useState } from 'react';

/** The headings the line stops at, in page order. */
const STOPS = [
  'why-title',
  'features-title',
  'inside-title',
  'tactics-title',
  'community-title',
  'faq-title',
  'form-title',
];

type Layout = { height: number; top: number; bottom: number; nodes: number[] };

/**
 * An orange line down the page's edge (the right edge in Arabic), outside the content, so you see
 * there is more below. A node at each section heading fills when you reach it and a ball rides
 * the tip; src/motion/chrome.ts draws it with the scroll. Without motion it is a still line with
 * every node filled. Absolutely placed, measured after load: nothing moves for it.
 */
export function RunningLine() {
  const box = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    const host = box.current!.parentElement!;
    const measure = () => {
      const origin = host.getBoundingClientRect().top;
      const nodes = STOPS.map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return Math.round(r.top - origin + Math.min(r.height, 48) / 2);
        });
      if (!nodes.length) return;
      setLayout({
        height: Math.round(host.scrollHeight),
        top: Math.max(0, nodes[0] - 400),
        bottom: nodes[nodes.length - 1],
        nodes,
      });
    };
    // Measured once the page is quiet, so it never adds to the load; then on every change. The
    // observer reports the first size at once.
    const observer = new ResizeObserver(measure);
    const start = () => observer.observe(host);
    // Safari has no idle callback
    const hasIdle = typeof requestIdleCallback === 'function';
    const idle = hasIdle
      ? requestIdleCallback(start, { timeout: 2000 })
      : window.setTimeout(start, 600);
    return () => {
      if (hasIdle) cancelIdleCallback(idle as number);
      else clearTimeout(idle);
      observer.disconnect();
    };
  }, []);

  // Tell the motion code the line was measured again (src/motion/chrome.ts)
  useEffect(() => {
    if (layout) box.current!.dispatchEvent(new Event('runline:layout'));
  }, [layout]);

  return (
    <div ref={box} className="run-line" data-run-line aria-hidden="true">
      {layout && (
        <svg
          width="16"
          height={layout.height}
          viewBox={`0 0 16 ${layout.height}`}
          data-top={layout.top}
          data-bottom={layout.bottom}
        >
          <path className="run-track" d={`M8 ${layout.top}V${layout.bottom}`} />
          <path className="run-fill" d={`M8 ${layout.top}V${layout.bottom}`} pathLength={1} />
          {layout.nodes.map((y) => (
            <circle key={y} className="run-node" cx="8" cy={y} r="5" data-y={y} />
          ))}
          <g className="run-ball" style={{ translate: `8px ${layout.bottom}px` }}>
            <circle r="6.5" />
            <path d="M0 -3.2L3 -1L1.9 2.6H-1.9L-3 -1Z" />
          </g>
        </svg>
      )}
    </div>
  );
}
