import Image from 'next/image';

import type { FeatureId } from '@/config/features.config';
import { publicFile } from '@/lib/public-file';

import { FeatureIcon } from './feature-icon';

/**
 * The picture at the top of a feature card: public/features/<id>.webp (or .jpg, .png) once it is
 * there, 1600 x 1000 or the same shape. Until then a drawn placeholder holds the space, so
 * swapping in the image moves nothing. `alt` says what the photo shows (src/i18n features.items).
 */
export function FeatureArt({ id, alt = '' }: { id: FeatureId; alt?: string }) {
  const src = publicFile('features', id);
  return (
    <div className="feature-art">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 64rem) 22rem, (min-width: 40rem) 45vw, 90vw"
          className="object-cover"
        />
      ) : (
        <div data-placeholder className="grid size-full place-items-center">
          <svg
            className="absolute inset-0 size-full"
            viewBox="0 0 320 200"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            stroke="var(--chalk)"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M0 100H320 M160 0V200 M110 0V40H210V0 M110 200V160H210V200" />
            <circle cx="160" cy="100" r="34" />
          </svg>
          <span className="relative">
            <FeatureIcon id={id} />
          </span>
        </div>
      )}
    </div>
  );
}
