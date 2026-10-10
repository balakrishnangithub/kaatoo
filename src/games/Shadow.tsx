import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { WORDS, type WordCard } from '../data/content';
import { chimeGood, chimeSoft, speak } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { sample, shuffle } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand } from '../components/hint';

const ROUNDS = 5;

export default function Shadow({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome } = useStore();
  const level = levelFor('shadow', 2);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<WordCard | null>(null);
  const [options, setOptions] = useState<WordCard[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [solved, setSolved] = useState(false);
  const [ended, setEnded] = useState(false);
  const done = ended || round >= ROUNDS;
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (round >= ROUNDS) return; // game over — no phantom question speech
    const t = sample(WORDS, 1)[0];
    // higher levels pull decoys from the same category (cat vs lion is harder than cat vs bus)
    const pool =
      level >= 1
        ? WORDS.filter((w) => w.cat === t.cat && w.art !== t.art)
        : WORDS.filter((w) => w.art !== t.art);
    const nOpts = level >= 2 ? 4 : 3;
    setTarget(t);
    setOptions(
      shuffle([
        t,
        ...sample(
          pool.length >= nOpts - 1 ? pool : WORDS.filter((w) => w.art !== t.art),
          nOpts - 1,
        ),
      ]),
    );
    setSolved(false);
    setMisses(0);
    const id = window.setTimeout(() => speak(`${t.ta} — நிழலைத் தொடு`, 'ta'), 300);
    return () => window.clearTimeout(id);
  }, [round, level]);

  useInstruction('சரியான நிழலைத் தொடு', 'touch the matching shadow', [], !done);

  const choose = (w: WordCard) => {
    if (!target || solved) return;
    if (w.art === target.art) {
      chimeGood();
      setSolved(true);
      speak(target.ta, 'ta');
      recordOutcome('shadow', misses === 0);
      window.setTimeout(() => {
        // last round: end here — no phantom question behind the end card
        if (round + 1 >= ROUNDS) {
          recordWin('shadow');
          setEnded(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 900);
    } else {
      chimeSoft();
      setWrong(w.art);
      setMisses((m) => m + 1);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <div className="relative h-full">
      <GameShell ta="நிழல்" en="shadow match" art="cat" onHome={onHome} tint="#B7E4C7">
        <div ref={layerRef} className="relative grow flex flex-col min-h-0">
          {target && (
            <div className="grow flex flex-col min-h-0">
              <GuideHand
                fireSignal={misses}
                target={() => (target ? (optRefs.current[target.art] ?? null) : null)}
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
                className={`relative grid ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2 max-w-sm'} gap-3 grow content-center w-full max-w-md mx-auto`}
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
          )}
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
