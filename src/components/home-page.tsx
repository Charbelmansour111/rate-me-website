import { features } from '@/config/features.config';
import { site } from '@/config/site';
import { getDictionary, localePath, type Locale } from '@/i18n';
import { turnstileSiteKey } from '@/lib/turnstile';

import { FeatureIcon } from './feature-icon';
import { HeroDrill } from './hero-drill';
import { PreRegisterForm } from './pre-register-form';
import { Screens } from './screens';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** The page reads as a pitch from goal line to goal: markings continue from section to section. */
export function HomePage({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  return (
    <>
      <SiteHeader locale={locale} path="/" />
      <main id="main" className="overflow-x-clip">
        <section className="relative">
          <div className="wrap grid items-center gap-x-12 gap-y-14 pt-14 pb-20 lg:grid-cols-[1.2fr_1fr] lg:pt-20 lg:pb-28">
            <div>
              <h1 className="display h1">
                {t.hero.title[0]}{' '}
                <span className="block">
                  {t.hero.title[1]}{' '}
                  <span className="relative inline-block text-accent">
                    {t.hero.title[2]}
                    {/* A chalk stroke under one word */}
                    <svg
                      className="absolute inset-x-0 top-full -mt-[0.06em] h-[0.12em] w-full overflow-visible rtl:mt-[0.14em]"
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
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <HeroDrill t={t.hero.drill} />
            </div>
          </div>
        </section>

        <section className="section overflow-hidden bg-soft" aria-labelledby="why-title">
          {/* Corner markings, kept clear of the text */}
          <svg
            className="chalk top-0 right-0 hidden h-[60%] max-h-64 md:block rtl:right-auto rtl:left-0 rtl:-scale-x-100"
            viewBox="0 0 320 320"
            aria-hidden="true"
          >
            <circle cx="320" cy="0" r="290" />
            <path className="hint" d="M320 0L115 205" />
            <circle className="hint" cx="320" cy="0" r="60" />
          </svg>
          <div className="wrap relative">
            <p className="kicker">{t.why.kicker}</p>
            <h2 id="why-title" className="display h2">
              {t.why.title}
            </h2>
            <ul className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
              {t.why.items.map((item) => (
                <li key={item.title} className="reveal border-t-3 border-accent pt-5">
                  <h3 className="display h3">{item.title}</h3>
                  <p className="mt-3 text-lg text-muted">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="features" className="section" aria-labelledby="features-title">
          <div className="wrap">
            <div className="grid items-end gap-6 lg:grid-cols-2">
              <div>
                <p className="kicker">{t.features.kicker}</p>
                <h2 id="features-title" className="display h2">
                  {t.features.title}
                </h2>
              </div>
              <p className="max-w-lg text-muted lg:justify-self-end">{t.features.note}</p>
            </div>
            <ul className="mt-14 grid border-s border-t border-line sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ id, released }) => (
                <li key={id} className="border-e border-b border-line p-7 sm:p-9">
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
            <Screens t={t.features.screens} locale={locale} />
          </div>
        </section>

        <section
          id="community"
          className="inverse section overflow-hidden"
          aria-labelledby="community-title"
        >
          {/* Corner arcs */}
          <svg
            className="chalk top-0 left-0 hidden w-40 md:block"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <path d="M0 80A80 80 0 0 0 80 0" />
          </svg>
          <svg
            className="chalk top-0 right-0 hidden w-40 md:block"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <path className="hint" d="M20 0A80 80 0 0 0 100 80" />
          </svg>
          <div className="wrap relative grid gap-16 lg:grid-cols-2">
            <div>
              <p className="kicker">{t.community.kicker}</p>
              <h2 id="community-title" className="display h2">
                {t.community.title}
              </h2>
              <p className="mt-7 max-w-xl text-lg text-muted">{t.community.text}</p>
              <a className="btn btn-primary mt-8" href="#pre-register">
                {t.nav.preRegister}
              </a>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t.community.stepsTitle}</h3>
              <ol className="mt-6">
                {t.community.steps.map((step, i) => (
                  <li
                    key={step.title}
                    className="relative flex gap-6 pb-10 not-last:before:absolute not-last:before:inset-s-[1.7rem] not-last:before:top-14 not-last:before:bottom-0 not-last:before:border-s-2 not-last:before:border-dashed not-last:before:border-accent last:pb-0"
                  >
                    <span
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
        </section>

        <section id="faq" className="section" aria-labelledby="faq-title">
          <div className="wrap grid gap-12 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className="kicker">{t.faq.kicker}</p>
              <h2 id="faq-title" className="display h2">
                {t.faq.title}
              </h2>
            </div>
            <div className="border-t border-line">
              {t.faq.items.map((item) => (
                <details key={item.q} className="group border-b border-line">
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
                        <a className="link" href={localePath(locale, '/privacy')}>
                          {item.privacyLink}
                        </a>
                      </>
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pre-register"
          className="section overflow-hidden bg-softer"
          aria-labelledby="form-title"
        >
          {/* The box: this is where it ends up */}
          <svg
            className="chalk bottom-0 left-1/2 w-[86rem] max-w-none -translate-x-1/2"
            viewBox="0 0 860 420"
            aria-hidden="true"
          >
            <path d="M20 420V60H840V420" />
            <path className="hint" d="M200 420V250H660V420" />
          </svg>
          <div className="wrap relative">
            <div>
              <p className="kicker justify-center">{t.form.kicker}</p>
              <h2 id="form-title" className="display h2 text-center">
                {t.form.title}
              </h2>
            </div>
            <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-line bg-page p-6 sm:p-10">
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
      </main>
      <SiteFooter locale={locale} path="/" />
    </>
  );
}
