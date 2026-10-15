import { describe, expect, it } from 'vitest';
import { dealListen, onset, partnerOf } from './listen';
import { LISTEN_FIND } from '../data/levels';
import { MINIMAL_PAIRS } from '../data/content';

const many = (level: number) => Array.from({ length: 200 }, () => dealListen(level));

describe('listen closely — how alike the names sound, level by level', () => {
  it("every round has the target once, and the level's number of pictures", () => {
    LISTEN_FIND.forEach((spec, level) => {
      for (const r of many(level)) {
        expect(r.options).toHaveLength(spec.options);
        expect(r.options.filter((o) => o === r.target)).toHaveLength(1);
        expect(new Set(r.options.map((o) => o.art)).size).toBe(spec.options);
      }
    });
  });

  it('the easy levels: no other name starts with the same sound', () => {
    for (const level of [0, 1])
      for (const r of many(level))
        for (const o of r.options) if (o !== r.target) expect(onset(o)).not.toBe(onset(r.target));
  });

  it('the middle levels: every name starts with the same sound', () => {
    for (const level of [2, 3])
      for (const r of many(level))
        for (const o of r.options) expect(onset(o)).toBe(onset(r.target));
  });

  it('the top level: the two names are one sound apart (பல் / பால்)', () => {
    for (const r of many(4)) {
      const other = r.options.find((o) => o !== r.target)!;
      expect(partnerOf(r.target)).toBe(other);
    }
  });

  it('the pairs really are one sound apart: the same letters, one vowel made long', () => {
    for (const [a, b] of MINIMAL_PAIRS) {
      const wa = partnerOf({ art: b } as never)!;
      const wb = partnerOf(wa)!;
      expect(wb.ta.replace('ா', '')).toBe(wa.ta.replace('ா', ''));
      expect([wa.art, wb.art].sort()).toEqual([a, b].sort());
    }
  });
});
