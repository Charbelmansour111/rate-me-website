import type { ReactNode } from 'react';
import localFont from 'next/font/local';

import { RootDocument } from '@/components/root-document';
import '../globals.css';

export { viewport } from '@/lib/seo';

/**
 * Readex Pro, as static weights (400, 600, 700) cut from Google's variable font (WEBSITE 17): the
 * same typeface, but text in a static face lays out faster than in a variable one, and the Arabic
 * page lays out a lot of text. Two families from the same files' two subsets: the Arabic letters
 * first, the Latin ones (numbers, names) after it (src/app/globals.css, :lang(ar)).
 *
 * `optional`: the font is preloaded and nearly always in time for the first paint; when it is not,
 * that first view keeps the system's Arabic font rather than swapping mid-page. Arabic letters are
 * much wider in Readex Pro than in the fallback, so a swap moved the header and the headline.
 */
const arabic = localFont({
  src: [
    { path: './fonts/readex-arabic-400.woff2', weight: '400' },
    { path: './fonts/readex-arabic-600.woff2', weight: '600' },
    { path: './fonts/readex-arabic-700.woff2', weight: '700' },
  ],
  variable: '--font-body',
  display: 'optional',
});
const latin = localFont({
  src: [
    { path: './fonts/readex-latin-400.woff2', weight: '400' },
    { path: './fonts/readex-latin-600.woff2', weight: '600' },
    { path: './fonts/readex-latin-700.woff2', weight: '700' },
  ],
  variable: '--font-body-latin',
  display: 'optional',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootDocument locale="ar" fonts={`${arabic.variable} ${latin.variable}`}>
      {children}
    </RootDocument>
  );
}
