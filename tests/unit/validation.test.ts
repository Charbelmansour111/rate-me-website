import { describe, expect, it } from 'vitest';

import { isJunkEmail } from '@/lib/waitlist/disposable';
import { isEmail, normalizePhone, validateForm } from '@/lib/waitlist/fields';
import { signupSchema, toFieldErrors } from '@/lib/waitlist/schema';

const valid = {
  name: '  Rami   Haddad ',
  email: ' Rami.Haddad@Gmail.COM ',
  phone: '03 123 456',
  role: 'coach',
  city: 'بيروت',
  club: '',
  consent: true,
  locale: 'ar',
};
const errorsOf = (change: object) => {
  const result = signupSchema.safeParse({ ...valid, ...change });
  return result.success ? {} : toFieldErrors(result.error);
};

describe('signup schema', () => {
  it('normalizes a valid signup', () => {
    expect(signupSchema.parse(valid)).toEqual({
      name: 'Rami Haddad',
      email: 'rami.haddad@gmail.com',
      phone: '+9613123456',
      role: 'coach',
      city: 'بيروت',
      club: '',
      consent: true,
      locale: 'ar',
    });
  });

  it('accepts a signup without the optional fields', () => {
    const rest = { ...valid, phone: undefined, club: undefined };
    expect(signupSchema.parse(rest)).toMatchObject({ phone: '', club: '' });
  });

  it.each([
    [{ name: '' }, { name: 'nameInvalid' }],
    [{ name: '123' }, { name: 'nameInvalid' }],
    [{ name: 'x'.repeat(81) }, { name: 'nameInvalid' }],
    [{ name: 'Buy at https://spam.com' }, { name: 'nameInvalid' }],
    [{ name: 42 }, { name: 'nameInvalid' }],
    [{ email: 'not-an-email' }, { email: 'emailInvalid' }],
    [{ email: undefined }, { email: 'emailInvalid' }],
    [{ email: 'a@mailinator.com' }, { email: 'emailJunk' }],
    [{ phone: 'call me' }, { phone: 'phoneInvalid' }],
    [{ role: 'king' }, { role: 'roleRequired' }],
    [{ city: ' ' }, { city: 'cityRequired' }],
    [{ city: '<script>' }, { city: 'textInvalid' }],
    [{ club: 'c'.repeat(81) }, { club: 'textInvalid' }],
    [{ consent: false }, { consent: 'consentRequired' }],
    [{ consent: 'true' }, { consent: 'consentRequired' }],
  ])('rejects %j', (change, expected) => {
    expect(errorsOf(change)).toEqual(expected);
  });

  it('falls back to English for an unknown locale', () => {
    expect(signupSchema.parse({ ...valid, locale: 'fr' }).locale).toBe('en');
  });
});

describe('form rules', () => {
  it('agree with the schema: every required field is reported', () => {
    const empty = { name: '', email: '', phone: '', role: '', city: '', club: '', consent: false };
    expect(validateForm(empty)).toEqual({
      name: 'nameInvalid',
      email: 'emailInvalid',
      role: 'roleRequired',
      city: 'cityRequired',
      consent: 'consentRequired',
    });
    expect(Object.keys(errorsOf(empty)).sort()).toEqual(Object.keys(validateForm(empty)).sort());
  });

  it.each([
    ['', ''],
    ['+961 3 123 456', '+9613123456'],
    ['00961 70 123456', '+96170123456'],
    ['70-123-456', '+96170123456'],
    ['٠٣ ١٢٣ ٤٥٦', '+9613123456'],
    ['+33 6 12 34 56 78', '+33612345678'],
    ['123', null],
    ['+961 3 12a', null],
  ])('normalizes the phone %j', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['a@b', 'a b@c.com', '.a@c.com', 'a..b@c.com', 'a@-c.com', 'a@c.com,d@e.com', '@c.com'])(
    'refuses the email %j',
    (email) => expect(isEmail(email)).toBe(false),
  );
});

describe('junk emails', () => {
  it.each([
    'a@yopmail.com',
    'a@sub.mailinator.com',
    'a@site.test',
    'noreply@club.com',
    'test@x.com',
  ])('refuses %s', (email) => expect(isJunkEmail(email)).toBe(true));
  it.each(['coach@gmail.com', 'info@club.lb', 'contest@club.com', 'a@notmailinator.com'])(
    'accepts %s',
    (email) => expect(isJunkEmail(email)).toBe(false),
  );
});
