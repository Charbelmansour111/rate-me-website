import { stageRanges } from '@/config/journey.config';
import {
  STAGE_STEPS as STEPS,
  STAGES,
  stageAt,
  stageColors,
  stageVars,
  type StageTokens,
} from '@/config/stages';
import type { StageId } from '@/config/journey.config';
import { luminance } from '@/lib/color';

/**
 * The panels change colour with the walk (src/config/stages.ts). Called with the walk's progress
 * from the walk's own loop (src/motion/walk-scroll.ts), so the colours and the picture move in the
 * same frame. Between stages the colours blend; inside a stage nothing is written.
 *
 * Where they are written decides what it costs (WEBSITE 26): a custom property changed on <html>
 * makes the browser restyle every element of the page, about 27 ms on a fast computer, whatever the
 * property. So the colours go only on what shows them: the panels on the screen (a panel coming
 * in gets them as it does), the header's bar, the scroll cue and the menu. Every part keeps its
 * own stage's colours in the stylesheet underneath (src/app/palette.css).
 *
 * On a phone, and on a computer that cannot keep up (the quality governor at 2 or more,
 * src/motion/walk-scroll.ts), there is no blend: the colours change once, at each boundary.
 * Without this (reduced motion, no JavaScript) each part of the page has its stage's colours.
 */
export function followStages(signal: AbortSignal, discreteNow: () => boolean = () => false) {
  const root = document.documentElement;
  const cache = new Map<number, Record<string, string>>();
  let shown: StageTokens | undefined;
  let vars: Record<string, string> | undefined;
  let shownStep = -1;
  const fixed = [...document.querySelectorAll<HTMLElement>('.site-bar, .scroll-cue, .menu-dialog')];
  // The panels, each on its own: a step restyles only the one or two on the screen
  const groups = [...document.querySelectorAll<HTMLElement>('.walk-group .panel')];
  const onScreen = new Set<HTMLElement>();
  /** What each element was last given (by step), so nothing is written twice (WEBSITE 28). */
  const given = new WeakMap<HTMLElement, number>();
  const write = (el: HTMLElement) => {
    if (!vars || given.get(el) === shownStep) return;
    // Its own stage's colours, from the stylesheet, are these already: nothing to restyle
    const own = (el.closest<HTMLElement>('[data-stage]')?.dataset.stage ?? '') as StageId;
    if (!given.has(el) && shown === stageColors[own]) return;
    given.set(el, shownStep);
    for (const [name, value] of Object.entries(vars)) el.style.setProperty(name, value);
  };
  // A part of the page coming on to the screen takes the colours of the moment
  const seen = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        const group = target as HTMLElement;
        if (!isIntersecting) onScreen.delete(group);
        else if (!onScreen.has(group)) {
          onScreen.add(group);
          write(group);
        }
      }
    },
    { rootMargin: '25% 0px' },
  );
  for (const group of groups) seen.observe(group);

  const apply = (progress: number) => {
    const p = Math.max(0, Math.min(1, progress));
    const discrete = discreteNow();
    // A phone: the stage it is in, never a blend
    const found = STAGES.findIndex((id) => p < stageRanges[id].to);
    const stage = found < 0 ? STAGES.length - 1 : found;
    const step = discrete ? -1 - stage : Math.round(p * STEPS);
    if (step === shownStep) return;
    shownStep = step;
    const tokens = discrete ? stageColors[STAGES[stage]] : stageAt(step / STEPS);
    // Inside a stage it is the same object: nothing to write
    if (tokens === shown) return;
    shown = tokens;
    vars = cache.get(step);
    if (!vars) cache.set(step, (vars = stageVars(tokens)));
    for (const el of [...fixed, ...onScreen]) write(el);
    // Light or dark ground: the header's logo follows (src/app/chrome.css)
    const tone = luminance(tokens.surface.slice(0, 7)) > 0.3 ? 'light' : 'dark';
    if (root.dataset.tone !== tone) root.dataset.tone = tone;
  };
  root.dataset.stages = 'live';
  signal.addEventListener('abort', () => {
    seen.disconnect();
    delete root.dataset.stages;
    delete root.dataset.tone;
    const names = shown ? Object.keys(stageVars(shown)) : [];
    for (const el of [...fixed, ...groups]) for (const name of names) el.style.removeProperty(name);
  });
  return apply;
}
