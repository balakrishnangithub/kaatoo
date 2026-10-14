import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A value that clears itself after `ms` — which tile is wiggling after a wrong
 * tap. Flashing again restarts the clock, and nothing fires after unmount.
 */
export function useFlash<T>(ms = 450): [T | null, (value: T) => void] {
  const [value, setValue] = useState<T | null>(null);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = useCallback(
    (next: T) => {
      window.clearTimeout(timer.current);
      setValue(next);
      timer.current = window.setTimeout(() => setValue(null), ms);
    },
    [ms],
  );

  return [value, flash];
}
