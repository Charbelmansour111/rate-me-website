import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * The tactics section's paint strokes (src/components/brush-strokes.tsx) are rolled on as the
 * section comes into view: each stroke's dash offset from 1 to 0, the white one a little after the
 * orange. It pauses while the section is off the screen and resumes when it is back, and it plays
 * once. Never under reduced motion (this code does not load then): the strokes are simply there.
 */
export function startBrush(signal: AbortSignal) {
  const svg = document.querySelector<SVGSVGElement>('[data-brush]');
  if (!svg) return;
  // Already in view (a jump to it, a reload half way down): leave it painted
  const box = svg.getBoundingClientRect();
  if (box.top < innerHeight && box.bottom > 0) return;
  const strokes = svg.querySelectorAll<SVGPathElement>('[data-brush-stroke]');
  gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
  const paint = gsap
    .timeline({ paused: true, onComplete: () => trigger.kill() })
    .to(strokes, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out', stagger: 0.05 });
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
