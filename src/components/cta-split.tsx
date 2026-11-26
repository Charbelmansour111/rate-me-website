import type { ReactNode } from 'react';

import { PassLine } from './pitch-lines';

/**
 * The one key call to action of a section: a block split on the diagonal, half black and half
 * orange. The words sit on the plain black half (AA), the button on the orange half (black on
 * orange, 6.3:1), a dashed pass between them. Mirrors in Arabic.
 */
export function CtaSplit({
  title,
  text,
  action,
  className = '',
}: {
  title: string;
  text?: string;
  /** The button or link, styled `btn btn-dark`. */
  action: ReactNode;
  className?: string;
}) {
  return (
    // Laid out by its own width (src/app/pitch.css): it sits in full panels and in half columns
    <div className={`split-host ${className}`}>
      <div className="look-split">
        <div className="look-split-words">
          <p className="text-lg font-semibold">{title}</p>
          {text && <p className="mt-1 text-muted">{text}</p>}
        </div>
        <PassLine className="look-split-pass" />
        <div className="look-split-action">{action}</div>
      </div>
    </div>
  );
}
