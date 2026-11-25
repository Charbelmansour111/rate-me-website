'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

import { localePath, type Dictionary, type Locale } from '@/i18n';
import {
  FIELD_ORDER,
  LIMITS,
  ROLES,
  validateField,
  validateForm,
  type FieldErrors,
  type FieldName,
  type FormValues,
} from '@/lib/waitlist/fields';
import type { SignupResponse } from '@/lib/waitlist/handler';

import { Turnstile } from './turnstile';

const EMPTY: FormValues = {
  name: '',
  email: '',
  phone: '',
  role: '',
  city: '',
  club: '',
  consent: false,
};

type Props = {
  t: Dictionary['form'];
  newTab: string;
  locale: Locale;
  communityUrl: string;
  shareUrl: string;
  turnstileSiteKey: string;
};

export function PreRegisterForm({
  t,
  newTab,
  locale,
  communityUrl,
  shareUrl,
  turnstileSiteKey,
}: Props) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [token, setToken] = useState('');
  const [challenge, setChallenge] = useState(0);
  const [honeypot, setHoneypot] = useState('');
  const form = useRef<HTMLFormElement>(null);
  // React state is set after the first paint; until then the browser must not submit natively.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);

  if (status === 'done') {
    return (
      <Success t={t.success} newTab={newTab} communityUrl={communityUrl} shareUrl={shareUrl} />
    );
  }

  const set = (field: FieldName, value: string | boolean) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field is marked wrong, clear it as soon as it is right.
    if (errors[field]) setErrors({ ...errors, [field]: validateField(field, next) });
  };
  /** Leaving a field checks it, unless it was never filled in: submit catches that. */
  const blur = (field: FieldName) => {
    if (values[field]) setErrors((now) => ({ ...now, [field]: validateField(field, values) }));
  };
  const fail = (code: keyof Dictionary['form']['formErrors']) => {
    setFormError(t.formErrors[code]);
    setStatus('idle');
    setToken('');
    setChallenge((n) => n + 1);
  };
  const focusFirst = (found: FieldErrors) => {
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) form.current?.querySelector<HTMLElement>(`#f-${first}`)?.focus();
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (status === 'sending') return;
    const found = validateForm(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError(t.formErrors.invalid);
      focusFirst(found);
      return;
    }
    setFormError('');
    setStatus('sending');
    try {
      const response = await fetch('/api/pre-register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, locale, website: honeypot, turnstileToken: token }),
      });
      const result = (await response.json()) as SignupResponse;
      if (result.ok) {
        setStatus('done');
        return;
      }
      if (result.error === 'invalid' && result.fields) {
        setErrors(result.fields);
        focusFirst(result.fields);
      }
      fail(result.error === 'bad_request' ? 'unavailable' : result.error);
    } catch {
      fail('network');
    }
  }

  const input = (field: Exclude<FieldName, 'consent'>) => ({
    id: `f-${field}`,
    name: field,
    className: 'field',
    value: values[field],
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby':
      [errors[field] && `e-${field}`, field === 'phone' && 'h-phone'].filter(Boolean).join(' ') ||
      undefined,
    onChange: (event: { target: { value: string } }) => set(field, event.target.value),
    onBlur: () => blur(field),
  });
  const row = (field: FieldName, optional: boolean, control: ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`f-${field}`} className="mb-1.5 block font-semibold">
        {t[field as 'name']}
        {optional && <span className="font-normal text-muted"> ({t.optional})</span>}
      </label>
      {control}
      {hint && (
        <p id={`h-${field}`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      <FieldMessage id={`e-${field}`} text={errors[field] && t.errors[errors[field]]} />
    </div>
  );

  return (
    <form ref={form} onSubmit={submit} noValidate method="post" className="grid gap-5">
      <p className="text-muted">{t.intro}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {row(
          'name',
          false,
          <input {...input('name')} autoComplete="name" maxLength={LIMITS.name} required />,
        )}
        {row(
          'email',
          false,
          <input
            {...input('email')}
            type="email"
            dir="ltr"
            autoComplete="email"
            inputMode="email"
            maxLength={LIMITS.email}
            required
            style={{ textAlign: locale === 'ar' ? 'right' : undefined }}
          />,
        )}
      </div>
      {row(
        'phone',
        true,
        <input
          {...input('phone')}
          type="tel"
          dir="ltr"
          autoComplete="tel"
          maxLength={LIMITS.phone}
          style={{ textAlign: locale === 'ar' ? 'right' : undefined }}
        />,
        t.phoneHint,
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {row(
          'role',
          false,
          <select {...input('role')} required>
            <option value="" disabled>
              {t.rolePlaceholder}
            </option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {t.roles[role]}
              </option>
            ))}
          </select>,
        )}
        {row(
          'city',
          false,
          <>
            <input
              {...input('city')}
              list="cities"
              autoComplete="address-level2"
              maxLength={LIMITS.city}
              required
            />
            <datalist id="cities">
              {t.cities.map((city) => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </>,
        )}
      </div>
      {row(
        'club',
        true,
        <input {...input('club')} autoComplete="organization" maxLength={LIMITS.club} />,
      )}

      {/* Honeypot: hidden from people and screen readers, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[999rem] h-px w-px overflow-hidden">
        <label htmlFor="f-website">Website</label>
        <input
          id="f-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      <div>
        <div className="flex items-start gap-3">
          <input
            id="f-consent"
            name="consent"
            type="checkbox"
            className="mt-0.5 size-6 shrink-0 accent-accent"
            checked={values.consent}
            onChange={(event) => set('consent', event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent && 'e-consent'}
            required
          />
          <label htmlFor="f-consent">
            {t.consentBefore}
            <a className="link" href={localePath(locale, '/privacy')} target="_blank">
              {t.consentLink}
              <span className="sr-only"> {newTab}</span>
            </a>
            {t.consentAfter}
          </label>
        </div>
        <FieldMessage id="e-consent" text={errors.consent && t.errors[errors.consent]} />
      </div>

      {turnstileSiteKey && (
        <Turnstile key={challenge} siteKey={turnstileSiteKey} locale={locale} onToken={setToken} />
      )}

      <div role="alert" className="empty:hidden">
        {formError && <p className="font-semibold text-danger">{formError}</p>}
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full text-lg"
        disabled={!ready}
        aria-disabled={status === 'sending'}
      >
        {status === 'sending' ? t.submitting : t.submit}
      </button>
    </form>
  );
}

function FieldMessage({ id, text }: { id: string; text?: string }) {
  if (!text) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-semibold text-danger">
      {text}
    </p>
  );
}

function Success({
  t,
  newTab,
  communityUrl,
  shareUrl,
}: {
  t: Dictionary['form']['success'];
  newTab: string;
  communityUrl: string;
  shareUrl: string;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [note, setNote] = useState('');
  useEffect(() => heading.current?.focus(), []);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Rate Me', text: t.shareText, url: shareUrl });
      } catch {
        // Closing the share sheet is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNote(t.copied);
    } catch {
      setNote(`${t.copyFailed} ${shareUrl}`);
    }
  }

  return (
    <div className="py-6">
      <svg
        viewBox="0 0 64 64"
        className="size-16 text-accent"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 54V12H58V54" />
        <path d="M20 34l9 9 17-19" />
      </svg>
      <h3 ref={heading} tabIndex={-1} className="display h3 mt-5">
        {t.title}
      </h3>
      <p className="mt-3 text-lg">{t.text}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        {communityUrl && (
          <a className="btn btn-primary" href={communityUrl} target="_blank" rel="noopener">
            {t.join}
            <span className="sr-only"> {newTab}</span>
          </a>
        )}
        <button type="button" className="btn btn-ghost" onClick={share}>
          {t.share}
        </button>
      </div>
      <p role="status" className="mt-4 min-h-6 text-muted">
        {note}
      </p>
    </div>
  );
}
