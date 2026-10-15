import { useEffect, useRef } from 'react';
import { Art } from '../art';
import { WORDS, type WordCard } from '../data/content';
import { topLevel } from '../data/levels';
import { chimeGood, speak } from '../lib/speech';
import type { Ladder } from '../lib/skill';
import { EndCard, GameShell } from '../components/chrome';
import { pick, sample, shuffle } from '../lib/util';
import { useFlash } from '../hooks/useFlash';
import { useInstruction } from '../hooks/useInstruction';
import { useRounds } from '../hooks/useRounds';
import { GuideHand } from '../components/hint';

const ROUNDS = 5;
/** one shadow to find among three — among four at the top level */
const LADDER: Ladder = { top: topLevel('shadow'), chance: (level) => (level >= 2 ? 1 / 4 : 1 / 3) };

interface Board {
  target: WordCard;
  options: WordCard[];
}

function deal(level: number): Board {
  const target = pick(WORDS);
  const others = WORDS.filter((w) => w.art !== target.art);
  // higher levels pull decoys from the same category (cat vs lion is harder than cat vs bus)
  const sameKind = others.filter((w) => w.cat === target.cat);
  const nDecoys = level >= 2 ? 3 : 2;
  const pool = level >= 1 && sameKind.length >= nDecoys ? sameKind : others;
  return { target, options: shuffle([target, ...sample(pool, nDecoys)]) };
}

export default function Shadow({ onHome }: { onHome: () => void }) {
  const { board, round, done, solved, misses, miss, solve, restart } = useRounds('shadow', {
    rounds: ROUNDS,
    ladder: LADDER,
    deal,
  });
  const [wrong, flashWrong] = useFlash<string>();
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { target, options } = board;

  useInstruction('சரியான நிழலைத் தொடு', 'touch the matching shadow', [], !done);

  // Name the thing to find each round. On the opening round it follows the
  // instruction above instead of cutting it off; later rounds interrupt.
  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(
      () => speak(`${target.ta} — நிழலைத் தொடு`, 'ta', { queue: round === 0 }),
      300,
    );
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, done]);

  const choose = (w: WordCard) => {
    if (solved) return;
    if (w.art === target.art) {
      chimeGood();
      speak(target.ta, 'ta');
      solve(900);
    } else {
      miss();
      flashWrong(w.art);
    }
  };

  return (
    <div className="relative h-full">
      <GameShell ta="நிழல்" en="shadow match" art="cat" onHome={onHome} tint="#B7E4C7">
        <div ref={layerRef} className="relative grow flex flex-col min-h-0">
          <GuideHand
            fireSignal={misses}
            target={() => optRefs.current[target.art] ?? null}
            layerRef={layerRef}
            guideKey="shadow"
            active={!solved && !done}
          />
          <div className="flex justify-center py-2">
            <button
              className="sticker p-4 anim-pop active:scale-95 transition-transform"
              onClick={() => speak(target.ta, 'ta')}
              aria-label={target.ta}
            >
              <Art id={target.art} size={Math.min(150, window.innerWidth * 0.34)} />
            </button>
          </div>
          <div
            className={`relative grid ${options.length === 3 ? 'grid-cols-3 max-w-md' : 'grid-cols-2 max-w-sm'} gap-3 grow content-center w-full mx-auto`}
          >
            {options.map((w) => (
              <button
                key={w.art}
                ref={(el) => {
                  optRefs.current[w.art] = el;
                }}
                onClick={() => choose(w)}
                className={`sticker aspect-square p-2 flex items-center justify-center transition-transform active:scale-95 ${wrong === w.art ? 'anim-wiggle' : ''} ${
                  misses >= 2 && w.art === target.art && !solved ? 'anim-hint' : ''
                }`}
                aria-label="shadow option"
              >
                <div className={solved && w.art === target.art ? '' : 'shadowify'}>
                  <Art id={w.art} size={88} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </GameShell>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
