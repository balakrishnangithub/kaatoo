import { useCallback, useEffect, useRef } from 'react';

/**
 * Timeouts that cannot outlive the screen that armed them.
 *
 * Every game schedules little follow-ups — advance the round, ask the
 * question, start the celebration — and a child can leave at any moment. A
 * timer that fires after that speaks or scores into a screen that is gone.
 * Arm them through `later`: they are all disarmed when the component unmounts,
 * or on demand with `clearAll` (e.g. when a round restarts).
 */
export function useTimers() {
  const ids = useRef<number[]>([]);

  const clearAll = useCallback(() => {
    for (const id of ids.current) window.clearTimeout(id);
    ids.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      ids.current = ids.current.filter((x) => x !== id);
      fn();
    }, ms);
    ids.current.push(id);
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return { later, clearAll };
}
