/**
 * Seriation (big-to-small) layout helpers — pure functions, unit-tested here
 * so the row-overflow bug can never silently return.
 */

/** ideal artwork sizes per difficulty level (px, biggest → smallest) */
export function sizesFor(level: number): number[] {
  if (level === 0) return [124, 84, 52];
  if (level === 1) return [132, 104, 78, 54];
  return [140, 116, 94, 74, 56];
}

/**
 * Shrink the row to fit the field. Level sets the ideal artwork sizes; this
 * caps them (and the gaps) so the whole row always fits inside the measured
 * field — 5 items on a 360px phone included. Seriation (strictly descending
 * sizes) is never sacrificed; only the absolute scale adapts to the screen.
 *
 * Order of operations: shrink gaps, then scale artwork down (never up),
 * and only as a last resort let the smallest item dip to a per-count
 * tappability floor — a slightly small target she can reach beats a
 * "correct" size that overflows off-screen.
 */
export function fitSizes(sizes: number[], fieldWidth: number): { sizes: number[]; gap: number } {
  const n = sizes.length;
  const sum = sizes.reduce((a, b) => a + b, 0);
  const budget = fieldWidth * 0.92;

  // 1) ideal: the level's own row fits with a comfortable gap
  const idealGap = fieldWidth < 400 ? 14 : 20;
  if (sum + idealGap * (n - 1) <= budget) return { sizes, gap: idealGap };

  // 2) shrink gaps to 8px, scale artwork down (never up) toward the budget
  const gap = 8;
  const scale = Math.min(1, (budget - gap * (n - 1)) / sum);
  const scaled = sizes.map((s) => Math.round(s * scale));

  // 3) floor: never below a per-count tappable minimum — if scaling went
  //    under, lift the smallest items just enough, compressing the spread
  //    from the top so the row stays descending and as close to budget as possible
  const floor = n <= 3 ? 48 : n === 4 ? 40 : 30;
  if (Math.min(...scaled) >= floor) return { sizes: scaled, gap };

  const lifted = scaled.map((s) => Math.max(floor, s));
  // re-spread strictly descending where the floor flattened the tail — keep
  // the steps minimal so the row still fits inside the field itself
  const step = Math.max(2, Math.round(floor * 0.06));
  for (let i = lifted.length - 2; i >= 0; i--) {
    if (lifted[i] <= lifted[i + 1]) lifted[i] = lifted[i + 1] + step;
  }
  return { sizes: lifted, gap };
}
