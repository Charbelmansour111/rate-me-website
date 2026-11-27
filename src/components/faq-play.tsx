/**
 * The FAQ's left column: a short play on a half pitch, in the tactics board's language (orange
 * and white on the panel). Chalk lines, two of our players and a defender, a curved pass in
 * orange, a run in white into the box, and at its end the question, as a node. The motion code
 * (src/motion/brush.ts) draws it in, stroke by stroke, as the section comes in; without motion it
 * is simply drawn. Decorative: the questions beside it say it all. Mirrored in Arabic, where "?"
 * becomes "؟". Shown only where the column has room (src/app/motion.css, .faq-play).
 */
export function FaqPlay() {
  return (
    <svg
      viewBox="0 0 360 400"
      className="faq-play"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-brush="0.9"
      data-brush-stagger="0.18"
    >
      {/* The half pitch: the line, the box, the goal area, the arc, the halfway circle */}
      <g className="faq-play-chalk" strokeWidth="2">
        <path d="M14 18H346V386H14Z" pathLength={1} data-brush-stroke />
        <path d="M96 18V112H264V18" pathLength={1} data-brush-stroke />
        <path d="M144 18V48H216V18" pathLength={1} data-brush-stroke />
        <path d="M150 112A36 36 0 0 0 210 112" pathLength={1} data-brush-stroke />
        <path d="M120 386A60 60 0 0 1 240 386" pathLength={1} data-brush-stroke />
      </g>
      {/* The pass: curved, orange, with its arrowhead */}
      <path
        className="faq-play-pass"
        d="M92 318Q196 300 248 222"
        strokeWidth="4"
        pathLength={1}
        data-brush-stroke
      />
      <path
        className="faq-play-pass"
        d="M234 228L248 222L250 237"
        strokeWidth="4"
        pathLength={1}
        data-brush-stroke
      />
      {/* The run: white, into the box */}
      <path
        className="faq-play-run"
        d="M262 206Q290 166 232 108"
        strokeWidth="3"
        pathLength={1}
        data-brush-stroke
      />
      <path
        className="faq-play-run"
        d="M231 124L232 108L247 113"
        strokeWidth="3"
        pathLength={1}
        data-brush-stroke
      />
      {/* Players: ours in white, the defender a ring with its cross */}
      <circle className="faq-play-ours" cx="80" cy="326" r="13" />
      <circle className="faq-play-ours" cx="262" cy="212" r="13" />
      <g className="faq-play-them">
        <circle cx="178" cy="266" r="12" />
        <path d="M172 260l12 12M184 260l-12 12" />
      </g>
      {/* The question, as a node at the end of the run */}
      <circle className="faq-play-node" cx="214" cy="84" r="20" />
      <text className="faq-play-mark" x="214" y="93" textAnchor="middle">
        ?
      </text>
    </svg>
  );
}
