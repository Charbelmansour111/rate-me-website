import { LegalPage } from '@/components/legal-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('en', '/privacy');

export default function Page() {
  return <LegalPage locale="en" kind="privacy" />;
}
