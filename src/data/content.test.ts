import { describe, expect, it } from 'vitest';
import {
  ACTIVITIES,
  CATEGORIES,
  COLORS,
  EMOTIONS,
  NUMBERS,
  PRAISE,
  PRAISE_EFFORT,
  SHAPES,
  WORDS,
} from './content';
import { ART } from '../art';

/**
 * Content integrity — the contract every game silently relies on.
 * These tests are the safety net for contributors editing words or artwork:
 * a typo here would otherwise surface only as a silent blank card for a child.
 */
describe('content integrity', () => {
  it('every activity points at artwork that exists', () => {
    for (const a of ACTIVITIES) expect(ART, `activity "${a.id}" art`).toHaveProperty(a.art);
  });

  it('activity ids are unique', () => {
    // (that every id has a game, and every game an id, is checked by the
    // compiler: the GAMES map in App.tsx is keyed by GameId)
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every word card points at artwork that exists and a known category', () => {
    const cats = new Set<string>(CATEGORIES.map((c) => c.id));
    for (const w of WORDS) {
      expect(ART, `word "${w.en}" art`).toHaveProperty(w.art);
      expect(cats.has(w.cat), `word "${w.en}" category`).toBe(true);
      expect(w.ta.trim().length, `word "${w.en}" has Tamil`).toBeGreaterThan(0);
    }
  });

  it('every category has artwork and at least three words (a find round needs three)', () => {
    for (const c of CATEGORIES) {
      expect(ART, `category "${c.id}" art`).toHaveProperty(c.art);
      expect(WORDS.filter((w) => w.cat === c.id).length, c.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('every shape and emotion points at artwork that exists', () => {
    for (const s of SHAPES) expect(ART, `shape "${s.id}"`).toHaveProperty(s.id);
    for (const e of EMOTIONS) expect(ART, `emotion "${e.en}"`).toHaveProperty(e.art);
  });

  it('colours are valid hex and bilingual', () => {
    for (const c of COLORS) {
      expect(c.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(c.ta.trim().length).toBeGreaterThan(0);
      expect(c.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('numbers run 1..10 in order with bilingual labels', () => {
    expect(NUMBERS.map((n) => n.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const n of NUMBERS) {
      expect(n.ta.trim().length).toBeGreaterThan(0);
      expect(n.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('there are at least 3 animals and 3 foods for the category sort', () => {
    expect(WORDS.filter((w) => w.cat === 'animal').length).toBeGreaterThanOrEqual(3);
    expect(WORDS.filter((w) => w.cat === 'food').length).toBeGreaterThanOrEqual(3);
  });

  it('every praise line has both its Tamil and the English that echoes it', () => {
    for (const p of [...PRAISE, ...PRAISE_EFFORT]) {
      expect(p.ta.trim().length).toBeGreaterThan(0);
      expect(p.en.trim().length, `English for "${p.ta}"`).toBeGreaterThan(0);
    }
  });

  it('words that do not pluralise with an "s" say how they are counted', () => {
    // the counting game echoes "three <thing>s" — these would come out wrong
    for (const w of WORDS) {
      if (/(s|sh|ch|x|o|y)$/.test(w.en) || w.en === 'fish')
        expect(w.counting, `"${w.en}" needs a counting form`).toBeDefined();
      if (w.counting) expect(w.counting).toHaveLength(2);
    }
  });
});
