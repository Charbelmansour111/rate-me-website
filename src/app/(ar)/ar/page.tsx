import { HomePage } from '@/components/home-page';
import { pageMetadata, structuredData } from '@/lib/seo';

export const metadata = pageMetadata('ar', '/');

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData('ar')).replace(/</g, '\u003c'),
        }}
      />
      <HomePage locale="ar" />
    </>
  );
}
