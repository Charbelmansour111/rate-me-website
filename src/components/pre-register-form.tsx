'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

import { localePath, type Dictionary, type Locale } from '@/i18n';
import {
  composePhone,
  DIAL_CODES,
  FIELD_ORDER,
  LIMITS,
  ROLES,
  validateField,
  validateForm,
  type FieldErrors,
  type FieldName,
  type FormValues,
  type Role,
} from '@/lib/waitlist/fields';
import type { SignupResponse } from '@/lib/waitlist/handler';

import { FormSuccess } from './form-success';
import { Turnstile } from './turnstile';

const EMPTY = { name: '', email: '', role: '', city: '', club: '', consent: false };
const REQUIRED: FieldName[] = ['name', 'email', 'role', 'city', 'consent'];
/** Phones show two steps; from the `sm` breakpoint up the whole form is on one card. */
const STEP_1: FieldName[] = ['name', 'email', 'role'];
const PHONE = '(max-width: 39.99rem)';
const CITY_CHIPS = 6;

const ROLE_ICONS: Record<Role, string> = {
  // Whistle, shield, clipboard, dots
  coach: 'M3 9h10l7-3v5l-6 1.500a5.500 5.500 0 1 1-11-.500Z M8 9V5',
  academy_owner: 'M12 3l8 3v6c0 5-4 8-8 9c-4-1-8-4-8-9V6Z M9 12l2 2 4-4',
  assistant_coach: 'M7 5h10v16H7Z M10 3h4v4h-4Z M10 12h4 M10 16h4',
  other: 'M5 12h.01 M12 12h.01 M19 12h.01',
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
  const [fields, setFields] = useState(EMPTY);
  const [dial, setDial] = useState('961');
  const [number, setNumber] = useState('');
  const values: FormValues = { ...fields, phone: composePhone(dial, number) };
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [step, setStep] = useState<1 | 2>(1);
  const [token, setToken] = useState('');
  const [challenge, setChallenge] = useState(0);
  const [honeypot, setHoneypot] = useState('');
  const form = useRef<HTMLFormElement>(null);
  /** What to focus once the step it is on has been shown. */
  const focusNext = useRef('');
  // React state is set after the first paint; until then the browser must not submit natively.
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!focusNext.current) return;
    form.current?.querySelector<HTMLElement>(`#${focusNext.current}`)?.focus();
    focusNext.current = '';
  });

  if (status === 'done') {
    return (
      <FormSuccess t={t.success} newTab={newTab} communityUrl={communityUrl} shareUrl={shareUrl} />
    );
  }

  /** Once a field is marked wrong, clear it as soon as it is right. */
  const recheck = (field: FieldName, next: FormValues) => {
    if (errors[field]) setErrors({ ...errors, [field]: validateField(field, next) });
  };
  const set = (field: Exclude<FieldName, 'phone'>, value: string | boolean) => {
    setFields({ ...fields, [field]: value });
    recheck(field, { ...values, [field]: value });
  };
  const setPhone = (nextDial: string, nextNumber: string) => {
    setDial(nextDial);
    setNumber(nextNumber);
    recheck('phone', { ...values, phone: composePhone(nextDial, nextNumber) });
  };
  /** Leaving a field checks it, unless it was never filled in: submit catches that. */
  const blur = (field: FieldName) => {
    if (values[field]) setErrors((now) => ({ ...now, [field]: validateField(field, values) }));
  };
  const valid = (field: FieldName) => Boolean(values[field]) && !validateField(field, values);

  /** Shows the step with the first problem and puts the cursor there. */
  const focusFirst = (found: FieldErrors) => {
    const first = FIELD_ORDER.find((field) => found[field]);
    if (!first) return;
    focusNext.current = `f-${first}`;
    setStep(STEP_1.includes(first) ? 1 : 2);
  };
  const fail = (code: keyof Dictionary['form']['formErrors']) => {
    setFormError(t.formErrors[code]);
    setStatus('idle');
    setToken('');
    setChallenge((n) => n + 1);
  };

  function goTo(next: 1 | 2) {
    setFormError('');
    focusNext.current = 'form-step';
    setStep(next);
  }
  function nextStep() {
    const found = validateForm(values);
    const here = Object.fromEntries(
      STEP_1.filter((field) => found[field]).map((field) => [field, found[field]]),
    ) as FieldErrors;
    setErrors((now) => ({ ...now, name: undefined, email: undefined, role: undefined, ...here }));
    if (Object.keys(here).length) focusFirst(here);
    else goTo(2);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (status === 'sending') return;
    // Enter on the first step of a phone means "next".
    if (step === 1 && matchMedia(PHONE).matches) {
      nextStep();
      return;
    }
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

  const describedBy = (field: FieldName, hint?: boolean) =>
    [errors[field] && `e-${field}`, hint && `h-${field}`].filter(Boolean).join(' ') || undefined;
  const input = (field: 'name' | 'email' | 'city' | 'club') => ({
    id: `f-${field}`,
    name: field,
    className: 'field',
    value: fields[field],
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': describedBy(field),
    onChange: (event: { target: { value: string } }) => set(field, event.target.value),
    onBlur: () => blur(field),
  });
  const message = (field: FieldName) => (
    <FieldMessage id={`e-${field}`} text={errors[field] && t.errors[errors[field]]} />
  );
  const label = (
    field: 'name' | 'email' | 'phone' | 'role' | 'city' | 'club',
    optional = false,
  ) => (
    <>
      {t[field]}
      {optional && <span className="font-normal text-muted"> ({t.optional})</span>}
      {valid(field) && <Check />}
    </>
  );
  const row = (
    field: 'name' | 'email' | 'city' | 'club',
    optional: boolean,
    control: ReactNode,
  ) => (
    <div>
      <label htmlFor={`f-${field}`} className="mb-1.5 block font-semibold">
        {label(field, optional)}
      </label>
      {control}
      {message(field)}
    </div>
  );
  const alignEnd = { textAlign: locale === 'ar' ? ('right' as const) : undefined };
  const done = REQUIRED.filter(valid).length;
  const onStep = (n: 1 | 2) => (step === n ? '' : 'max-sm:hidden');

  return (
    <form ref={form} onSubmit={submit} noValidate method="post">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="form-step" tabIndex={-1} className="font-semibold outline-none sm:hidden">
          {t.step.replace('{n}', String(step))} {step === 1 ? t.step1 : t.step2}
        </h3>
        <p className="text-muted max-sm:hidden">{t.intro}</p>
      </div>
      {/* Decoration: the fields themselves say what is missing. */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-softer" aria-hidden="true">
        <div
          className="h-full origin-left rounded-full bg-accent transition-transform duration-300 rtl:origin-right"
          style={{ transform: `scaleX(${done / REQUIRED.length})` }}
        />
      </div>

      <div className={`mt-6 grid gap-5 ${onStep(1)}`}>
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
              style={alignEnd}
            />,
          )}
        </div>
        <fieldset aria-describedby={describedBy('role')}>
          <legend className="mb-1.5 font-semibold">{label('role')}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ROLES.map((role, i) => (
              <label key={role} className="role-chip">
                <input
                  type="radio"
                  id={i === 0 ? 'f-role' : `f-role-${role}`}
                  name="role"
                  value={role}
                  checked={fields.role === role}
                  onChange={() => set('role', role)}
                  className="sr-only"
                  required
                />
                <svg
                  viewBox="0 0 24 24"
                  className="size-6 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={role === 'other' ? 3.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={ROLE_ICONS[role]} />
                </svg>
                {t.roles[role]}
              </label>
            ))}
          </div>
          {message('role')}
        </fieldset>
        <button
          type="button"
          className="btn btn-primary w-full text-lg sm:hidden"
          disabled={!ready}
          onClick={nextStep}
        >
          {t.next}
        </button>
      </div>

      <div className={`mt-5 grid gap-5 ${onStep(2)}`}>
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <div>
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
            <div role="group" aria-label={t.citySuggestions} className="mt-2 flex flex-wrap gap-2">
              {t.cities.slice(0, CITY_CHIPS).map((city) => (
                <button
                  key={city}
                  type="button"
                  className="city-chip"
                  aria-pressed={fields.city === city}
                  onClick={() => set('city', city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          {row(
            'club',
            true,
            <input {...input('club')} autoComplete="organization" maxLength={LIMITS.club} />,
          )}
        </div>

        <div>
          <label htmlFor="f-phone" className="mb-1.5 block font-semibold">
            {label('phone', true)}
          </label>
          <div className="flex gap-2" dir="ltr">
            <select
              aria-label={t.dialCode}
              className="field w-auto! max-w-36 shrink-0"
              value={dial}
              onChange={(event) => setPhone(event.target.value, number)}
            >
              {DIAL_CODES.map(({ code, country }) => (
                <option key={country} value={code}>
                  {country} +{code}
                </option>
              ))}
            </select>
            <input
              id="f-phone"
              name="phone"
              type="tel"
              className="field min-w-0"
              autoComplete="tel-national"
              maxLength={LIMITS.phone}
              value={number}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy('phone', true)}
              onChange={(event) => setPhone(dial, event.target.value)}
              onBlur={() => blur('phone')}
            />
          </div>
          <p id="h-phone" className="mt-1.5 text-sm text-muted">
            {t.phoneHint}
          </p>
          {message('phone')}
        </div>

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
              className="check"
              checked={fields.consent}
              onChange={(event) => set('consent', event.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={describedBy('consent')}
              required
            />
            <label htmlFor="f-consent">
              {t.consentBefore}
              <a
                className="link inline-flex min-h-11 items-center"
                href={localePath(locale, '/privacy')}
                target="_blank"
              >
                {t.consentLink}
                <span className="sr-only"> {newTab}</span>
              </a>
              {t.consentAfter}
            </label>
          </div>
          {message('consent')}
        </div>

        {turnstileSiteKey && (
          <Turnstile
            key={challenge}
            siteKey={turnstileSiteKey}
            locale={locale}
            onToken={setToken}
          />
        )}

        <div role="alert" className="empty:hidden">
          {formError && <p className="font-semibold text-danger">{formError}</p>}
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn btn-ghost sm:hidden" onClick={() => goTo(1)}>
            {t.back}
          </button>
          <button
            type="submit"
            className="btn btn-primary grow text-lg"
            disabled={!ready}
            aria-disabled={status === 'sending'}
          >
            {status === 'sending' && <span className="spinner" aria-hidden="true" />}
            {status === 'sending' ? t.submitting : t.submit}
          </button>
        </div>
      </div>
    </form>
  );
}

/** A small orange tick next to a label once its field is right. Decoration: errors are announced. */
function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="ms-2 inline size-4 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 8.500l4 4 7-9" />
    </svg>
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
