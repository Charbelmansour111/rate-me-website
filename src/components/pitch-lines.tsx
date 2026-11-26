/**
 * The pitch-line language: pieces of a football pitch, drawn as thin lines in the colour of the
 * stage behind them (--st-pitch-line, src/config/stages.ts). Decoration only, hidden from screen
 * readers. Each piece mirrors itself in Arabic where it has a side.
 *
 * - CentreMark: the halfway line and the centre circle, on the top edge of a panel.
 * - CornerArcs: the four corner arcs of a pitch, in the corners of a panel.
 * - BoxCorner: the corner of a penalty box, the mark in a card's corner.
 * - PassLine: a dashed pass with its arrow, from a call to action to its button.
 */

/** The halfway line along a panel's top edge, and the half of the centre circle inside it. */
export function CentreMark() {
  return (
    <svg className="pitch-mark pitch-centre" viewBox="0 0 120 60" aria-hidden="true">
      <path d="M2 1A58 58 0 0 0 118 1" />
      <circle cx="60" cy="1" r="3" className="pitch-spot" />
    </svg>
  );
}

/** A quarter circle in each corner, as at the four corners of a pitch. */
export function CornerArcs() {
  const arc = 'M0 14A14 14 0 0 0 14 0';
  return (
    <span className="pitch-corners" aria-hidden="true">
      {(['ts', 'te', 'bs', 'be'] as const).map((corner) => (
        <svg
          key={corner}
          className="pitch-mark pitch-corner"
          data-corner={corner}
          viewBox="0 0 16 16"
        >
          <path d={arc} />
        </svg>
      ))}
    </span>
  );
}

/** The corner of the penalty box, with the arc of the D beside it. */
export function BoxCorner({ className = '' }: { className?: string }) {
  return (
    <svg className={`pitch-mark pitch-box ${className}`} viewBox="0 0 44 44" aria-hidden="true">
      <path d="M1 26V1H26" />
      <path d="M1 34V43M34 1H43" className="pitch-faint" />
    </svg>
  );
}

/** A dashed pass that curves to an arrow head. Drawn in on scroll where motion is on. */
export function PassLine({ className = '' }: { className?: string }) {
  return (
    <svg className={`pitch-mark pitch-pass ${className}`} viewBox="0 0 160 40" aria-hidden="true">
      <path d="M4 32C50 6 104 6 146 22" className="pitch-dash" />
      <path d="M136 13L148 23L134 29" />
    </svg>
  );
}

/** A whole half of a pitch, for the end of the page: drawn in as the footer arrives. */
export function PitchOutline({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pitch-mark pitch-outline ${className}`}
      viewBox="0 0 1200 160"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <path data-draw d="M10 159V10H1190V159" />
      <path data-draw d="M600 10V159" />
      <path data-draw d="M540 159A60 60 0 0 1 660 159" />
      <path data-draw d="M10 46H120V159M1190 46H1080V159" />
      <path data-draw d="M10 10A16 16 0 0 0 26 26M1190 10A16 16 0 0 1 1174 26" />
    </svg>
  );
}

/** The marks every section panel carries. */
export function PanelLines() {
  return (
    <>
      <CentreMark />
      <CornerArcs />
    </>
  );
}
