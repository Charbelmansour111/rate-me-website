import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { features } from '@/config/features.config';
import { screens, type Screen, type ScreenId, type ViewId } from '@/config/screens.config';
import { getDictionary, type Locale } from '@/i18n';

import { ShowcaseTabs, type Slide } from './showcase-tabs';

const EXTENSIONS = ['webp', 'png', 'jpg'];

/** "coach-home.ar.png" wins on the Arabic page, "coach-home.png" is used for both. */
function findScreen(view: ViewId, id: ScreenId, locale: Locale): string | null {
  for (const name of [`${view}-${id}.${locale}`, `${view}-${id}`]) {
    for (const extension of EXTENSIONS) {
      const file = `${name}.${extension}`;
      if (existsSync(join(process.cwd(), 'public', 'screens', file))) return `/screens/${file}`;
    }
  }
  return null;
}

const cards = [60, 185, 310]
  .flatMap((y) => [24, 116].map((x) => ({ x, y })))
  .map(
    ({ x, y }) =>
      `M${x} ${y}h80v110h-80Z M${x + 40} ${y + 20}a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M${x + 16} ${y + 85}h48`,
  )
  .join(' ');
const SKETCHES: Record<ScreenId, string> = {
  home: 'M20 60H140 M20 84H100 M20 110H200V210H20Z M36 130H120 M36 150H160 M36 180H90 M20 230H104V310H20Z M116 230H200V310H116Z M20 330H200V374H20Z M20 390H200V434H20Z',
  calendar:
    'M20 70H200 M20 115H200 M20 160H200 M20 205H200 M20 250H200 M20 70V250 M56 70V250 M92 70V250 M128 70V250 M164 70V250 M200 70V250 M20 290H200V330H20Z M20 345H200V385H20Z',
  whiteboard:
    'M20 60H200V400H20Z M20 230H200 M80 230a30 30 0 1 0 60 0a30 30 0 1 0-60 0 M65 60V105H155V60 M65 400V355H155V400 M50 320Q70 260 150 275 M140 268L150 275L142 284 M160 160l14 14 M174 160l-14 14 M92 150l14 14 M106 150l-14 14',
  squad: cards,
  event:
    'M20 60H200V150H20Z M36 84H130 M36 106H170 M36 128H100 M20 172H104V206H20Z M116 172H200V206H116Z M20 232H110 M20 258H200 M20 284H200 M20 310H160 M20 340H200V400H20Z',
  card: 'M40 70H180V300L110 340L40 300Z M110 100a34 34 0 1 1 0 68a34 34 0 0 1 0-68 M70 200H150 M64 232h34 M64 258h34 M122 232h34 M122 258h34 M20 370H200 M20 400H150',
  channel:
    'M20 60H120 M20 90H140V140H32L20 152Z M80 170H200V232L188 220H80Z M20 250H150V300H32L20 312Z M96 330H200V388L188 376H96Z M20 410H160V440H20Z M176 412h24v26h-24Z',
};

export function Showcase({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const isReleased = ({ feature, released = true }: Screen) =>
    released && (!feature || features.find(({ id }) => id === feature)!.released);

  const views = (Object.keys(screens) as ViewId[]).map((view) => ({
    id: view,
    label: t.showcase.views[view],
    slides: screens[view].map((screen): Slide => {
      const captions: Partial<Record<ScreenId, { title: string; text: string }>> =
        t.showcase.captions[view];
      const caption = captions[screen.id]!;
      const src = findScreen(view, screen.id, locale);
      return {
        id: screen.id,
        ...caption,
        src,
        sketch: src ? null : SKETCHES[screen.id],
        soon: isReleased(screen) ? null : t.features.soon,
        highlight: Boolean(screen.highlight),
      };
    }),
  }));

  return (
    <section id="inside" className="section" aria-labelledby="inside-title">
      <div className="wrap">
        <div className="panel">
          <p data-reveal className="kicker">
            {t.showcase.kicker}
          </p>
          <h2 data-reveal id="inside-title" className="display h2">
            {t.showcase.title}
          </h2>
          <ShowcaseTabs views={views} t={t.showcase.controls} />
        </div>
      </div>
    </section>
  );
}
