/**
 * Field rules shared by the form (inline errors) and the server (zod schema). Kept free of
 * dependencies so the browser does not download zod.
 */
export const ROLES = ['coach', 'academy_owner', 'assistant_coach', 'other'] as const;
export type Role = (typeof ROLES)[number];

export const LIMITS = { name: 80, email: 254, phone: 24, city: 60, club: 80 } as const;

const EMAIL =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
/** Control characters, angle brackets and links have no place in a name, city or club. */
const UNSAFE_TEXT = /[\u0000-\u001f\u007f<>]|https?:|www\./i;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const normalizeText = (value: string) => value.normalize('NFC').trim().replace(/ +/g, ' ');

/** Arabic-Indic and Persian digits become 0-9, so phones typed on an Arabic keyboard work. */
const latinDigits = (value: string) =>
  value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/**
 * "+961 3 123 456", "00961 3 123456" and "03 123 456" all become "+9613123456". A number
 * without a country code is read as Lebanese. Returns null when it cannot be a phone number.
 */
export function normalizePhone(value: string): string | null {
  const raw = latinDigits(value).trim();
  if (!raw) return '';
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, '');
  if (!raw.startsWith('+')) {
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (/^(0\d{7}|\d{7,8})$/.test(digits)) digits = `961${digits.replace(/^0/, '')}`;
  }
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

/** Lebanon first, then its region, then a few more. Other numbers are typed with their +. */
export const DIAL_CODES = [
  ['LB', '961'],
  ['SY', '963'],
  ['JO', '962'],
  ['IQ', '964'],
  ['PS', '970'],
  ['EG', '20'],
  ['AE', '971'],
  ['SA', '966'],
  ['QA', '974'],
  ['KW', '965'],
  ['BH', '973'],
  ['OM', '968'],
  ['TR', '90'],
  ['CY', '357'],
  ['FR', '33'],
  ['DE', '49'],
  ['GB', '44'],
  ['US', '1'],
  ['AU', '61'],
].map(([country, code]) => ({ country, code }));

/** The chosen code and the local number as one; a number typed with its own + or 00 wins. */
export function composePhone(dial: string, number: string): string {
  const local = latinDigits(number).trim();
  if (!local || /^(\+|00)/.test(local)) return local;
  return `+${dial} ${local.replace(/^0/, '')}`;
}

export const isEmail = (value: string) => value.length <= LIMITS.email && EMAIL.test(value);
export const isSafeText = (value: string) => !UNSAFE_TEXT.test(value);
export const isName = (value: string) =>
  value.length >= 2 && value.length <= LIMITS.name && isSafeText(value) && /\p{L}/u.test(value);
export const isRole = (value: unknown): value is Role => ROLES.includes(value as Role);

export type FieldName = 'name' | 'email' | 'phone' | 'role' | 'city' | 'club' | 'consent';
/** Codes, not sentences: the form looks the sentence up in the i18n files. */
export type FieldError =
  | 'nameInvalid'
  | 'emailInvalid'
  | 'emailJunk'
  | 'phoneInvalid'
  | 'roleRequired'
  | 'cityRequired'
  | 'textInvalid'
  | 'consentRequired';
export type FieldErrors = Partial<Record<FieldName, FieldError>>;

export type FormValues = {
  name: string;
  email: string;
  phone: string;
  role: string;
  city: string;
  club: string;
  consent: boolean;
};

export function validateField(field: FieldName, values: FormValues): FieldError | undefined {
  switch (field) {
    case 'name':
      return isName(normalizeText(values.name)) ? undefined : 'nameInvalid';
    case 'email':
      return isEmail(normalizeEmail(values.email)) ? undefined : 'emailInvalid';
    case 'phone':
      return normalizePhone(values.phone) === null ? 'phoneInvalid' : undefined;
    case 'role':
      return isRole(values.role) ? undefined : 'roleRequired';
    case 'city': {
      const city = normalizeText(values.city);
      if (city.length < 2) return 'cityRequired';
      return city.length <= LIMITS.city && isSafeText(city) ? undefined : 'textInvalid';
    }
    case 'club': {
      const club = normalizeText(values.club);
      return club.length <= LIMITS.club && isSafeText(club) ? undefined : 'textInvalid';
    }
    case 'consent':
      return values.consent ? undefined : 'consentRequired';
  }
}

export const FIELD_ORDER: FieldName[] = [
  'name',
  'email',
  'phone',
  'role',
  'city',
  'club',
  'consent',
];

export function validateForm(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of FIELD_ORDER) {
    const error = validateField(field, values);
    if (error) errors[field] = error;
  }
  return errors;
}
