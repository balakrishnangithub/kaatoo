/**
 * listen.ts — the rounds of "listen closely", by how alike the pictures'
 * names sound. Pure, so the ladder is unit-tested.
 *
 *   apart  the names start with different sounds (and are different kinds of thing)
 *   onset  the names start with the same sound — பூனை, பந்து, பலூன்
 *   pair   the names are one sound apart — பல் / பால், கல் / கால், மலை / மாலை
 */
import { MINIMAL_PAIRS, PAIR_WORDS, WORDS, type WordCard } from '../data/content';
import { LISTEN_FIND } from '../data/levels';
import { pick, samplePreferring, shuffle } from './util';

/** every word the game can say: the first words, and the one-sound-apart pairs */
export const LISTEN_WORDS: readonly WordCard[] = [...WORDS, ...PAIR_WORDS];

/** the sound a word starts with: its first Tamil letter (பூனை, பந்து → ப) */
export const onset = (w: WordCard) => w.ta[0];

/** the word one sound away from this one, if it has one */
export function partnerOf(w: WordCard): WordCard | undefined {
  const pair = MINIMAL_PAIRS.find((p) => p.includes(w.art));
  const other = pair?.find((a) => a !== w.art);
  return LISTEN_WORDS.find((x) => x.art === other);
}

export interface ListenRound {
  target: WordCard;
  options: WordCard[];
}

/** a fresh round at `level` (see LISTEN_FIND) */
export function dealListen(level: number): ListenRound {
  const { options, near } = LISTEN_FIND[level];
  const n = options - 1;
  const all = [...LISTEN_WORDS];
  if (near === 'pair') {
    const target = pick(PAIR_WORDS);
    const partner = partnerOf(target)!;
    const rest = all.filter((w) => w !== target && w !== partner);
    return { target, options: shuffle([target, partner, ...samplePreferring([], rest, n - 1)]) };
  }
  if (near === 'onset') {
    // a word whose first sound enough others share for this level — but not
    // its own one-sound-apart partner: that is the next level's question
    const sameStart = (w: WordCard) =>
      all.filter((x) => x !== w && x !== partnerOf(w) && onset(x) === onset(w));
    const target = pick(all.filter((w) => sameStart(w).length >= n));
    return { target, options: shuffle([target, ...samplePreferring(sameStart(target), [], n)]) };
  }
  // the easy levels: nothing sounds alike, and nothing is the same kind of thing either
  const target = pick(all);
  const apart = all.filter((x) => onset(x) !== onset(target));
  const unlike = apart.filter((x) => x.cat !== target.cat);
  return { target, options: shuffle([target, ...samplePreferring(unlike, apart, n)]) };
}
