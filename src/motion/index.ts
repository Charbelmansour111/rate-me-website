import { startHero } from './hero';
import { startJourney } from './journey';
import { startDetails, startReveals } from './reveal';
import { startTactics } from './tactics';

export function startMotion(signal: AbortSignal) {
  startReveals(signal);
  startDetails(signal);
  startJourney(signal);
  const hero = document.querySelector<HTMLElement>('[data-hero-drill]');
  if (hero) startHero(hero, signal);
  const tactics = document.querySelector<HTMLElement>('[data-tactics]');
  if (tactics) startTactics(tactics, signal);
}
