/* Plain <img>: tiny SVGs from /public/brand, nothing for next/image to optimize. */
/* eslint-disable @next/next/no-img-element */

/**
 * Replace the two files in /public/brand to change the logo everywhere. `onBlack` is for the
 * footer, which is black in both themes.
 */
export function Wordmark({ className, onBlack }: { className: string; onBlack?: boolean }) {
  const size = { width: 506, height: 116 };
  const dark = '/brand/wordmark-on-dark.svg';
  if (onBlack) return <img src={dark} {...size} alt="" className={className} />;
  return (
    <>
      <img
        src="/brand/wordmark-on-light.svg"
        {...size}
        alt=""
        className={`only-light ${className}`}
      />
      <img src={dark} {...size} alt="" loading="lazy" className={`only-dark ${className}`} />
    </>
  );
}
