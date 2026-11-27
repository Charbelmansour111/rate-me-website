/**
 * Two thick oblique strokes, orange and white, as if laid on with a paint roller, behind the
 * tactics section's content: each a wide stroke with thin ridges of lighter and darker paint along
 * it (the roller's texture, drawn as more strokes; no filter, no blur). Tilted -12 degrees. They
 * show in the panel's gaps and margins only: the words and the board sit on solid ground in front
 * of them (src/app/pitch.css). src/motion/brush.ts draws them in when the section comes into view;
 * without motion they are simply there.
 */
type Stroke = { d: string; width: number; colour: string; ridges: string[] };

const STROKES: Stroke[] = [
  {
    d: 'M-120 150C140 118 420 170 700 132S1000 112 1140 128',
    width: 96,
    colour: '#ff5a00',
    ridges: ['#ff7a2e', '#e24f00', '#ff8a45'],
  },
  {
    d: 'M-120 486C180 466 470 508 760 474S1010 452 1140 468',
    width: 74,
    colour: '#f6f1e8',
    ridges: ['#ffffff', '#e6dfd3', '#fffaf2'],
  },
];
/** Where each ridge runs across its stroke, as a share of the stroke's width (centre at 0). */
const RIDGES = [-0.34, -0.06, 0.27];

export function BrushStrokes() {
  return (
    <svg
      className="brush-strokes"
      viewBox="0 0 1000 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      data-brush
    >
      <g transform="rotate(-12 500 310)" fill="none" strokeLinecap="round">
        {STROKES.map(({ d, width, colour, ridges }) => (
          <g key={colour}>
            <path d={d} stroke={colour} strokeWidth={width} pathLength={1} data-brush-stroke />
            {ridges.map((ridge, i) => (
              <path
                key={ridge}
                d={d}
                stroke={ridge}
                strokeWidth={width * 0.12}
                strokeOpacity={0.7}
                transform={`translate(0 ${RIDGES[i] * width})`}
                pathLength={1}
                data-brush-stroke
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
