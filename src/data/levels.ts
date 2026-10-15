import type { GameId } from './content';

/**
 * What each level of each game asks of her, easiest first — one place, so the
 * parents' corner can say in plain words where she is, and so a game's ladder
 * and its description can never disagree about how many levels there are.
 * Levels are chosen from her own answers (see lib/skill.ts); age only picks
 * where a brand-new game starts.
 */
export const LEVELS: Record<GameId, readonly string[]> = {
  draw: ['circle, square, 1, 2, அ', 'rectangle, oval, 3–5, ஆ', 'star, heart, A–C', 'இ'],
  bubbles: [
    'colours, big & slow',
    'shapes',
    'numbers 1–5, a little quicker',
    'numbers 1–10, quick',
  ],
  words: ['2 pictures', '3 pictures', '3 of a kind', '4 of a kind'],
  sort: ['2 colours', '3 colours', 'by shape', 'animals vs food'],
  shadow: ['3 shadows', '3 of a kind', '4 of a kind'],
  odd: ['find the same', 'two alike, one odd', 'odd colour', 'odd kind, from 4'],
  pattern: ['copy a pattern', 'AB — what next?', 'AAB / ABB', 'ABC / AABB'],
  count: ['1–3', '2–5', '3–7', '5–10'],
  sizes: ['3 sizes', '4 sizes', '5 sizes'],
  emotions: ['2 faces', '3 faces', '4 faces', '4 look-alike faces'],
};

/** the hardest level of a game (levels run 0 … top) */
export const topLevel = (id: GameId) => LEVELS[id].length - 1;

/** one level of a "find the picture" game: how many pictures, and how alike */
export interface FindLevel {
  options: number;
  /** the wrong pictures are the answer's own kind — the hard version */
  alike?: boolean;
}

/** words: more pictures, then pictures of the same kind (cat vs lion, not cat vs bus) */
export const WORD_FIND: readonly FindLevel[] = [
  { options: 2 },
  { options: 3 },
  { options: 3, alike: true },
  { options: 4, alike: true },
];

/** feelings: more faces, then faces from the same family (sad vs angry) */
export const FEELING_FIND: readonly FindLevel[] = [
  { options: 2 },
  { options: 3 },
  { options: 4 },
  { options: 4, alike: true },
];
