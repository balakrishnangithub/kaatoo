import { describe, expect, it } from 'vitest';
import { ageMonths, ageYears, birthDateFor, formatAge, isoDate, stageFromAge } from './age';
import { pick, sample, shuffle } from './util';

describe('age → developmental stage', () => {
  // a fixed "today", so these never depend on the day (or time zone) they run in
  const today = new Date(2026, 9, 14, 10, 30); // 14 Oct 2026, mid-morning

  /** the birth date of a child who is `years` years and `months` months old today */
  const born = (years: number, months = 0) =>
    isoDate(new Date(today.getFullYear() - years, today.getMonth() - months, today.getDate()));

  it('a 2-year-old is stage 0', () => expect(stageFromAge(born(2), today)).toBe(0));
  it('a 3½-year-old is stage 1', () => expect(stageFromAge(born(3, 6), today)).toBe(1));
  it('a 4½-year-old is stage 2', () => expect(stageFromAge(born(4, 6), today)).toBe(2));
  it('a 6-year-old is stage 3', () => expect(stageFromAge(born(6), today)).toBe(3));

  it('the stage changes on the birthday itself — not a day early, not a day late', () => {
    expect(stageFromAge('2023-10-15', today)).toBe(0); // turns three tomorrow
    expect(stageFromAge('2023-10-14', today)).toBe(1); // turns three today
    // …also in a span with no leap day, where averaging 365.25-day years is a day off
    const firstOfMarch = new Date(2027, 2, 1, 8, 0);
    expect(stageFromAge('2024-03-01', firstOfMarch)).toBe(1);
  });

  it('an invalid birth date safely falls back to the youngest stage', () => {
    expect(stageFromAge('not-a-date')).toBe(0);
    expect(ageYears('not-a-date')).toBe(2);
    expect(stageFromAge('')).toBe(0); // a cleared date field
  });

  it('a newborn is stage 0, never negative', () => {
    expect(stageFromAge(isoDate(today), today)).toBe(0);
    expect(ageMonths('2030-01-01', today)).toBe(0); // a date in the future
  });

  it('counts whole calendar months', () => {
    expect(ageMonths('2024-10-14', today)).toBe(24);
    expect(ageMonths('2024-10-15', today)).toBe(23); // one day short of the month
    expect(ageMonths('2024-01-31', new Date(2024, 1, 29))).toBe(0); // 31 Jan → 29 Feb
    expect(ageMonths('2024-01-31', new Date(2024, 2, 31))).toBe(2);
  });

  it('birthDateFor gives a child of exactly that age', () => {
    expect(birthDateFor(2, today)).toBe('2024-10-14');
    expect(ageYears(birthDateFor(2, today), today)).toBe(2);
    // 29 February has no twin in most years — clamp, do not roll into March
    expect(birthDateFor(2, new Date(2028, 1, 29))).toBe('2026-02-28');
  });

  describe('formatAge', () => {
    it('reads as years and months', () => {
      expect(formatAge('2024-03-14', today)).toBe('2 ஆண்டு 7 மாதம் · 2y 7m');
      expect(formatAge('2023-10-14', today)).toBe('3 வயது · 3 yr');
      expect(formatAge('2026-05-14', today)).toBe('5 மாதங்கள் · 5 months');
    });

    it('never says "12 months" — the fortnight before a birthday is still 11', () => {
      // 2 years, 11 months and 19 days: rounding the remainder used to give "2y 12m"
      expect(formatAge('2023-10-25', today)).toBe('2 ஆண்டு 11 மாதம் · 2y 11m');
    });
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
