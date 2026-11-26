'use client';

import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';

type Item = { q: string; a: string; privacyLink?: string };

const never = () => () => {};

/**
 * Questions that open in place. Each question is a button with aria-expanded; arrows, Home and End
 * move between them. Without JavaScript every answer is simply open (see .faq-panel).
 */
export function FaqAccordion({ items, privacyHref }: { items: Item[]; privacyHref: string }) {
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());
  // Until the page runs, nothing is locked away: the answers may be all a visitor gets.
  const ready = useSyncExternalStore(
    never,
    () => true,
    () => false,
  );
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function toggle(i: number) {
    setOpen((was) => {
      const next = new Set(was);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  }
  function onKey(event: KeyboardEvent, i: number) {
    const last = items.length - 1;
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: last }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    buttons.current[(to + items.length) % items.length]?.focus();
  }

  return (
    <div className="faq border-t border-line">
      {items.map((item, i) => {
        const expanded = open.has(i);
        return (
          <div key={item.q} data-reveal="fade" data-open={expanded} className="faq-item">
            <h3>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={expanded}
                aria-controls={`faq-a-${i}`}
                onClick={() => toggle(i)}
                onKeyDown={(event) => onKey(event, i)}
                className="faq-button"
              >
                <span>{item.q}</span>
                <span className="faq-icon" aria-hidden="true" />
              </button>
            </h3>
            <div id={`faq-a-${i}`} className="faq-panel" inert={ready && !expanded}>
              <div className="overflow-hidden">
                <p className="max-w-2xl pb-6 text-muted">
                  {item.a}
                  {item.privacyLink && (
                    <>
                      {' '}
                      <a className="link inline-flex min-h-11 items-center" href={privacyHref}>
                        {item.privacyLink}
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
