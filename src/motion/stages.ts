import { STAGE_STEPS as STEPS, stageAt, stageVars, type StageTokens } from '@/config/stages';
import { luminance } from '@/lib/color';

/**
 * The panels change colour with the walk (src/config/stages.ts). Called with the walk's progress
 * from the walk's own ScrollTrigger (src/motion/walk-scroll.ts), so the colours and the picture
 * move in the same frame. Between stages the colours blend; inside a stage nothing is written.
 * Without this (reduced motion, no JavaScript) each part of the page has its stage's colours.
 */
export function followStages(signal: AbortSignal) {
  const root = document.documentElement;
  const cache = new Map<number, Record<string, string>>();
  let shown: StageTokens | undefined;
  let shownStep = -1;
  const apply = (progress: number) => {
    const step = Math.round(Math.max(0, Math.min(1, progress)) * STEPS);
    if (step === shownStep) return;
    shownStep = step;
    const tokens = stageAt(step / STEPS);
    // Inside a stage it is the same object: nothing to write
    if (tokens === shown) return;
    shown = tokens;
    let vars = cache.get(step);
    if (!vars) cache.set(step, (vars = stageVars(tokens)));
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
    // Light or dark ground: the header's logo follows (src/app/chrome.css)
    const tone = luminance(tokens.surface.slice(0, 7)) > 0.3 ? 'light' : 'dark';
    if (root.dataset.tone !== tone) root.dataset.tone = tone;
  };
  root.dataset.stages = 'live';
  signal.addEventListener('abort', () => {
    delete root.dataset.stages;
    delete root.dataset.tone;
    if (shown) for (const name of Object.keys(stageVars(shown))) root.style.removeProperty(name);
  });
  return apply;
}
