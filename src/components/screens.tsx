import { existsSync } from 'node:fs';
import { join } from 'node:path';

import Image from 'next/image';

import type { Dictionary, Locale } from '@/i18n';

const SLOTS = ['calendar', 'whiteboard', 'squad'] as const;
const EXTENSIONS = ['webp', 'png', 'jpg'];

/** "calendar.ar.png" wins on the Arabic page, "calendar.png" is used for both. */
function findScreen(slot: string, locale: Locale): string | null {
  for (const name of [`${slot}.${locale}`, slot]) {
    for (const extension of EXTENSIONS) {
      const file = `${name}.${extension}`;
      if (existsSync(join(process.cwd(), 'public', 'screens', file))) return `/screens/${file}`;
    }
  }
  return null;
}

const SKETCHES: Record<(typeof SLOTS)[number], string> = {
  calendar:
    'M20 70H200 M20 115H200 M20 160H200 M20 205H200 M20 250H200 M20 70V250 M56 70V250 M92 70V250 M128 70V250 M164 70V250 M200 70V250 M20 290H200V330H20Z M20 345H200V385H20Z',
  whiteboard:
    'M20 60H200V400H20Z M20 230H200 M80 230a30 30 0 1 0 60 0a30 30 0 1 0-60 0 M65 60V105H155V60 M65 400V355H155V400 M50 320Q70 260 150 275 M140 268L150 275L142 284 M160 160l14 14 M174 160l-14 14 M92 150l14 14 M106 150l-14 14',
  squad:
    'M24 60H104V170H24Z M116 60H196V170H116Z M24 185H104V295H24Z M116 185H196V295H116Z M24 310H104V420H24Z M116 310H196V420H116Z M64 80a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M156 80a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M64 205a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M156 205a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M64 330a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M156 330a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M40 145H88 M132 145H180 M40 270H88 M132 270H180 M40 395H88 M132 395H180',
};

export function Screens({ t, locale }: { t: Dictionary['features']['screens']; locale: Locale }) {
  return (
    <div className="mt-24">
      <h3 className="display h3">{t.title}</h3>
      <ul className="mt-8 grid gap-10 sm:grid-cols-3">
        {SLOTS.map((slot) => {
          const src = findScreen(slot, locale);
          return (
            <li key={slot} className="reveal">
              <figure className="mx-auto max-w-64">
                <div className="relative aspect-[220/460] overflow-hidden rounded-[2rem] border-2 border-edge bg-soft">
                  {src ? (
                    <Image src={src} alt={t[slot]} fill sizes="16rem" className="object-cover" />
                  ) : (
                    <svg
                      viewBox="0 0 220 460"
                      className="size-full"
                      fill="none"
                      stroke="var(--edge)"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M85 24H135" strokeWidth="5" strokeLinecap="round" />
                      <path d={SKETCHES[slot]} />
                    </svg>
                  )}
                </div>
                <figcaption className="mt-4 text-center">
                  <span className="font-semibold">{t[slot]}</span>
                  {!src && <span className="block text-sm text-muted">{t.soon}</span>}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
