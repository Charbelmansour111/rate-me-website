import type { ReactNode } from 'react';
import { Readex_Pro } from 'next/font/google';

import { RootDocument } from '@/components/root-document';
import '../globals.css';

export { viewport } from '@/lib/seo';

/**
 * `optional`: the font is preloaded and nearly always in time for the first paint; when it is not,
 * that first view keeps the system's Arabic font rather than swapping mid-page. Arabic letters are
 * much wider in Readex Pro than in the fallback, so a swap moved the header and the headline.
 */
const body = Readex_Pro({
  subsets: ['arabic', 'latin'],
  variable: '--font-body',
  display: 'optional',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootDocument locale="ar" fonts={body.variable}>
      {children}
    </RootDocument>
  );
}
