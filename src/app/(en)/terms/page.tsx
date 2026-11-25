import { LegalPage } from '@/components/legal-page';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('en', '/terms');

export default function Page() {
  return <LegalPage locale="en" kind="terms" />;
}
