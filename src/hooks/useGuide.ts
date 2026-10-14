import type { GameId } from '../data/content';
import { useStore } from '../lib/store';

/** after this many finished plays of an activity the help retires — she owns it */
const PLAYS_UNTIL_RETIRED = 4;

/**
 * How much help she still gets in one activity — the adaptive fade, in one
 * place so the guiding hand and the drawing demo retire on the same schedule.
 */
export function useGuide(gameId: GameId) {
  const { settings, progress } = useStore();
  const plays = progress[gameId]?.plays ?? 0;
  return { plays, enabled: settings.guide && plays < PLAYS_UNTIL_RETIRED };
}
