import { appShots } from '@/config/app-shots';
import { features, type FeatureId } from '@/config/features.config';
import { site } from '@/config/site';
import { getDictionary, localePath, type Locale } from '@/i18n';
import { publicFile } from '@/lib/public-file';
import { turnstileSiteKey } from '@/lib/turnstile';

import { CoachPhotos, MatchRequestPhones, PlayersPhoto } from './community-extras';
import { FaqAccordion } from './faq-accordion';
import { FaqPlay } from './faq-play';
import { CtaSplit } from './cta-split';
import { FeatureCardFace } from './feature-card-face';
import { FeatureCarousel } from './feature-carousel';
import { FeatureIcon } from './feature-icon';
import { HeroDrill } from './hero-drill';
import { PanelLines } from './pitch-lines';
import { PreRegisterForm } from './pre-register-form';
import { RunningLine } from './running-line';
import { spotlightStops } from './react-bits/spotlight-card';
import { WalkCanvas, WalkDim, WalkGap, WalkGround, WalkGroup } from './journey-walk';
import { WalkIntro } from './walk-intro';
import { WhyCards } from './why-cards';
import { Showcase } from './showcase';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { TacticsSection } from './tactics-section';

/** A walk from the locker room (top) to the pitch (end), with the sections as panels in front. */
export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const rtl = locale === 'ar';
  /** What each feature's photo shows, where it has one. */
  const photos: Partial<Record<string, { title: string; photo?: string; detail?: string }>> =
    t.features.items;
  const cards = features.map(({ id, released }) => {
    // The app's own screens, with demo data (src/config/app-shots.ts)
    const shot = appShots[id] ?? null;
    return {
      id,
      title: t.features.items[id].title,
      benefit: t.features.items[id].benefit,
      bullets: t.features.items[id].bullets,
      alt: photos[id]?.photo ?? '',
      src: shot?.face?.src ?? publicFile('features', id),
      shot,
      // The dialog's bigger picture, where it is a photo: the card's own
      detail: publicFile('features', id),
      detailAlt: photos[id]?.detail ?? photos[id]?.photo ?? '',
      soon: released ? null : t.features.soon,
      // App screens with sample data say so, outside the picture; the report says it is the PDF
      example: shot ? t.features.example : null,
      caption: shot?.frame === 'paper' ? t.features.report : null,
      inEnglish: shot ? t.features.inEnglish || null : null,
    };
  });

  return (
    <>
      {/* A first visit's intro while the walk loads (src/motion/walk-gate.ts) */}
      <WalkIntro t={t.hero.gate} />
      <SiteHeader locale={locale} path="/" />
      <main id="main" className="relative overflow-x-clip">
        <WalkGround />
        <WalkCanvas />
        <WalkDim />
        <RunningLine />
        <p className="scroll-cue" aria-hidden="true">
          {t.hero.scroll}
          <svg viewBox="0 0 24 24" className="size-4">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </p>
        <WalkGroup scene="locker">
          <section className="walk-hero">
            <div className="wrap">
              <div className="panel grid items-center gap-x-12 gap-y-14 lg:grid-cols-[1.5fr_1fr]">
                <PanelLines />
                <div>
                  <h1 className="display h1">
                    {t.hero.title[0]}{' '}
                    <span className="block">
                      {t.hero.title[1]}{' '}
                      <span className="relative inline-block text-accent">
                        {t.hero.title[2]}
                        {/* A chalk stroke under one word */}
                        <svg
                          className="underline-draw absolute inset-x-0 top-full -mt-[0.06em] h-[0.12em] w-full overflow-visible rtl:mt-[0.14em]"
                          viewBox="0 0 100 10"
                          preserveAspectRatio="none"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M1 7Q40 1 99 4"
                            stroke="var(--accent)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </span>
                    </span>
                  </h1>
                  <p className="mt-10 max-w-xl text-xl font-semibold">{t.hero.lead}</p>
                  <p className="mt-3 max-w-xl text-lg text-muted">{t.hero.sub}</p>
                  <div className="mt-9 flex flex-wrap gap-3">
                    <a className="btn btn-primary" href="#pre-register">
                      {t.nav.preRegister}
                    </a>
                    {site.communityUrl && (
                      <a
                        className="btn btn-ghost"
                        href={site.communityUrl}
                        target="_blank"
                        rel="noopener"
                      >
                        {t.hero.join}
                        <span className="sr-only"> {t.a11y.newTab}</span>
                      </a>
                    )}
                  </div>
                </div>
                <div className="hero-parallax mx-auto w-full max-w-[23.75rem]">
                  <HeroDrill locale={locale} />
                </div>
              </div>
            </div>
          </section>

          <WalkGap n={0} rtl={rtl} />
          <section className="section" aria-labelledby="why-title">
            <div className="wrap">
              <div className="panel relative overflow-clip">
                <PanelLines />

                <p data-reveal className="kicker">
                  {t.why.kicker}
                </p>
                <h2 data-reveal id="why-title" className="display h2">
                  {t.why.title}
                </h2>
                <ul className="mt-14 grid items-start gap-5 md:grid-cols-3" style={spotlightStops}>
                  <WhyCards t={t.why} />
                </ul>
              </div>
            </div>
          </section>

          <WalkGap n={1} rtl={rtl} />
        </WalkGroup>
        <WalkGroup scene="tunnel">
          <section id="features" className="section" aria-labelledby="features-title">
            <div className="wrap">
              <div className="panel">
                <PanelLines />
                <div className="grid items-end gap-6 lg:grid-cols-2">
                  <div>
                    <p data-reveal className="kicker">
                      {t.features.kicker}
                    </p>
                    <h2 data-reveal id="features-title" className="display h2">
                      {t.features.title}
                    </h2>
                  </div>
                  <p data-reveal className="max-w-lg text-muted lg:justify-self-end">
                    {t.features.note}
                  </p>
                </div>
                <FeatureCarousel
                  cards={cards}
                  faces={cards.map((c) => (
                    <FeatureCardFace
                      key={c.id}
                      c={c}
                      icon={<FeatureIcon id={c.id as FeatureId} />}
                      more={t.features.controls.more}
                    />
                  ))}
                  t={t.features.controls}
                  label={t.features.controls.label}
                  preRegister="#pre-register"
                />
              </div>
            </div>
          </section>

          <WalkGap n={2} rtl={rtl} />
          <Showcase locale={locale} />

          <WalkGap n={3} rtl={rtl} />
          <TacticsSection locale={locale} />

          <WalkGap n={4} rtl={rtl} />
        </WalkGroup>
        <WalkGroup scene="pitch">
          <section id="community" className="section" aria-labelledby="community-title">
            <div className="wrap">
              <div className="panel relative grid gap-16 overflow-clip lg:grid-cols-2">
                <PanelLines />

                <div>
                  <p data-reveal className="kicker">
                    {t.community.kicker}
                  </p>
                  <h2 data-reveal id="community-title" className="display h2">
                    {t.community.title}
                  </h2>
                  <p data-reveal className="mt-7 max-w-xl text-lg text-muted">
                    {t.community.text}
                  </p>
                  <CoachPhotos t={t.community} />
                  <CtaSplit
                    className="mt-9"
                    title={t.community.cta.title}
                    text={t.community.cta.text}
                    action={
                      <a className="btn btn-dark" href="#pre-register">
                        {t.nav.preRegister}
                      </a>
                    }
                  />
                  <PlayersPhoto alt={t.community.players} />
                </div>
                <div>
                  <MatchRequestPhones t={t.community} inEnglish={t.features.inEnglish} />
                  <h3 data-reveal className="mt-12 text-lg font-semibold">
                    {t.community.stepsTitle}
                  </h3>
                  <ol className="mt-6">
                    {t.community.steps.map((step, i) => (
                      <li
                        key={step.title}
                        data-reveal="step"
                        className="relative flex gap-6 pb-10 last:pb-0"
                      >
                        {i < t.community.steps.length - 1 && (
                          <span
                            data-connector
                            aria-hidden="true"
                            className="absolute inset-s-[1.7rem] top-14 bottom-0 origin-top border-s-2 border-dashed border-accent"
                          />
                        )}
                        <span
                          data-number
                          aria-hidden="true"
                          className="display grid size-14 shrink-0 place-items-center rounded-full bg-brand-orange text-3xl text-brand-black"
                        >
                          {i + 1}
                        </span>
                        <div className="pt-1.5">
                          <h4 className="display h3">{step.title}</h4>
                          <p className="mt-2 text-muted">{step.text}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>
          <WalkGap n={5} rtl={rtl} />
          <section id="faq" className="section" aria-labelledby="faq-title">
            <div className="wrap">
              <div className="panel grid gap-12 lg:grid-cols-[1fr_1.6fr]">
                <PanelLines />
                <div>
                  <p data-reveal className="kicker">
                    {t.faq.kicker}
                  </p>
                  <h2 data-reveal id="faq-title" className="display h2">
                    {t.faq.title}
                  </h2>
                  <FaqPlay />
                </div>
                <FaqAccordion items={t.faq.items} privacyHref={localePath(locale, '/privacy')} />
              </div>
            </div>
          </section>

          <WalkGap n={6} rtl={rtl} />
          <section id="pre-register" className="section" aria-labelledby="form-title">
            <div className="wrap">
              <div data-reveal className="form-card panel mx-auto max-w-3xl">
                <PanelLines />
                <div className="mb-6">
                  <p data-reveal className="kicker">
                    {t.form.kicker}
                  </p>
                  <h2 data-reveal id="form-title" className="display h2">
                    {t.form.title}
                  </h2>
                </div>
                <PreRegisterForm
                  t={t.form}
                  newTab={t.a11y.newTab}
                  locale={locale}
                  communityUrl={site.communityUrl}
                  shareUrl={site.url + localePath(locale)}
                  turnstileSiteKey={turnstileSiteKey()}
                />
              </div>
            </div>
          </section>
          <WalkGap n={7} rtl={rtl} />
        </WalkGroup>
      </main>
      <SiteFooter locale={locale} path="/" />
    </>
  );
}
