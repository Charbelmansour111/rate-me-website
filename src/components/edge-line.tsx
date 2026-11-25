/**
 * The thin orange pitch line: down one side of a section, along its end, and on down the other
 * side of the next. Scroll draws it where the browser can; elsewhere it is simply there.
 */
export function EdgeLine({ end, last }: { end?: boolean; last?: boolean }) {
  const side = end ? '-scale-x-100 rtl:scale-x-100' : 'rtl:-scale-x-100';
  return (
    <svg
      className={['edge-line', last && 'edge-last', side].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <line className="edge-down" x1="1" y1="0" x2="1" y2="100%" pathLength={1} />
      <line className="edge-across" x1="0" y1="100%" x2="100%" y2="100%" pathLength={1} />
    </svg>
  );
}
