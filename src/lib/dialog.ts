import type { KeyboardEvent } from 'react';

/**
 * Keeps Tab inside an open modal dialog. A native <dialog> lets Tab leave it for the browser's
 * own toolbar; this sends it round to the first or last control instead.
 */
export function trapTab(event: KeyboardEvent, dialog: HTMLDialogElement | null) {
  if (event.key !== 'Tab' || !dialog) return;
  const stops = [
    ...dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]',
    ),
  ].filter((el) => el.offsetParent !== null || el === document.activeElement);
  if (!stops.length) return;
  const first = stops[0];
  const last = stops[stops.length - 1];
  const at = document.activeElement;
  if (event.shiftKey && (at === first || !dialog.contains(at))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (at === last || !dialog.contains(at))) {
    event.preventDefault();
    first.focus();
  }
}
