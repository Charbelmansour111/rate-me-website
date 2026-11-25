import { LegalPage } from '@/components/legal-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('ar', '/privacy');

export default function Page() {
  return <LegalPage locale="ar" kind="privacy" />;
}
