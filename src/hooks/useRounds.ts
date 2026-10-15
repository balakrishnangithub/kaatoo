import { useEffect, useRef, useState } from 'react';
import type { GameId } from '../data/content';
import { chimeSoft } from '../lib/speech';
import { MASH_MS, roundScore, type Ladder } from '../lib/skill';
import { useStore } from '../lib/store';
import { useSkill } from './useSkill';
import { useTimers } from './useTimers';

/** every round at this position in a sitting is an easy one (see `begin`) */
const EASY_EVERY = 4;

export interface RoundsConfig<B> {
  /** rounds in one sitting, then the end card */
  rounds: number;
  /** the game's levels: how many, and how luck and partial credit work at each */
  ladder: Ladder;
  /** a fresh board at a level */
  deal: (level: number) => B;
  /** clear the game's own per-round state — runs in the same update as the deal */
  onDeal?: () => void;
}

/**
 * The life of a round-based game, in one place: a fixed number of rounds, each
 * answered exactly once, each dealt at the level her own play calls for, then
 * the end card.
 *
 *   miss()        a wrong attempt — soft chime, counted towards help and score
 *   solve(delay)  she got it — the round locks, her skill estimate is updated,
 *                 and after `delay` ms the next round is dealt (or the game ends)
 *   restart()     "again" on the end card — a new sitting
 *
 * The board is dealt here, in the same update as the round change, so a new
 * round never paints with the old round's state, and the level is chosen at
 * that moment — never re-read mid-round, where a level that just changed used
 * to re-deal the board under her finger.
 *
 * What this guarantees, so no game has to remember it:
 *  - a double-tap on the right answer counts once — no skipped round, no
 *    double-recorded outcome or win;
 *  - a burst of wrong taps (mashing) counts for less than considered tries;
 *  - the pending advance is disarmed on unmount and on restart — nothing is
 *    dealt into a screen she has left;
 *  - the last round ends the game instead of advancing — no phantom question
 *    behind the end card.
 */
export function useRounds<B>(gameId: GameId, { rounds, ladder, deal, onDeal }: RoundsConfig<B>) {
  const { recordWin } = useStore();
  const skill = useSkill(gameId, ladder);
  const { later, clearAll } = useTimers();
  const [round, setRound] = useState(0);
  const [level, setLevel] = useState(skill.opening);
  const [board, setBoard] = useState(() => deal(skill.opening));
  const [done, setDone] = useState(false);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  // the same facts as refs: two taps can land before React re-renders, and the
  // second one must already see what the first one did
  const live = useRef({
    level: skill.opening,
    solved: false,
    misses: 0,
    mashed: false,
    lastMiss: 0,
  });
  /** where the ladder stands — an easy round is dealt below it without moving it */
  const planned = useRef(skill.opening);
  const cfg = useRef({ deal, onDeal });
  useEffect(() => {
    cfg.current = { deal, onDeal };
  });

  const begin = (next: number, lv: number) => {
    planned.current = lv;
    // Every fourth round is one step easier: a sure success to keep her
    // going, and — if she misses even that — a sign of a tired or distracted
    // moment rather than of the level (the skill model barely counts it).
    const dealt = next % EASY_EVERY === EASY_EVERY - 1 && lv > 0 ? lv - 1 : lv;
    live.current = { level: dealt, solved: false, misses: 0, mashed: false, lastMiss: 0 };
    setSolved(false);
    setMisses(0);
    setRound(next);
    setLevel(dealt);
    setBoard(cfg.current.deal(dealt));
    cfg.current.onDeal?.();
  };

  const miss = () => {
    if (live.current.solved) return;
    const now = performance.now();
    if (live.current.misses > 0 && now - live.current.lastMiss < MASH_MS)
      live.current.mashed = true;
    live.current.lastMiss = now;
    live.current.misses += 1;
    setMisses(live.current.misses);
    chimeSoft();
  };

  const solve = (delayMs: number) => {
    if (live.current.solved) return;
    live.current.solved = true;
    setSolved(true);
    const { level: at, misses: n, mashed } = live.current;
    skill.record(at, roundScore(n, ladder.steps?.(at)), {
      weight: mashed ? 0.5 : 1,
      clean: n === 0,
    });
    const last = round + 1 >= rounds;
    if (last) recordWin(gameId);
    later(() => (last ? setDone(true) : begin(round + 1, skill.next(planned.current))), delayMs);
  };

  const restart = () => {
    clearAll();
    setDone(false);
    begin(0, skill.next());
  };

  return { board, level, round, done, solved, misses, miss, solve, restart };
}
