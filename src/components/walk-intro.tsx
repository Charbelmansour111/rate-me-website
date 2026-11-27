import { INTRO_SCRIPT } from '@/config/journey.config';
import type { Dictionary } from '@/i18n';

/**
 * A first visit's intro (src/motion/walk-gate.ts): the Rate Me mark on the brand black, on the
 * centre spot of a faint pitch, and a thin line that fills as the walk's frames come in, with a quiet
 * Skip. The script before it decides, before the first paint, whether this visit gets it; without
 * that (a return visit, saving data, reduced motion, no script) it is never shown. The mark is drawn
 * here, not fetched, so it is there in the same paint.
 */
export function WalkIntro({ t }: { t: Dictionary['hero']['gate'] }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <div className="intro" data-walk-wait>
        <svg className="intro-pitch" viewBox="0 0 600 600" fill="none" aria-hidden="true">
          <circle cx="300" cy="300" r="170" />
          <path d="M-2000 300H2600" />
        </svg>
        <div className="intro-centre">
          <svg
            className="intro-mark"
            viewBox="0 0 506 116"
            role="img"
            aria-label="Rate Me"
            focusable="false"
          >
            <g
              fill="none"
              stroke="#fff"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 98 V18 H38 A22 22 0 0 1 38 62 H14 M36 62 L58 98" />
              <path d="M152 43 V98" />
              <path d="M192 20 V80 Q192 98 211 98 M178 45 H212" />
              <path d="M236 70 H292 A28 28 0 1 0 283.8 89.8" />
              <path d="M344 98 V20 L374 62 L404 20 V98" />
              <path d="M434 70 H490 A28 28 0 1 0 481.8 89.8" />
            </g>
            <circle cx="113" cy="70" r="33" fill="#ff5a00" />
            <path
              d="M113 56.68L125.67 65.88L120.83 80.78H105.17L100.33 65.88ZM113 44.1L102.39 35.71A35.89 35.89 0 0 1 123.61 35.71ZM137.63 62L142.33 49.32A35.89 35.89 0 0 1 148.89 69.49ZM128.22 90.95L141.73 91.5A35.89 35.89 0 0 1 124.57 103.97ZM97.78 90.95L101.43 103.97A35.89 35.89 0 0 1 84.27 91.5ZM88.37 62L77.11 69.49A35.89 35.89 0 0 1 83.67 49.32Z"
              fill="#0b0b0c"
            />
            <path
              d="M113 56.68V44.1M125.67 65.88L137.63 62M120.83 80.78L128.22 90.95M105.17 80.78L97.78 90.95M100.33 65.88L88.37 62"
              stroke="#0b0b0c"
              strokeWidth="4.8"
              strokeLinecap="round"
            />
            <circle cx="113" cy="70" r="33" fill="none" stroke="#fff" strokeWidth="8" />
          </svg>
          <div
            className="intro-line"
            role="progressbar"
            aria-label={t.label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
          >
            <span />
          </div>
        </div>
        <button type="button" className="intro-skip" data-walk-gate-skip>
          {t.skip}
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3.5L10.5 8L6 12.5" />
          </svg>
        </button>
      </div>
    </>
  );
}
