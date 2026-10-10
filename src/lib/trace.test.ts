import { describe, expect, it } from 'vitest';
import { judgeStroke, type Pt } from './trace';

/* helpers to synthesise strokes — deterministic shapes in a 100×100 box */
function circlePts(cx = 50, cy = 50, r = 40, n = 60, wobble = 0): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r + (wobble ? Math.sin(i * 3.1) * wobble : 0);
    return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr };
  });
}
function zigzagPts(x0 = 10, y0 = 10, span = 80, n = 60): Pt[] {
  return Array.from({ length: n }, (_, i) => ({
    x: x0 + (i / n) * span,
    y: y0 + (i % 2 === 0 ? 0 : span / 2),
  }));
}

const GUIDE = { l: 0, t: 0, s: 100 };

describe('judgeStroke — shapes', () => {
  const template = circlePts();

  it('accepts an honest, slightly wobbly circle', () => {
    expect(judgeStroke(circlePts(50, 50, 40, 60, 3), template, GUIDE).verdict).toBe('match');
  });

  it('accepts a smaller circle drawn off-centre (scale/position invariant)', () => {
    // the same circle, shifted and shrunk — still a circle
    expect(judgeStroke(circlePts(30, 30, 22), template, GUIDE).verdict).toBe('match');
  });

  it('rejects a zig-zag scribble', () => {
    expect(judgeStroke(zigzagPts(), template, GUIDE).verdict).toBe('scribble');
  });

  it('rejects a tiny dot / too few points', () => {
    expect(
      judgeStroke(
        [
          { x: 50, y: 50 },
          { x: 51, y: 50 },
        ],
        template,
        GUIDE,
      ).verdict,
    ).toBe('scribble');
  });

  it('rejects a stroke that sprawls far beyond the guide box (wandering)', () => {
    // wanders() fires when the stroke's own bounding box spans more than the
    // guide box allows — a sprawling scribble, not a shape placed elsewhere.
    const sprawling = circlePts(50, 50, 160); // huge circle spills well past the 100px box
    expect(judgeStroke(sprawling, template, GUIDE).verdict).toBe('scribble');
  });

  it('an open arc that barely covers the circle is not a clean match (symmetry)', () => {
    // only ~35% of the circle drawn — symmetric Hausdorff punishes partial traces
    const arc = circlePts(50, 50, 40, 60, 0).slice(0, 22);
    expect(judgeStroke(arc, template, GUIDE).verdict).not.toBe('match');
  });
});

describe('judgeStroke — aspect guard', () => {
  it('a very flat oval against a circle is at most "close", never a match', () => {
    const oval = Array.from({ length: 60 }, (_, i) => {
      const a = (i / 60) * Math.PI * 2;
      return { x: 50 + Math.cos(a) * 44, y: 50 + Math.sin(a) * 20 };
    });
    const v = judgeStroke(oval, circlePts(), GUIDE).verdict;
    expect(v === 'match').toBe(false);
  });
});
