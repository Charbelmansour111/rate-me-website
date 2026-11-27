import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Strokes drawn in as their section comes into view: the tactics section's paint
 * (src/components/brush-strokes.tsx) and the FAQ's play (src/components/faq-play.tsx). For each, each stroke's dash offset from 1 to 0, the white one a little after the
 * orange. It pauses while the section is off the screen and resumes when it is back, and it plays
 * once. Never under reduced motion (this code does not load then): the strokes are simply there.
 */
export function startBrush(signal: AbortSignal) {
  // The tactics paint and the FAQ's play (src/components/faq-play.tsx): each drawn in on its own
  for (const svg of document.querySelectorAll<SVGSVGElement>('[data-brush]')) paintIn(svg, signal);
}

function paintIn(svg: SVGSVGElement, signal: AbortSignal) {
  // Not shown (the FAQ's play on a phone) or already in view (a jump to it, a reload half way
  // down): leave it drawn
  const box = svg.getBoundingClientRect();
  if (!box.width || (box.top < innerHeight && box.bottom > 0)) return;
  const strokes = svg.querySelectorAll<SVGPathElement>('[data-brush-stroke]');
  gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
  const paint = gsap.timeline({ paused: true, onComplete: () => trigger.kill() }).to(strokes, {
    strokeDashoffset: 0,
    duration: Number(svg.dataset.brush) || 1.1,
    ease: 'power2.out',
    stagger: Number(svg.dataset.brushStagger) || 0.05,
  });
  const trigger = ScrollTrigger.create({
    trigger: svg,
    start: 'top 80%',
    end: 'bottom top',
    onEnter: () => paint.play(),
    onEnterBack: () => paint.play(),
    onLeave: () => paint.pause(),
    onLeaveBack: () => paint.pause(),
  });
  signal.addEventListener('abort', () => {
    trigger.kill();
    paint.kill();
    gsap.set(strokes, { clearProps: 'all' });
  });
}
