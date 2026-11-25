import type { ReactNode } from 'react';
import { Readex_Pro } from 'next/font/google';

import { RootDocument } from '@/components/root-document';
import '../globals.css';

export { viewport } from '@/lib/seo';

const body = Readex_Pro({ subsets: ['arabic', 'latin'], variable: '--font-body' });

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootDocument locale="ar" fonts={body.variable}>
      {children}
    </RootDocument>
  );
}
