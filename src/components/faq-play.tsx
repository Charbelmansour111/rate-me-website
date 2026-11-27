/**
 * The FAQ's left column: a stadium scoreboard, its lamps lit, the question where the score goes
 * (WEBSITE 20, picked over a whistle with a "?" card: it reads at a glance, even small). Orange and
 * white strokes on the panel. The motion code (src/motion/brush.ts) draws it in stroke by stroke as
 * the section comes in; without motion it is simply drawn. Decorative: the questions beside it say
 * it all. Mirrored in Arabic, where "?" becomes "؟"; no digits, which would read backwards. Shown
 * only where the column has room (src/app/motion.css, .faq-play).
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
      data-brush-stagger="0.16"
    >
      {/* The board, its screen, the two dashes either side of the score */}
      <path
        className="faq-play-line"
        d="M40 70H320V250H40Z"
        strokeWidth="5"
        pathLength={1}
        data-brush-stroke
      />
      <path
        className="faq-play-line"
        d="M64 112H296V226H64Z"
        strokeWidth="2.5"
        pathLength={1}
        data-brush-stroke
      />
      <path
        className="faq-play-line"
        d="M100 169H140M220 169H260"
        strokeWidth="4"
        pathLength={1}
        data-brush-stroke
      />
      {/* Its legs and the ground */}
      <path
        className="faq-play-line"
        d="M96 250V350M264 250V350M60 350H300"
        strokeWidth="5"
        pathLength={1}
        data-brush-stroke
      />
      {/* The lamps along the top, lit */}
      <g className="faq-play-lamps">
        {[80, 112, 144, 176, 208, 240, 272].map((x) => (
          <circle key={x} cx={x} cy="91" r="6" />
        ))}
      </g>
      {/* The question, where the score goes */}
      <text className="faq-play-mark" x="180" y="196" textAnchor="middle">
        ?
      </text>
    </svg>
  );
}
