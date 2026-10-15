import { describe, expect, it } from 'vitest';
import { DEFAULT_PACE, judgeEcho, judgeTogether, ownPace, PATTERNS } from './rhythm';

/** taps every `gap` ms, starting at `from` */
const steady = (n: number, gap: number, from = 1000) =>
  Array.from({ length: n }, (_, i) => from + i * gap);

describe('her own pace', () => {
  it('is the typical gap between her taps', () => {
    expect(ownPace(steady(7, 480))).toBe(480);
  });

  it('a stray double tap or a pause does not move it', () => {
    const taps = [1000, 1480, 1960, 2010, 2490, 2970, 4600, 5080];
    expect(ownPace(taps)).toBe(480);
  });

  it('stays within what small hands do', () => {
    expect(ownPace(steady(6, 250))).toBe(350);
    expect(ownPace(steady(6, 1300))).toBe(900);
  });

  it('too few taps: the usual toddler pace', () => {
    expect(ownPace([1000, 1500])).toBe(DEFAULT_PACE);
  });
});

describe('drumming along', () => {
  it("her pace matching the elephant's passes; her own, when it is faster, does not", () => {
    expect(judgeTogether(steady(8, 430), 425, 0.15)).toBe(true);
    expect(judgeTogether(steady(8, 500), 425, 0.15)).toBe(false);
  });

  it('needs a few taps, not one or two', () => {
    expect(judgeTogether(steady(3, 500), 500, 0.25)).toBe(false);
    expect(judgeTogether(steady(4, 500), 500, 0.25)).toBe(true);
  });

  it('is judged by the gaps alone: the same drumming passes on a phone with any delay', () => {
    for (const delay of [0, 40, 120, 250]) {
      expect(judgeTogether(steady(8, 430, 1000 + delay), 425, 0.15)).toBe(true);
    }
  });
});

describe('playing it back', () => {
  it('an even pattern: the right number of taps', () => {
    expect(judgeEcho(steady(2, 600), [0, 1])).toBe(true);
    expect(judgeEcho(steady(3, 600), [0, 1])).toBe(false);
    expect(judgeEcho(steady(2, 600), [0, 1, 2])).toBe(false);
  });

  it('a long–short rhythm: the long gap must come first, clearly longer', () => {
    const longShort = [0, 1, 1.5];
    expect(judgeEcho([1000, 1700, 2000], longShort)).toBe(true);
    expect(judgeEcho([1000, 1400, 1800], longShort)).toBe(false); // even
    expect(judgeEcho([1000, 1300, 2000], longShort)).toBe(false); // short–long
  });
});

describe('the ladder', () => {
  it('drumming together comes first, faster before slower, then the echoes', () => {
    expect(PATTERNS.map((p) => p.kind)).toEqual([
      'together',
      'together',
      'together',
      'echo',
      'echo',
      'echo',
    ]);
    const paces = PATTERNS.flatMap((p) => (p.kind === 'together' ? [p.pace] : []));
    expect(paces).toEqual([1, 0.85, 1.2]);
  });
});
