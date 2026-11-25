/* Plain <img>: tiny SVGs from /public/brand, nothing for next/image to optimize. */
/* eslint-disable @next/next/no-img-element */

/** Replace the two files in /public/brand to change the logo everywhere. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <>
      <img
        src="/brand/wordmark-on-dark.svg"
        alt=""
        width={506}
        height={116}
        className={`only-dark ${className}`}
      />
      <img
        src="/brand/wordmark-on-light.svg"
        alt=""
        width={506}
        height={116}
        loading="lazy"
        className={`only-light ${className}`}
      />
    </>
  );
}
