import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { features } from '@/config/features.config';
import { looks, screens, type Screen, type ScreenId, type ViewId } from '@/config/screens.config';
import { getDictionary, type Locale } from '@/i18n';

import { PanelLines } from './pitch-lines';
import { PlayerCard } from './player-card';
import { ShowcaseTabs, type Slide } from './showcase-tabs';

const EXTENSIONS = ['webp', 'png', 'jpg'];

/** "coach-home.ar.webp" wins on the Arabic page, "coach-home.webp" is used for both. */
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
  'whiteboard-roles':
    'M20 60H200V250H20Z M65 60V105H155V60 M70 160a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M150 140a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M110 200a12 12 0 1 1 0 24a12 12 0 0 1 0-24 M20 280H200 M38 310a16 16 0 1 1 0 32a16 16 0 0 1 0-32 M86 310a16 16 0 1 1 0 32a16 16 0 0 1 0-32 M134 310a16 16 0 1 1 0 32a16 16 0 0 1 0-32 M182 310a16 16 0 1 1 0 32a16 16 0 0 1 0-32 M20 380H200V420H20Z',
  formation:
    'M20 60H200V400H20Z M20 230H200 M80 230a30 30 0 1 0 60 0a30 30 0 1 0-60 0 M65 400V355H155V400 M110 372a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M45 300a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M88 310a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M132 310a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M175 300a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M60 200a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M110 221a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M160 200a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M50 110a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M110 90a9 9 0 1 1 0 18a9 9 0 0 1 0-18 M170 110a9 9 0 1 1 0 18a9 9 0 0 1 0-18',
  squad: cards,
  event:
    'M20 60H200V150H20Z M36 84H130 M36 106H170 M36 128H100 M20 172H104V206H20Z M116 172H200V206H116Z M20 232H110 M20 258H200 M20 284H200 M20 310H160 M20 340H200V400H20Z',
  card: 'M40 70H180V300L110 340L40 300Z M110 100a34 34 0 1 1 0 68a34 34 0 0 1 0-68 M70 200H150 M64 232h34 M64 258h34 M122 232h34 M122 258h34 M20 370H200 M20 400H150',
  match:
    'M20 60H200V130H20Z M36 84H130 M36 106H100 M20 150H200V330H20Z M36 172H120 M36 194H150 M36 220H184V280H36Z M36 296H184V318H36Z M60 350H100 M130 350H170',
};

export function Showcase({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const isReleased = ({ feature }: Screen) =>
    !feature || features.find(({ id }) => id === feature)!.released;

  const views = (Object.keys(screens) as ViewId[]).map((view) => ({
    id: view,
    label: t.showcase.views[view],
    slides: screens[view].map((screen, i): Slide => {
      const captions: Partial<Record<ScreenId, { title: string; text: string; alt?: string }>> =
        t.showcase.captions[view];
      const caption = captions[screen.id]!;
      const details: Partial<Record<ScreenId, readonly string[]>> = t.showcase.details[view];
      const src = screen.kind === 'card' ? null : findScreen(view, screen.id, locale);
      return {
        id: screen.id,
        ...caption,
        src,
        sketch: src || screen.kind === 'card' ? null : SKETCHES[screen.id],
        soon: isReleased(screen) ? null : t.features.soon,
        look: looks[i % looks.length],
        tab:
          src && screen.tab
            ? { role: view, active: screen.tab, lang: src.includes('.ar.') ? 'ar' : 'en' }
            : null,
        dark: !!screen.dark,
        card: screen.kind === 'card',
        details: details[screen.id] ?? null,
      };
    }),
  }));

  return (
    <section id="inside" className="section" aria-labelledby="inside-title">
      <div className="wrap">
        <div className="panel">
          <PanelLines />
          <p data-reveal className="kicker">
            {t.showcase.kicker}
          </p>
          <h2 data-reveal id="inside-title" className="display h2">
            {t.showcase.title}
          </h2>
          <ShowcaseTabs
            views={views}
            t={t.showcase.controls}
            card={<PlayerCard t={t.showcase.playerCard} />}
            preRegister="#pre-register"
          />
          {t.features.inEnglish && <p className="showcase-lang">{t.features.inEnglish}</p>}
        </div>
      </div>
    </section>
  );
}
