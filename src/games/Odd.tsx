import { useEffect, useRef, useState } from 'react';
import { ART, Art, type ArtId } from '../art';
import { COLORS, SHAPES, WORDS } from '../data/content';
import { chimeGood, chimeSoft, speak } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { sample } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
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

interface Tile {
  key: string;
  art: ArtId;
  fill?: string;
  odd: boolean;
  ta: string;
}

interface RoundData {
  tiles: Tile[];
  model: { art: ArtId; fill?: string; ta: string } | null; // level 0 only
  promptTa: string;
  promptEn: string;
}

function build(level: number): RoundData {
  if (level === 0) {
    // find the same as the model
    const target = sample(WORDS, 1)[0];
    const distractors = sample(
      WORDS.filter((w) => w.cat !== target.cat),
      2,
    );
    const tiles: Tile[] = [
      { key: 'match', art: target.art, odd: true, ta: target.ta },
      ...distractors.map((w, i) => ({ key: `d${i}`, art: w.art, odd: false, ta: w.ta })),
    ];
    return {
      tiles: sample(tiles, 3),
      model: { art: target.art, ta: target.ta },
      promptTa: 'இதே மாதிரி எது?',
      promptEn: 'find the same one',
    };
  }
  if (level === 1) {
    // two identical + one from another world
    const cats = ['animal', 'food', 'thing', 'nature'] as const;
    const oddCat = sample([...cats], 1)[0];
    const sameCat = sample(
      cats.filter((c) => c !== oddCat),
      1,
    )[0];
    const sameW = sample(
      WORDS.filter((w) => w.cat === sameCat),
      1,
    )[0];
    const oddW = sample(
      WORDS.filter((w) => w.cat === oddCat),
      1,
    )[0];
    const tiles: Tile[] = [
      { key: 'a', art: sameW.art, odd: false, ta: sameW.ta },
      { key: 'b', art: sameW.art, odd: false, ta: sameW.ta },
      { key: 'odd', art: oddW.art, odd: true, ta: oddW.ta },
    ];
    return {
      tiles: sample(tiles, 3),
      model: null,
      promptTa: 'வேறு எது?',
      promptEn: 'which one is different?',
    };
  }
  if (level === 2) {
    // same shape, one a different color
    const shape = sample(SHAPES, 1)[0];
    const colors = sample(COLORS, 2);
    const tiles: Tile[] = [0, 1, 2].map((i) => ({
      key: `s${i}`,
      art: shape.id,
      fill: colors[0].hex,
      odd: false,
      ta: colors[0].ta,
    }));
    tiles.splice(Math.floor(Math.random() * 4), 0, {
      key: 'odd',
      art: shape.id,
      fill: colors[1].hex,
      odd: true,
      ta: colors[1].ta,
    });
    return {
      tiles,
      model: null,
      promptTa: 'வேறு நிறம் எது?',
      promptEn: 'which color is different?',
    };
  }
  // level 3: same broad kind, one different category, all different pictures
  const cats = ['animal', 'food', 'thing', 'nature'] as const;
  const oddCat = sample([...cats], 1)[0];
  const sameCat = sample(
    cats.filter((c) => c !== oddCat),
    1,
  )[0];
  const same = sample(
    WORDS.filter((w) => w.cat === sameCat),
    3,
  );
  const odd = sample(
    WORDS.filter((w) => w.cat === oddCat),
    1,
  )[0];
  const tiles: Tile[] = [
    ...same.map((w) => ({ key: w.art, art: w.art, odd: false, ta: w.ta })),
    { key: odd.art, art: odd.art, odd: true, ta: odd.ta },
  ];
  return {
    tiles: sample(tiles, 4),
    model: null,
    promptTa: 'யார் வேறுபட்டவர்?',
    promptEn: 'who does not belong?',
  };
}

export default function Odd({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome } = useStore();
  const level = levelFor('odd', 3);
  const [round, setRound] = useState(0);
  const [data, setData] = useState<RoundData>(() => build(0));
  const [wrong, setWrong] = useState<string | null>(null);
  const missesRef = useRef(0);
  const [misses, setMisses] = useState(0);
  const [demoPair, setDemoPair] = useState(false); // level 1: the identical pair pulses together
  const [ended, setEnded] = useState(false);
  const done = ended || round >= ROUNDS;

  useEffect(() => {
    setData(build(level));
    setMisses(0);
    missesRef.current = 0;
    setDemoPair(false);
  }, [round, level]);

  const d = data;
  useInstruction(d.promptTa, d.promptEn, [round], !done);

  // after two misses at the salient level, the identical pair pulses together —
  // showing sameness is the clue, instead of pointing at the answer outright
  useEffect(() => {
    if (level === 1 && misses >= 2) {
      setDemoPair(true);
      const sameTa = d.tiles.find((t) => !t.odd)?.ta;
      if (sameTa) speak(`${sameTa}, ${sameTa} — இவை ஒன்னு!`, 'ta');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [misses]);

  const choose = (t: Tile) => {
    if (t.odd) {
      chimeGood();
      speak('சரி! ' + t.ta, 'ta');
      recordOutcome('odd', missesRef.current === 0);
      window.setTimeout(() => {
        // last round: end here — no phantom question behind the end card
        if (round + 1 >= ROUNDS) {
          recordWin('odd');
          setEnded(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 750);
    } else {
      chimeSoft();
      setWrong(t.key);
      missesRef.current += 1;
      setMisses((m) => m + 1);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  const cols = d.tiles.length <= 3 ? 3 : 2;
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const targetTile = d.tiles.find((t) => t.odd);

  return (
    <div className="relative h-full">
      <GameShell ta="யார் வேறு?" en="same & different" art="lion" onHome={onHome} tint="#F5CAC3">
        <div ref={layerRef} className="relative grow flex flex-col min-h-0">
          <GuideHand
            target={() => (targetTile ? (optRefs.current[targetTile.key] ?? null) : null)}
            layerRef={layerRef}
            guideKey="odd"
            active={!done && d.tiles.length > 0}
            fireSignal={misses}
          />
          {/* level 0: the model to match */}
          {d.model && (
            <div className="flex flex-col items-center gap-1 py-1">
              <button
                className="sticker p-3 anim-pop active:scale-95 transition-transform"
                onClick={() => speak(d.model!.ta, 'ta')}
                aria-label={d.model.ta}
              >
                <Art id={d.model.art} size={Math.min(120, window.innerWidth * 0.28)} />
              </button>
              <div className="font-display font-bold text-plum text-lg">{d.promptTa}</div>
            </div>
          )}
          <div
            className={`relative grid ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2 max-w-sm'} gap-3 grow content-center w-full max-w-md mx-auto`}
          >
            {d.tiles.map((t) => {
              const C = ART[t.art] as React.ComponentType<{ size?: number; fill?: string }>;
              return (
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
                  <C size={92} fill={t.fill} />
                </button>
              );
            })}
          </div>
        </div>
      </GameShell>
      {done && (
        <EndCard
          onAgain={() => {
            setEnded(false);
            setRound(0);
          }}
          onHome={onHome}
        />
      )}
    </div>
  );
}
