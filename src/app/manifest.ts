import type { MetadataRoute } from 'next';

import { THEME_COLORS } from '@/config/theme';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rate Me',
    short_name: 'Rate Me',
    start_url: '/',
    display: 'browser',
    background_color: THEME_COLORS.light,
    theme_color: THEME_COLORS.light,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
