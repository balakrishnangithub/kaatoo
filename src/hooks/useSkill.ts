import { useRef, useState } from 'react';
import type { GameId } from '../data/content';
import { chanceAt, chooseLevel, updateSkill, type Ladder } from '../lib/skill';
import { useStore } from '../lib/store';

/**
 * A game's live skill estimate: which level to open at, how to record a round,
 * and which level comes next. Every game goes through this, so difficulty is
 * chosen the same way everywhere — from her own rounds (see lib/skill.ts).
 *
 * The estimate lives in a ref as well as the store: the next round is dealt in
 * the same update that recorded the last one, before the store has re-rendered,
 * and it must already see that round.
 */
export function useSkill(gameId: GameId, ladder: Ladder) {
  const { skillOf, recordRound } = useStore();
  const [initial] = useState(() => skillOf(gameId));
  const [opening] = useState(() => chooseLevel(initial, ladder));
  const skill = useRef(initial);

  /**
   * One finished round at `level`. `score` is 1 for a clean round, 0 for none,
   * partial credit between; `weight` < 1 when the round says little (mashing).
   * `clean` is what the parents' corner shows for it (default: a full score).
   */
  const record = (
    level: number,
    score: number,
    opts: { weight?: number; clean?: boolean } = {},
  ) => {
    skill.current = updateSkill(
      skill.current,
      { level, score, chance: chanceAt(ladder, level), weight: opts.weight },
      Date.now(),
    );
    recordRound(gameId, opts.clean ?? score >= 1, skill.current);
  };

  /** the level after a round at `current` — or, without one, a new sitting's opening level */
  const next = (current?: number) => chooseLevel(skill.current, ladder, current);

  return { opening, record, next };
}
