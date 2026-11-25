import { features } from '@/config/features.config';
import { site } from '@/config/site';
import { getDictionary, localePath, type Locale } from '@/i18n';
import { turnstileSiteKey } from '@/lib/turnstile';

import { FeatureIcon } from './feature-icon';
import { HeroDrill } from './hero-drill';
import { PreRegisterForm } from './pre-register-form';
import { WalkCanvas, WalkGap, WalkGroup } from './journey-walk';
import { Showcase } from './showcase';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { TacticsSection } from './tactics-section';

/** A walk from the locker room (top) to the pitch (end), with the sections as panels in front. */
export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <>
      <SiteHeader locale={locale} path="/" />
      <main id="main" className="overflow-x-clip">
        <WalkCanvas />
        <WalkGroup scene="locker">
          <section className="walk-hero">
            <div className="wrap">
              <div className="panel grid items-center gap-x-12 gap-y-14 lg:grid-cols-[1.5fr_1fr]">
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

          <WalkGap scene="locker" locale={locale} />
          <section className="section" aria-labelledby="why-title">
            <div className="wrap">
              <div className="panel relative overflow-clip">
                {/* Corner markings, kept clear of the text */}
                <svg
                  className="chalk top-0 right-0 hidden h-[40%] max-h-32 md:block rtl:right-auto rtl:left-0 rtl:-scale-x-100"
                  viewBox="0 0 320 320"
                  aria-hidden="true"
                >
                  <circle cx="320" cy="0" r="290" />
                  <path className="hint" d="M320 0L115 205" />
                  <circle className="hint" cx="320" cy="0" r="60" />
                </svg>

                <p data-reveal className="kicker">
                  {t.why.kicker}
                </p>
                <h2 data-reveal id="why-title" className="display h2">
                  {t.why.title}
                </h2>
                <ul className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
                  {t.why.items.map((item) => (
                    <li key={item.title} data-reveal className="border-t-3 border-accent pt-5">
                      <h3 className="display h3">{item.title}</h3>
                      <p className="mt-3 text-lg text-muted">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <WalkGap scene="locker" locale={locale} />
        </WalkGroup>
        <WalkGroup scene="tunnel">
          <section id="features" className="section" aria-labelledby="features-title">
            <div className="wrap">
              <div className="panel">
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
                <ul className="mt-14 grid border-s border-t border-line sm:grid-cols-2 lg:grid-cols-3">
                  {features.map(({ id, released }) => (
                    <li
                      key={id}
                      data-reveal
                      className="lift border-e border-b border-line bg-page p-7 sm:p-9"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <FeatureIcon id={id} />
                        {!released && (
                          <span className="rounded-full border-[1.5px] border-accent bg-tint px-3 py-0.5 text-sm font-semibold text-accent-text">
                            {t.features.soon}
                          </span>
                        )}
                      </div>
                      <h3 className="display h3 mt-7">{t.features.items[id].title}</h3>
                      <p className="mt-3 text-muted">{t.features.items[id].text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <WalkGap scene="tunnel" locale={locale} />
          <Showcase locale={locale} />

          <WalkGap scene="tunnel" locale={locale} />
          <TacticsSection locale={locale} />

          <WalkGap scene="tunnel" locale={locale} />
        </WalkGroup>
        <WalkGroup scene="pitch">
          <section id="community" className="section" aria-labelledby="community-title">
            <div className="wrap">
              <div className="panel inverse relative grid gap-16 overflow-clip lg:grid-cols-2">
                {/* Corner arcs */}
                <svg
                  className="chalk top-0 right-0 hidden w-40 md:block rtl:right-auto rtl:left-0 rtl:-scale-x-100"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <path className="hint" d="M20 0A80 80 0 0 0 100 80" />
                </svg>

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
                  <a data-reveal className="btn btn-primary mt-8" href="#pre-register">
                    {t.nav.preRegister}
                  </a>
                </div>
                <div>
                  <h3 data-reveal className="text-lg font-semibold">
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
                          className="display grid size-14 shrink-0 place-items-center rounded-full bg-accent text-3xl text-brand-black"
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
          <WalkGap scene="pitch" locale={locale} />
          <section id="faq" className="section" aria-labelledby="faq-title">
            <div className="wrap">
              <div className="panel grid gap-12 lg:grid-cols-[1fr_1.6fr]">
                <div>
                  <p data-reveal className="kicker">
                    {t.faq.kicker}
                  </p>
                  <h2 data-reveal id="faq-title" className="display h2">
                    {t.faq.title}
                  </h2>
                </div>
                <div className="faq border-t border-line">
                  {t.faq.items.map((item) => (
                    <details key={item.q} data-reveal="fade" className="group border-b border-line">
                      <summary className="flex list-none items-center justify-between gap-6 border-s-3 border-transparent py-5 text-lg font-semibold group-open:border-accent group-open:ps-4 hover:text-accent-text [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <svg
                          viewBox="0 0 24 24"
                          className="size-6 shrink-0 text-accent transition-transform group-open:rotate-45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <path d="M12 4v16M4 12h16" />
                        </svg>
                      </summary>
                      <p className="max-w-2xl pb-6 text-muted group-open:ps-4.75">
                        {item.a}
                        {item.privacyLink && (
                          <>
                            {' '}
                            <a
                              className="link inline-flex min-h-11 items-center"
                              href={localePath(locale, '/privacy')}
                            >
                              {item.privacyLink}
                            </a>
                          </>
                        )}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <WalkGap scene="pitch" locale={locale} />
          <section id="pre-register" className="section" aria-labelledby="form-title">
            <div className="wrap">
              <div data-reveal className="form-card panel mx-auto max-w-3xl">
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
          <WalkGap scene="pitch" locale={locale} />
        </WalkGroup>
      </main>
      <SiteFooter locale={locale} path="/" />
    </>
  );
}
