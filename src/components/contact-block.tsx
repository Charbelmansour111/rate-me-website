import { business } from '@/config/site';
import type { Dictionary } from '@/i18n';

/**
 * Who runs Rate Me and how to reach them (src/config/site.ts: business), in the footer and on the
 * privacy page. TODO- values are placeholders until the real details are filled in.
 */
export function ContactBlock({
  t,
  id,
  className = '',
}: {
  t: Dictionary['contactBlock'];
  /** Unique on the page: the footer and the privacy page both carry one. */
  id: string;
  className?: string;
}) {
  const real = (value: string) => !value.startsWith('TODO-');
  return (
    // Not a landmark: the privacy page carries two (its own, and the footer's)
    <div className={className}>
      <h2 id={id} className="font-semibold">
        {t.title}
      </h2>
      <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">{t.business}</dt>
        <dd>
          <bdi>{business.name}</bdi>
        </dd>
        <dt className="text-muted">{t.email}</dt>
        <dd>
          {real(business.email) ? (
            <a className="link inline-flex min-h-11 items-center" href={`mailto:${business.email}`}>
              <bdi>{business.email}</bdi>
            </a>
          ) : (
            <bdi>{business.email}</bdi>
          )}
        </dd>
        <dt className="text-muted">{t.place}</dt>
        <dd>
          <bdi>
            {business.city}, {business.country}
          </bdi>
        </dd>
        <dt className="text-muted">{t.phone}</dt>
        <dd>
          <bdi>{business.phone}</bdi>
        </dd>
      </dl>
    </div>
  );
}
