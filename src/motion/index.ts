import { startDetails, startReveals } from './reveal';
import { startTactics } from './tactics';

export function startMotion(signal: AbortSignal) {
  startReveals(signal);
  startDetails(signal);
  const tactics = document.querySelector<HTMLElement>('[data-tactics]');
  if (tactics) startTactics(tactics, signal);
}
