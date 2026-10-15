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
  sounds: ['2 pictures', '3 pictures', '3 of a kind', '4 of a kind'],
  voices: [
    'two octaves apart',
    'one octave apart',
    '7 notes apart',
    '5 notes apart',
    '3 notes apart',
    '2 notes apart',
    '1 note apart',
  ],
  listen: [
    'words that sound different, 2 pictures',
    'words that sound different, 3 pictures',
    'same first sound, 2 pictures',
    'same first sound, 3 pictures',
    'one sound apart (பல் / பால்)',
  ],
  drums: [
    'drum along, at her own pace',
    'drum along, a little faster',
    'drum along, a little slower',
    'echo 2 beats',
    'echo 3 beats',
    'echo a long–short rhythm',
  ],
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

/** what's that sound: more pictures, then pictures of the same kind (animal among animals) */
export const SOUND_FIND: readonly FindLevel[] = [
  { options: 2 },
  { options: 3 },
  { options: 3, alike: true },
  { options: 4, alike: true },
];

/** one level of "listen closely": how many pictures, and how alike their names sound */
export interface ListenLevel {
  options: number;
  /** 'apart': names start differently · 'onset': the same first sound · 'pair': one sound apart */
  near: 'apart' | 'onset' | 'pair';
}
export const LISTEN_FIND: readonly ListenLevel[] = [
  { options: 2, near: 'apart' },
  { options: 3, near: 'apart' },
  { options: 2, near: 'onset' },
  { options: 3, near: 'onset' },
  { options: 2, near: 'pair' },
];
