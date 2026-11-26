import { contrast, mix, over, readable } from '@/lib/color';

import { stageBlend, stageRanges, type StageId } from './journey.config';

/**
 * The panels' colours for each part of the walk. Locker room: warm light surfaces, black lines,
 * orange accents. Tunnel: charcoal, warm white text, orange lines. Field: deep pitch green, white
 * pitch lines, orange for actions. The orange buttons are the same everywhere (src/app/palette.css).
 *
 * Each token becomes a CSS custom property `--st-<name>`; `.panel` and the header read them. Text
 * tokens are checked for AA on every stage and on every in-between mix (tests/unit/palette.test.ts).
 */
export type StageTokens = {
  surface: string;
  soft: string;
  softer: string;
  text: string;
  muted: string;
  /** Small orange text: the kicker, links. */
  accentText: string;
  line: string;
  /** Outlines of fields and controls: 3:1. */
  edge: string;
  chalk: string;
  /** The pitch-line drawings (src/components/pitch-lines.tsx). */
  pitchLine: string;
  /** The thin line round a panel. */
  panelEdge: string;
  glow: string;
  danger: string;
};

export const stageColors: Record<StageId, StageTokens> = {
  locker: {
    surface: '#f3ece1',
    soft: '#eae1d2',
    softer: '#e0d5c3',
    text: '#0b0b0c',
    muted: '#544c42',
    accentText: '#9e3400',
    line: '#d3c7b3',
    edge: '#7a6f61',
    chalk: '#c7baa4',
    pitchLine: '#0b0b0c',
    panelEdge: '#0b0b0c',
    glow: '#ff5a0066',
    danger: '#a3221b',
  },
  tunnel: {
    surface: '#0f0e0d',
    soft: '#1a1815',
    softer: '#23201c',
    text: '#f6f1e8',
    muted: '#bdb5a8',
    accentText: '#ff8a3d',
    line: '#34302a',
    edge: '#857d70',
    chalk: '#3a362f',
    pitchLine: '#ff5a00',
    panelEdge: '#ff5a004d',
    glow: '#ff5a0080',
    danger: '#ffb4ab',
  },
  field: {
    surface: '#0b2a1c',
    soft: '#103424',
    softer: '#163f2d',
    text: '#ffffff',
    muted: '#bdd4c6',
    accentText: '#ffb07a',
    line: '#24503c',
    edge: '#7ea892',
    chalk: '#2c5c46',
    pitchLine: '#ffffff',
    panelEdge: '#ffffff59',
    glow: '#ff5a0066',
    danger: '#ffb4ab',
  },
};

export const STAGES = Object.keys(stageRanges) as StageId[];
/** Text that must reach 4.5:1 on every ground of its stage, and controls' outlines 3:1. */
const TEXT: (keyof StageTokens)[] = ['text', 'muted', 'accentText', 'danger'];
const GROUNDS: (keyof StageTokens)[] = ['surface', 'soft', 'softer'];

export const cssName = (token: string) =>
  `--st-${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** The colours at walk progress `p`: one stage's own, or a blend near a boundary. */
export function stageAt(p: number): StageTokens {
  for (let i = 0; i < STAGES.length - 1; i++) {
    const [a, b] = [STAGES[i], STAGES[i + 1]];
    const edge = stageRanges[a].to;
    const span =
      stageBlend *
      Math.min(stageRanges[a].to - stageRanges[a].from, stageRanges[b].to - stageRanges[b].from);
    if (p < edge - span / 2) return stageColors[a];
    if (p <= edge + span / 2) {
      const x = (p - (edge - span / 2)) / span;
      return blend(stageColors[a], stageColors[b], x * x * (3 - 2 * x));
    }
  }
  return stageColors[STAGES[STAGES.length - 1]];
}

/** Two stages mixed at `t`; text pushed lighter or darker wherever the mix would fail AA. */
export function blend(a: StageTokens, b: StageTokens, t: number): StageTokens {
  const out = {} as StageTokens;
  for (const key of Object.keys(a) as (keyof StageTokens)[]) out[key] = mix(a[key], b[key], t);
  const grounds = GROUNDS.map((k) => out[k]);
  for (const key of TEXT) out[key] = readable(out[key], grounds, 4.6);
  out.edge = readable(out.edge, grounds, 3.05);
  return out;
}

/** The custom properties for a set of colours, as a style object. */
export const stageVars = (tokens: StageTokens) =>
  Object.fromEntries(Object.entries(tokens).map(([k, v]) => [cssName(k), v]));

/**
 * The header starts see-through over the locker room. Fully clear would put its text straight on
 * the photo; at this much of the surface its text passes AA over a black or a white pixel alike.
 */
export const BAR_CLEAR = 0.62;

/**
 * The same colours as CSS, pasted into src/app/palette.css (the unit test checks they match).
 * The tunnel is the default everywhere; each part of the home page carries `data-stage`, which
 * holds where nothing moves (reduced motion, no JavaScript). Once the walk is scrubbed, `html`
 * gets `data-stages="live"` and the blended values on its own style.
 */
export function stageCss() {
  const block = (selector: string, tokens: StageTokens) =>
    `${selector} {\n${Object.entries(stageVars(tokens))
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n')}\n}`;
  return [
    block(':root', stageColors.tunnel),
    ...STAGES.map((id) =>
      block(`html:not([data-stages='live']) [data-stage='${id}']`, stageColors[id]),
    ),
  ].join('\n');
}

/** Lowest contrast of `fg` on any of a stage's grounds (for the tests). */
export const worstOn = (tokens: StageTokens, fg: string) =>
  Math.min(...GROUNDS.map((k) => contrast(fg, tokens[k])));
export const barGround = (tokens: StageTokens, under: string) =>
  over(tokens.surface.slice(0, 7) + Math.round(BAR_CLEAR * 255).toString(16), under);
