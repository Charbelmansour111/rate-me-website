import { gsap } from 'gsap';

import { startMagnets } from '@/components/react-bits/magnet.motion';
import { startTilts } from '@/components/react-bits/tilted-card.motion';

import { startSpotlights } from './cards';

/**
 * What follows a mouse (React Bits: the light and the lean on cards, the tilt on the phones, the
 * magnet buttons). Its own chunk (WEBSITE 26), loaded only where there is a mouse to follow: a
 * phone never downloads it.
 */
export function startHover(signal: AbortSignal) {
  const context = gsap.context(() => {
    startSpotlights(signal);
    startTilts(signal);
    startMagnets(signal);
  });
  signal.addEventListener('abort', () => context.revert());
}
