/**
 * rhythm.ts — the drum game's patterns and how her drumming is judged. Pure,
 * so every rule is unit-tested.
 *
 * Judging uses only the gaps between her own taps — never when a tap lands
 * against the elephant's beat. Touchscreens and speakers each add their own
 * delay (tens of milliseconds, different on every phone), and those delays
 * cancel out of a gap between two taps. So a child on a slow budget phone is
 * judged exactly like a child on a flagship.
 */

/** one level of the drum game */
export type Pattern =
  /** drum along with the elephant, which plays at her own pace × `pace` */
  | { kind: 'together'; pace: number; tolerance: number; chance: number }
  /** listen, then play it back: beat times in units of one gap */
  | { kind: 'echo'; beats: number[]; chance: number };

/**
 * The ladder, easiest first (LEVELS.drums describes it). Speeding up comes
 * before slowing down: little children manage it sooner (Provasi &
 * Bobin-Bègue 2003). `chance` is how often happy random drumming would pass.
 */
export const PATTERNS: readonly Pattern[] = [
  { kind: 'together', pace: 1, tolerance: 0.25, chance: 0.4 },
  { kind: 'together', pace: 0.85, tolerance: 0.15, chance: 0.2 },
  { kind: 'together', pace: 1.2, tolerance: 0.15, chance: 0.2 },
  { kind: 'echo', beats: [0, 1], chance: 0.3 },
  { kind: 'echo', beats: [0, 1, 2], chance: 0.2 },
  { kind: 'echo', beats: [0, 1, 1.5], chance: 0.25 }, // long – short: "தா … தக"
];

/** a toddler's usual pace when she has not shown us hers (ms per beat) */
export const DEFAULT_PACE = 500;

const gaps = (times: readonly number[]) => times.slice(1).map((t, i) => t - times[i]);
function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Her own pace, from drumming freely: the typical gap between her taps,
 * kept to what small hands do (350–900 ms). Too few taps — the usual pace.
 */
export function ownPace(taps: readonly number[]): number {
  const g = gaps(taps).filter((x) => x >= 200 && x <= 1500);
  if (g.length < 3) return DEFAULT_PACE;
  return Math.min(900, Math.max(350, median(g)));
}

/**
 * Drumming along: at least four taps, and her typical gap within `tolerance`
 * of the elephant's. Double taps and pauses are left out of the typical gap.
 */
export function judgeTogether(taps: readonly number[], unit: number, tolerance: number): boolean {
  const g = gaps(taps).filter((x) => x > unit * 0.4 && x < unit * 2.5);
  if (g.length < 3) return false;
  return Math.abs(median(g) - unit) / unit <= tolerance;
}

/**
 * Playing it back: as many taps as the elephant played — and for a rhythm,
 * its long and short gaps in the same order (the long one clearly longer).
 */
export function judgeEcho(taps: readonly number[], beats: readonly number[]): boolean {
  if (taps.length !== beats.length) return false;
  const want = gaps(beats);
  const got = gaps(taps);
  for (let i = 1; i < want.length; i++) {
    if (want[i] === want[i - 1]) continue; // an even pattern: the count is the skill
    const longFirst = want[i - 1] > want[i];
    const ratio = got[i - 1] / got[i];
    if (longFirst ? ratio < 1.3 : ratio > 1 / 1.3) return false;
  }
  return true;
}
