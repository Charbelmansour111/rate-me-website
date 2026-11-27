import type { ReactNode } from 'react';

/**
 * The one phone the site draws round an app screen, in "Inside the app" and in the feature
 * dialogs: an ink bezel with rounded corners, side keys, a drawn status bar (the time, the island,
 * signal and battery) and the screen under it. Plain markup, so it renders on the server and runs
 * nothing. Its size is the `--phone` width it is given (src/app/journey.css, .phone).
 */
export function PhoneFrame({
  dark = false,
  children,
}: {
  /** The screen's own top is dark: the status bar goes dark with it. */
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="phone">
      <span className="phone-keys" aria-hidden="true" />
      <div className="phone-screen" data-dark={dark || undefined}>
        <div className="phone-status" aria-hidden="true">
          <span>9:41</span>
          <span className="phone-island" />
          <svg viewBox="0 0 34 12" className="phone-icons">
            <path d="M1 11h2V8H1zM5 11h2V6H5zM9 11h2V4H9zM13 11h2V2h-2z" fill="currentColor" />
            <rect
              x="19.5"
              y="1.5"
              width="12"
              height="9"
              rx="2.5"
              fill="none"
              stroke="currentColor"
            />
            <rect x="21" y="3" width="8" height="6" rx="1.2" fill="currentColor" />
          </svg>
        </div>
        {children}
        <span className="phone-glass" aria-hidden="true" />
      </div>
    </div>
  );
}
