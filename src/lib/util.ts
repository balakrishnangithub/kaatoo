/**
 * Small shared helpers used across games.
 * Display constants live here too so every game renders handwriting the same way.
 */

/** handwritten letterform style — applied inline so it beats button/card font classes.
 *  Children learn to trace the letterforms people actually write, not digital print:
 *  Kavivanar (Tamil handwriting) + Andika (SIL's literacy font: single-storey a, clear digits) */
export const HAND_FONT = "'Kavivanar','Andika','Baloo 2','Noto Sans Tamil',sans-serif";

/** Fisher–Yates shuffle on a copy — the input array is never mutated. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** uniformly random element */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** n distinct random elements (shuffled) */
export function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}
