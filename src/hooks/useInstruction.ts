import { useEffect } from 'react';
import { useStore } from '../lib/store';
import { speakPair } from '../lib/speech';

/**
 * Spoken instruction line for a game.
 * Re-speaks whenever `deps` change (e.g. a new round).
 * `active = false` silences it — games pass `!done` so the instructor never
 * starts talking behind the end-of-round card.
 */
export function useInstruction(ta: string, en?: string, deps: unknown[] = [], active = true) {
  const { settings } = useStore();
  useEffect(() => {
    if (!active) return;
    speakPair(ta, en ?? '', !!en && settings.english);
    // deps are the caller's re-speak triggers (round, data) — by design
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, active]);
}
