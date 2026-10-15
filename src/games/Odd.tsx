import { useRef } from 'react';
import { Art, type ArtId } from '../art';
import { CATEGORIES, COLORS, SHAPES, WORDS, type Category } from '../data/content';
import { topLevel } from '../data/levels';
import { chimeGood, speak } from '../lib/speech';
import type { Ladder } from '../lib/skill';
import { EndCard, GameShell } from '../components/chrome';
import { pick, sample, shuffle } from '../lib/util';
import { useFlash } from '../hooks/useFlash';
import { useInstruction } from '../hooks/useInstruction';
import { useRounds } from '../hooks/useRounds';
import { GuideHand } from '../components/hint';

/*
 Developmental ladder (matching precedes oddity — identical matching emerges
 ~24–28 months, category/salient oddity later):
   level 0 · MATCH: "find the SAME" — model card + field of 3 (identical target,
             obviously different distractors). Match-to-sample, the entry point.
   level 1 · SALIENT ODD: two IDENTICAL tiles + one from a totally different
             category (cat, cat, apple) — the oddity is unmistakable.
   level 2 · COLOR ODD: same shape, one in a different color (perceptual).
   level 3 · SUBTLE ODD: 4 tiles, same broad kind, one different category
             (three animals and a fruit, all different pictures).
*/
const ROUNDS = 5;
/** one tile to find among three — among four at the top level */
const LADDER: Ladder = { top: topLevel('odd'), chance: (level) => (level >= 3 ? 1 / 4 : 1 / 3) };

interface Tile {
  key: string;
  art: ArtId;
  fill?: string;
  /** the tile to tap — the different one, or at level 0 the one matching the model */
  odd: boolean;
  ta: string;
}

interface RoundData {
  tiles: Tile[];
  model: { art: ArtId; ta: string } | null; // level 0 only
  promptTa: string;
  promptEn: string;
}

const wordsIn = (cat: Category) => WORDS.filter((w) => w.cat === cat);
/** two different categories: the one most tiles share, and the odd tile's */
const twoKinds = () => sample(CATEGORIES, 2).map((c) => c.id);

function build(level: number): RoundData {
  if (level === 0) {
    // find the same as the model
    const target = pick(WORDS);
    const distractors = sample(
      WORDS.filter((w) => w.cat !== target.cat),
      2,
    );
    return {
      tiles: shuffle([
        { key: 'match', art: target.art, odd: true, ta: target.ta },
        ...distractors.map((w, i) => ({ key: `d${i}`, art: w.art, odd: false, ta: w.ta })),
      ]),
      model: { art: target.art, ta: target.ta },
      promptTa: 'இதே மாதிரி எது?',
      promptEn: 'find the same one',
    };
  }
  if (level === 1) {
    // two identical + one from another world
    const [sameKind, oddKind] = twoKinds();
    const same = pick(wordsIn(sameKind));
    const odd = pick(wordsIn(oddKind));
    return {
      tiles: shuffle([
        { key: 'a', art: same.art, odd: false, ta: same.ta },
        { key: 'b', art: same.art, odd: false, ta: same.ta },
        { key: 'odd', art: odd.art, odd: true, ta: odd.ta },
      ]),
      model: null,
      promptTa: 'வேறு எது?',
      promptEn: 'which one is different?',
    };
  }
  if (level === 2) {
    // same shape, one a different color
    const shape = pick(SHAPES);
    const [base, other] = sample(COLORS, 2);
    return {
      tiles: shuffle([
        ...[0, 1, 2].map((i) => ({
          key: `s${i}`,
          art: shape.id,
          fill: base.hex,
          odd: false,
          ta: base.ta,
        })),
        { key: 'odd', art: shape.id, fill: other.hex, odd: true, ta: other.ta },
      ]),
      model: null,
      promptTa: 'வேறு நிறம் எது?',
      promptEn: 'which color is different?',
    };
  }
  // level 3: same broad kind, one different category, all different pictures
  const [sameKind, oddKind] = twoKinds();
  const odd = pick(wordsIn(oddKind));
  return {
    tiles: shuffle([
      ...sample(wordsIn(sameKind), 3).map((w) => ({
        key: w.art,
        art: w.art,
        odd: false,
        ta: w.ta,
      })),
      { key: odd.art, art: odd.art, odd: true, ta: odd.ta },
    ]),
    model: null,
    promptTa: 'யார் வேறுபட்டவர்?',
    promptEn: 'who does not belong?',
  };
}

export default function Odd({ onHome }: { onHome: () => void }) {
  const {
    board: data,
    level,
    round,
    done,
    solved,
    misses,
    miss,
    solve,
    restart,
  } = useRounds('odd', { rounds: ROUNDS, ladder: LADDER, deal: build });
  const [wrong, flashWrong] = useFlash<string>();
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const target = data.tiles.find((t) => t.odd);
  // after two misses at the salient level, the identical pair pulses together —
  // showing sameness is the clue, instead of pointing at the answer outright
  const demoPair = level === 1 && misses >= 2;

  useInstruction(data.promptTa, data.promptEn, [round], !done);

  const choose = (t: Tile) => {
    if (solved) return;
    if (t.odd) {
      chimeGood();
      speak('சரி! ' + t.ta, 'ta');
      solve(750);
    } else {
      miss();
      flashWrong(t.key);
      // …and the voice names the pair along with the pulse
      if (level === 1 && misses + 1 >= 2) speak(`${t.ta}, ${t.ta} — இவை ஒன்னு!`, 'ta');
    }
  };

  return (
    <div className="relative h-full">
      <GameShell ta="யார் வேறு?" en="same & different" art="lion" onHome={onHome} tint="#F5CAC3">
        <div ref={layerRef} className="relative grow flex flex-col min-h-0">
          <GuideHand
            target={() => (target ? (optRefs.current[target.key] ?? null) : null)}
            layerRef={layerRef}
            guideKey="odd"
            active={!solved && !done}
            fireSignal={misses}
          />
          {/* level 0: the model to match */}
          {data.model && (
            <div className="flex flex-col items-center gap-1 py-1">
              <button
                className="sticker p-3 anim-pop active:scale-95 transition-transform"
                onClick={() => speak(data.model!.ta, 'ta')}
                aria-label={data.model.ta}
              >
                <Art id={data.model.art} size={Math.min(120, window.innerWidth * 0.28)} />
              </button>
              <div className="font-display font-bold text-plum text-lg">{data.promptTa}</div>
            </div>
          )}
          <div
            className={`relative grid ${data.tiles.length <= 3 ? 'grid-cols-3 max-w-md' : 'grid-cols-2 max-w-sm'} gap-3 grow content-center w-full mx-auto`}
          >
            {data.tiles.map((t) => (
              <button
                key={t.key}
                ref={(el) => {
                  optRefs.current[t.key] = el;
                }}
                onClick={() => choose(t)}
                className={`sticker aspect-square p-3 flex items-center justify-center transition-transform active:scale-95 ${wrong === t.key ? 'anim-wiggle' : ''} ${
                  demoPair && !t.odd ? 'anim-hint' : ''
                }`}
              >
                <Art id={t.art} size={92} fill={t.fill} />
              </button>
            ))}
          </div>
        </div>
      </GameShell>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
