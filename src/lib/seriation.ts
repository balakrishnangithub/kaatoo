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
 * Minimum gap between neighbouring item buttons, by item count. Fewer items
 * are bigger, so they can sit closer; five small ones need a wider corridor
 * or a neighbour swallows the tap. One definition: the fit below reserves this
 * room, and the game lays its slots out with it.
 */
export function slotGapFor(count: number): number {
  return count <= 3 ? 12 : count === 4 ? 16 : 20;
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
  // headroom: the game later packs slots with the wider per-count button gap
  // — the scale step must leave room for that or the packed row would outgrow
  // the field
  const slotGap = slotGapFor(n);
  const scale = Math.min(1, (budget - slotGap * (n - 1)) / sum);
  const scaled = sizes.map((s) => Math.round(s * scale));

  // 3) floor: never below a per-count tappable minimum — if scaling went
  //    under, lift the smallest items just enough, then re-spread descending
  const floor = n <= 3 ? 48 : n === 4 ? 40 : 30;
  if (Math.min(...scaled) < floor) {
    const lifted = scaled.map((s) => Math.max(floor, s));
    const step = Math.max(2, Math.round(floor * 0.06));
    for (let i = lifted.length - 2; i >= 0; i--) {
      if (lifted[i] <= lifted[i + 1]) lifted[i] = lifted[i + 1] + step;
    }
    scaled.splice(0, scaled.length, ...lifted);
  }

  // 4) hard guarantee: the packed staircase row (artwork + button gaps) must
  //    never exceed the field itself — shrink proportionally as a last resort
  const packed = (arr: number[]) => arr.reduce((a, b) => a + b, 0) + slotGap * (n - 1);
  if (packed(scaled) > fieldWidth) {
    const shrink = (fieldWidth - slotGap * (n - 1)) / scaled.reduce((a, b) => a + b, 0);
    return { sizes: scaled.map((s) => Math.floor(s * shrink)), gap };
  }
  return { sizes: scaled, gap };
}

/**
 * Staircase layout: every item owns a fixed slot (left = biggest). Slots are
 * packed by BUTTON WIDTH, not artwork width — every artwork is a square SVG,
 * so a smaller item's button is just as wide as its artwork is tall, and the
 * effective button gap would otherwise collapse toward zero (a placed big
 * item then physically covers its small neighbour and eats its taps).
 * minGap guarantees a real tap corridor between neighbouring buttons.
 * Returns one entry per rank (0 = biggest): x = slot centre from the row's
 * left edge, size = that item's artwork size. The row is centred in the field
 * by the caller, so x=0 means "left edge of the row", wherever the row sits.
 */
export function staircaseSlots(
  sizes: number[],
  minGap: number,
): { rank: number; x: number; size: number }[] {
  let cursor = 0;
  return sizes.map((size, rank) => {
    const slot = { rank, x: cursor + size / 2, size };
    cursor += size + minGap;
    return slot;
  });
}
