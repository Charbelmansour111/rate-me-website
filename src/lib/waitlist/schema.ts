import { z } from 'zod';

import { isJunkEmail } from './disposable';
import {
  isEmail,
  isName,
  isSafeText,
  LIMITS,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  ROLES,
  type FieldError,
  type FieldErrors,
  type FieldName,
} from './fields';

const e = (code: FieldError) => ({ error: code });
/** A cap before any normalizing, so nobody makes us process megabytes. */
const text = (code: FieldError) => z.string(e(code)).max(500, e(code)).transform(normalizeText);

export const signupSchema = z.object({
  name: text('nameInvalid').refine(isName, e('nameInvalid')),
  email: z
    .string(e('emailInvalid'))
    .max(500, e('emailInvalid'))
    .transform(normalizeEmail)
    .refine(isEmail, { error: 'emailInvalid', abort: true })
    .refine((value) => !isJunkEmail(value), e('emailJunk')),
  phone: z
    .string(e('phoneInvalid'))
    .max(LIMITS.phone * 2, e('phoneInvalid'))
    .default('')
    .transform((value, ctx) => {
      const phone = normalizePhone(value);
      if (phone === null) {
        ctx.addIssue({ code: 'custom', message: 'phoneInvalid' });
        return z.NEVER;
      }
      return phone;
    }),
  role: z.enum(ROLES, e('roleRequired')),
  city: text('cityRequired')
    .refine((value) => value.length >= 2, e('cityRequired'))
    .refine((value) => value.length <= LIMITS.city && isSafeText(value), e('textInvalid')),
  club: text('textInvalid')
    .default('')
    .refine((value) => value.length <= LIMITS.club && isSafeText(value), e('textInvalid')),
  consent: z.literal(true, e('consentRequired')),
  locale: z.enum(['en', 'ar']).catch('en'),
});

/** One error code per field, first problem first. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as FieldName | undefined;
    if (field && !errors[field]) errors[field] = issue.message as FieldError;
  }
  return errors;
}
