/**
 * Small colour maths for the stage colours (src/config/stages.ts): WCAG contrast, mixing in OKLab
 * (no muddy midpoints) and pushing a text colour until it passes AA. No dependencies.
 */
export type Rgba = { r: number; g: number; b: number; a: number };

export function parse(hex: string): Rgba {
  const h = hex.replace('#', '');
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}

const byte = (v: number) => Math.round(Math.min(255, Math.max(0, v)));
const hex2 = (v: number) => byte(v).toString(16).padStart(2, '0');

export function format({ r, g, b, a }: Rgba): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`;
}

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) =>
  255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055);

export function luminance(hex: string) {
  const { r, g, b } = parse(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** An opaque colour laid over another (alpha compositing in sRGB, as browsers paint). */
export function over(top: string, under: string): string {
  const t = parse(top);
  const u = parse(under);
  const k = t.a;
  return format({
    r: t.r * k + u.r * (1 - k),
    g: t.g * k + u.g * (1 - k),
    b: t.b * k + u.b * (1 - k),
    a: 1,
  });
}

function toOklab({ r, g, b }: Rgba) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, A, B]: number[]) {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** `a` to `b` at `t` (0 to 1), in OKLab; alpha mixes straight. */
export function mix(a: string, b: string, t: number): string {
  if (t <= 0) return format(parse(a));
  if (t >= 1) return format(parse(b));
  const p = parse(a);
  const q = parse(b);
  const [x, y] = [toOklab(p), toOklab(q)];
  const lab = x.map((v, i) => v + (y[i] - v) * t);
  return format({ ...fromOklab(lab), a: p.a + (q.a - p.a) * t });
}

/**
 * `fg`, or the nearest colour towards black or white that reaches `min` contrast on every one of
 * `grounds`. Used on the in-between mixes, where a text colour made for one stage would fail on
 * the next stage's ground.
 */
export function readable(fg: string, grounds: string[], min: number): string {
  const worst = (c: string) => Math.min(...grounds.map((g) => contrast(c, g)));
  if (worst(fg) >= min) return format(parse(fg));
  // The smallest step towards white or towards black that passes, whichever is smaller
  const step = (end: string) => {
    for (let k = 0.02; k <= 1.0001; k += 0.02) {
      const c = mix(fg, end, k);
      if (worst(c) >= min) return { k, c };
    }
    return null;
  };
  const [light, dark] = [step('#ffffff'), step('#000000')];
  if (light && (!dark || light.k <= dark.k)) return light.c;
  if (dark) return dark.c;
  // Neither end passes on every ground: the plain end that does best
  return worst('#ffffff') >= worst('#000000') ? '#ffffff' : '#000000';
}
