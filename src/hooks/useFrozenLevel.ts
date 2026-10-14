import { useState } from 'react';
import type { GameId } from '../data/content';
import { useStore } from '../lib/store';

/**
 * The difficulty level for this sitting — read once when the game opens.
 *
 * `levelFor` reads live progress, and the tap that finishes a round is exactly
 * what changes it. A game that reads the level on every render therefore
 * re-deals its board in the middle of the celebration ("the items changed by
 * themselves"), or tears down the timers that were about to end the round.
 * Freezing it keeps the whole sitting at one level; the new level applies the
 * next time she opens the game.
 */
export function useFrozenLevel(gameId: GameId, maxLevel: number): number {
  const { levelFor } = useStore();
  const [level] = useState(() => levelFor(gameId, maxLevel));
  return level;
}
