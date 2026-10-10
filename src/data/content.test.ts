import { describe, expect, it } from 'vitest';
import { ACTIVITIES, COLORS, EMOTIONS, NUMBERS, SHAPES, WORDS } from './content';
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

  it('activity ids are unique and match the game registry keys', () => {
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    // keep in sync with the GAMES map in App.tsx
    expect([...ids].sort()).toEqual(
      [
        'bubbles',
        'count',
        'draw',
        'emotions',
        'odd',
        'pattern',
        'shadow',
        'sizes',
        'sort',
        'words',
      ].sort(),
    );
  });

  it('every word card points at artwork that exists and a known category', () => {
    const cats = new Set(['animal', 'food', 'thing', 'nature']);
    for (const w of WORDS) {
      expect(ART, `word "${w.en}" art`).toHaveProperty(w.art);
      expect(cats.has(w.cat), `word "${w.en}" category`).toBe(true);
      expect(w.ta.trim().length, `word "${w.en}" has Tamil`).toBeGreaterThan(0);
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
});
