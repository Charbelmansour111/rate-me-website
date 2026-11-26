/**
 * Adapted from React Bits "SplitText" (TS + Tailwind), https://reactbits.dev, by David Haz.
 * License: ./LICENSE.md (MIT + Commons Clause).
 *
 * Changes for this site: no component, so headings stay plain text rendered on the server. The
 * reveal (src/motion/reveal.ts) splits a heading into words only while it rises in, with React
 * Bits' "rise" effect and its GSAP SplitText, then puts the text back as it was. Words, never
 * letters: Arabic letters join. No mask: it would clip Arabic marks above and below the line.
 */
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

/** Adds the words' rise to `tl`; returns what puts the heading back. */
export function riseWords(el: HTMLElement, tl: gsap.core.Timeline) {
  // aria: the heading keeps its whole text for screen readers while it is in pieces.
  const split = SplitText.create(el, { type: 'words', aria: 'auto' });
  tl.from(
    split.words,
    { opacity: 0, y: '0.45em', duration: 0.7, ease: 'power3.out', stagger: 0.06 },
    0,
  );
  return () => split.revert();
}
