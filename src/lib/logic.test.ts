import { describe, expect, it } from 'vitest';
import { ageYears, stageFromAge } from './age';
import { pick, sample, shuffle } from './util';

describe('age → developmental stage', () => {
  const yearsAgo = (y: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - y);
    return d.toISOString().slice(0, 10);
  };

  it('a 2-year-old is stage 0', () => expect(stageFromAge(yearsAgo(2))).toBe(0));
  it('a 3½-year-old is stage 1', () => expect(stageFromAge(yearsAgo(3))).toBe(1));
  it('a 4½-year-old is stage 2', () => expect(stageFromAge(yearsAgo(4))).toBe(2));
  it('a 6-year-old is stage 3', () => expect(stageFromAge(yearsAgo(6))).toBe(3));

  it('an invalid birth date safely falls back to the youngest stage', () => {
    expect(stageFromAge('not-a-date')).toBe(0);
    expect(ageYears('not-a-date')).toBe(2);
  });

  it('a newborn is stage 0, never negative', () => {
    expect(stageFromAge(new Date().toISOString().slice(0, 10))).toBe(0);
  });
});

describe('util — randomness helpers', () => {
  const src = [1, 2, 3, 4, 5, 6, 7, 8];

  it('shuffle keeps every element exactly once and does not mutate the input', () => {
    const copy = [...src];
    const out = shuffle(src);
    expect(src).toEqual(copy); // input untouched
    expect([...out].sort((a, b) => a - b)).toEqual(copy); // same members
    expect(out).not.toBe(src); // a new array
  });

  it('sample returns n distinct members of the source', () => {
    const s = sample(src, 3);
    expect(s).toHaveLength(3);
    expect(new Set(s).size).toBe(3);
    s.forEach((x) => expect(src).toContain(x));
  });

  it('pick always returns a member', () => {
    for (let i = 0; i < 50; i++) expect(src).toContain(pick(src));
  });

  it('sample of everything is a permutation', () => {
    expect([...sample(src, src.length)].sort((a, b) => a - b)).toEqual(src);
  });
});
