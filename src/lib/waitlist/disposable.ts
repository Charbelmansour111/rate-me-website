/**
 * A short list of well-known throwaway inboxes plus reserved domains. It stops casual junk;
 * it is not exhaustive. Add domains here as they show up in the list.
 */
const DISPOSABLE = new Set(
  `10minutemail.com 10minutemail.net 20minutemail.com 33mail.com anonbox.net burnermail.io byom.de
  deadaddress.com discard.email discardmail.com dispostable.com dropmail.me emailondeck.com
  fakeinbox.com fakemail.net getairmail.com getnada.com grr.la guerrillamail.biz guerrillamail.com
  guerrillamail.de guerrillamail.net guerrillamail.org guerrillamailblock.com inboxbear.com
  inboxkitten.com incognitomail.org jetable.org mailcatch.com maildrop.cc mailexpire.com
  mailinator.com mailinator.net mailnesia.com mailnull.com mailsac.com mailtemp.info
  minuteinbox.com mintemail.com moakt.com mohmal.com mytemp.email nada.email nowmymail.com
  sharklasers.com spam4.me spambog.com spambox.us spamgourmet.com temp-mail.io temp-mail.org
  tempail.com tempinbox.com tempmail.com tempmail.dev tempmail.net tempmail.plus tempmailo.com
  tempr.email throwawaymail.com trash-mail.com trashmail.com trashmail.de trashmail.net trbvm.com
  wegwerfmail.de yopmail.com yopmail.fr yopmail.net
  example.com example.net example.org`.split(/\s+/),
);
const RESERVED_TLDS = new Set(['test', 'example', 'invalid', 'localhost', 'local']);
/** Addresses nobody reads in person. */
const JUNK_LOCAL = /^(test|asdf+|qwerty|aaa+|no-?reply|donotreply|mailer-daemon|postmaster)$/;

/** Expects a normalized email. Subdomains of a listed domain count too. */
export function isJunkEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  const local = email.slice(0, at).split('+')[0];
  const labels = email.slice(at + 1).split('.');
  if (RESERVED_TLDS.has(labels[labels.length - 1])) return true;
  for (let i = 0; i < labels.length - 1; i++) {
    if (DISPOSABLE.has(labels.slice(i).join('.'))) return true;
  }
  return JUNK_LOCAL.test(local);
}
