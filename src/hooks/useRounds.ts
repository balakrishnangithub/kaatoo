import { useEffect, useRef, useState } from 'react';
import type { GameId } from '../data/content';
import { chimeSoft } from '../lib/speech';
import { useStore } from '../lib/store';
import { useTimers } from './useTimers';

/**
 * The life of a round-based game, in one place: a fixed number of rounds, each
 * answered exactly once, then the end card.
 *
 *   miss()        a wrong attempt — soft chime, counted towards help
 *   solve(delay)  she got it — the round locks, the skill signal is recorded,
 *                 and after `delay` ms the next round is dealt (or the game ends)
 *   restart()     "again" on the end card
 *
 * `deal` is the game's own "set up a fresh board" — it runs in the same update
 * as the round change, so a new round never paints with the old round's state.
 *
 * What this guarantees, so no game has to remember it:
 *  - a double-tap on the right answer counts once — no skipped round, no
 *    double-recorded outcome or win;
 *  - the pending advance is disarmed on unmount and on restart — nothing is
 *    dealt into a screen she has left;
 *  - the last round ends the game instead of advancing — no phantom question
 *    behind the end card.
 */
export function useRounds(gameId: GameId, total: number, deal: () => void) {
  const { recordWin, recordOutcome } = useStore();
  const { later, clearAll } = useTimers();
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const [solved, setSolved] = useState(false);
  const [misses, setMisses] = useState(0);
  // the same facts as refs: two taps can land before React re-renders, and the
  // second one must already see what the first one did
  const live = useRef({ solved: false, misses: 0 });
  const dealRef = useRef(deal);
  useEffect(() => {
    dealRef.current = deal;
  });

  const begin = (next: number) => {
    live.current = { solved: false, misses: 0 };
    setSolved(false);
    setMisses(0);
    setRound(next);
    dealRef.current();
  };

  const miss = () => {
    if (live.current.solved) return;
    live.current.misses += 1;
    setMisses(live.current.misses);
    chimeSoft();
  };

  const solve = (delayMs: number) => {
    if (live.current.solved) return;
    live.current.solved = true;
    setSolved(true);
    recordOutcome(gameId, live.current.misses === 0);
    const last = round + 1 >= total;
    if (last) recordWin(gameId);
    later(() => (last ? setDone(true) : begin(round + 1)), delayMs);
  };

  const restart = () => {
    clearAll();
    setDone(false);
    begin(0);
  };

  return { round, done, solved, misses, miss, solve, restart };
}
