import { describe, expect, it } from 'vitest';
import { judgeGlyph, type Pt } from './trace';

/*
 * Glyph judging works in the guide box's own frame (0..1): a stroke must cover
 * most of the letter's ink AND stay on it. These tests build a fake "letter"
 * (a vertical bar + a loop) inside a 100×100 box and trace it honestly vs.
 * scribble elsewhere.
 */
const GUIDE = { l: 0, t: 0, s: 100 };

// the letter's ink: a cross shape in the middle of the box
const ink: Pt[] = [];
for (let t = 0.2; t <= 0.8; t += 0.05) {
  ink.push({ x: 0.5, y: t }); // vertical bar
  ink.push({ x: t, y: 0.5 }); // horizontal bar
}

function traceInk(n = 80, wobble = 0.02): Pt[] {
  // stroke that sweeps along both bars of the ink, with hand wobble
  const pts: Pt[] = [];
  for (let i = 0; i < n / 2; i++) {
    const t = 0.2 + (i / (n / 2)) * 0.6;
    pts.push({ x: (0.5 + Math.sin(i) * wobble) * 100, y: t * 100 });
  }
  for (let i = 0; i < n / 2; i++) {
    const t = 0.2 + (i / (n / 2)) * 0.6;
    pts.push({ x: t * 100, y: (0.5 + Math.cos(i) * wobble) * 100 });
  }
  return pts;
}

describe('judgeGlyph — letters & digits', () => {
  it('accepts an honest trace over the letter', () => {
    expect(judgeGlyph(traceInk(), ink, GUIDE).verdict).toBe('match');
  });

  it('rejects a scribble in the corner (position matters for letters)', () => {
    const corner = Array.from({ length: 60 }, (_, i) => ({
      x: 5 + (i % 6),
      y: 5 + Math.floor(i / 6),
    }));
    expect(judgeGlyph(corner, ink, GUIDE).verdict).toBe('scribble');
  });

  it('rejects a box-spanning zig-zag that crosses the ink only in passing', () => {
    const zig = Array.from({ length: 80 }, (_, i) => ({
      x: 10 + (i / 80) * 80,
      y: 10 + (i % 2) * 78,
    }));
    expect(judgeGlyph(zig, ink, GUIDE).verdict).toBe('scribble');
  });

  it('rejects when there is no ink to trace', () => {
    expect(judgeGlyph(traceInk(), [], GUIDE).verdict).toBe('scribble');
  });

  it('rejects with no guide box', () => {
    expect(judgeGlyph(traceInk(), ink, undefined).verdict).toBe('scribble');
  });
});
