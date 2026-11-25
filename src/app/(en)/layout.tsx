import type { ReactNode } from 'react';
import { Barlow, Bebas_Neue } from 'next/font/google';

import { RootDocument } from '@/components/root-document';
import '../globals.css';

export { viewport } from '@/lib/seo';

const title = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-title' });
const body = Barlow({ weight: ['400', '600'], subsets: ['latin'], variable: '--font-body' });

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootDocument locale="en" fonts={`${title.variable} ${body.variable}`}>
      {children}
    </RootDocument>
  );
}
