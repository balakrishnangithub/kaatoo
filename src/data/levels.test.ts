import { describe, expect, it } from 'vitest';
import { ACTIVITIES } from './content';
import { FEELING_FIND, LEVELS, topLevel, WORD_FIND } from './levels';

/** what the parents' corner says about a game's levels must match the game */
describe('levels', () => {
  it('every activity describes its levels — at least two, each in words', () => {
    for (const a of ACTIVITIES) {
      expect(LEVELS[a.id].length).toBeGreaterThanOrEqual(2);
      for (const name of LEVELS[a.id]) expect(name.trim()).not.toBe('');
      expect(topLevel(a.id)).toBe(LEVELS[a.id].length - 1);
    }
  });

  it('the find games have exactly the levels they describe, getting harder', () => {
    for (const [id, table] of [
      ['words', WORD_FIND],
      ['emotions', FEELING_FIND],
    ] as const) {
      expect(table).toHaveLength(LEVELS[id].length);
      for (let i = 1; i < table.length; i++) {
        const [prev, cur] = [table[i - 1], table[i]];
        // each level adds a picture or makes the wrong ones look alike — never easier
        expect(cur.options >= prev.options).toBe(true);
        expect(cur.options > prev.options || (cur.alike && !prev.alike)).toBe(true);
      }
      expect(table[0].options).toBe(2); // two pictures to start: the gentlest choice
    }
  });
});
