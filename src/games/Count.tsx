import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { NUMBERS, WORDS, type WordCard } from '../data/content';
import { chimeGood, chimeSoft, speak, speakPair } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { HAND_FONT, sample, shuffle } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand } from '../components/hint';

const ROUNDS = 5;

function rangeFor(level: number): [number, number] {
  if (level === 0) return [1, 3];
  if (level === 1) return [2, 5];
  if (level === 2) return [3, 7];
  return [5, 10];
}

export default function Count({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome, settings } = useStore();
  const level = levelFor('count', 3);
  const [round, setRound] = useState(0);
  const [word, setWord] = useState<WordCard>(() => sample(WORDS, 1)[0]);
  const [n, setN] = useState(2);
  const [tapped, setTapped] = useState<number[]>([]);
  const [asking, setAsking] = useState(false);
  const [options, setOptions] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [ended, setEnded] = useState(false);
  const done = ended || round >= ROUNDS;
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const answerRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    const [lo, hi] = rangeFor(level);
    const count = lo + Math.floor(Math.random() * (hi - lo + 1));
    setWord(sample(WORDS, 1)[0]);
    setN(count);
    setTapped([]);
    setAsking(false);
    setMisses(0);
    itemRefs.current = [];
    answerRefs.current = {};
    const others = NUMBERS.map((x) => x.n).filter(
      (x) => x !== count && x >= Math.max(1, lo - 1) && x <= hi + 1,
    );
    setOptions(shuffle([count, ...sample(others, 2)]));
  }, [round, level]);

  // the hand always points at the NEXT thing to do: next uncounted item, then the answer.
  // resolved lazily at fire time so freshly mounted buttons are never stale.
  const resolveGuide = () => {
    if (asking) return answerRefs.current[n] ?? null;
    const nextIdx = Array.from({ length: n }).findIndex((_, i) => !tapped.includes(i));
    return nextIdx >= 0 ? (itemRefs.current[nextIdx] ?? null) : null;
  };

  useInstruction('ஒவ்வொன்றாகத் தொட்டு எண்ணு', 'tap each one to count', [round], !done);

  const tap = (i: number) => {
    if (asking || tapped.includes(i)) return;
    const k = tapped.length + 1;
    const num = NUMBERS[k - 1];
    speak(num.ta, 'ta');
    chimeGood();
    const next = [...tapped, i];
    setTapped(next);
    if (next.length === n) {
      window.setTimeout(() => {
        setAsking(true);
        speak('எத்தனை ' + word.ta + '?', 'ta');
      }, 700);
    }
  };

  const answer = (v: number) => {
    if (v === n) {
      chimeGood();
      recordOutcome('count', misses === 0);
      const num = NUMBERS[n - 1];
      if (settings.english) speakPair(`${n} ${word.ta}!`, `${num.en} ${word.en}s`, true);
      else speak(`${n} ${word.ta}!`, 'ta');
      window.setTimeout(() => {
        // last round: end here — no phantom question behind the end card
        if (round + 1 >= ROUNDS) {
          recordWin('count');
          setEnded(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 900);
    } else {
      chimeSoft();
      setWrong(v);
      setMisses((m) => m + 1);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  const cols = n <= 4 ? 2 : n <= 6 ? 3 : 4;
  // touch targets scale up a little on big tablet screens so items stay grabbable
  const itemArt = Math.max(n > 6 ? 64 : 84, Math.min(132, Math.round(window.innerWidth * 0.2)));

  return (
    <div className="relative h-full">
      <GameShell ta="எண்ணிக்கை" en="counting" art="apple" onHome={onHome} tint="#A9D6E5">
        <div ref={layerRef} className="relative grow flex flex-col justify-center min-h-0 gap-4">
          <GuideHand
            target={resolveGuide}
            layerRef={layerRef}
            guideKey="count"
            active={!done}
            fireSignal={misses}
          />
          <div
            className={`grid gap-3 w-full max-w-md mx-auto ${cols === 2 ? 'grid-cols-2 max-w-xs' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}
          >
            {Array.from({ length: n }).map((_, i) => {
              const k = tapped.indexOf(i);
              const isCounted = k >= 0;
              return (
                <button
                  key={i}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  onClick={() => tap(i)}
                  className="relative p-1 active:scale-90 transition-transform flex items-center justify-center"
                  aria-label={`${word.ta} ${i + 1}`}
                >
                  <div
                    className={isCounted ? 'relative' : 'relative anim-float'}
                    style={{
                      ['--rot' as string]: `${(i % 3) - 1}deg`,
                      animationDelay: `${i * 0.4}s`,
                    }}
                  >
                    <Art id={word.art} size={itemArt} />
                    {/* number badge anchored to the item's corner — clearly belongs to it */}
                    {isCounted && (
                      <span
                        className="absolute -top-1.5 -right-1.5 anim-pop w-9 h-9 rounded-full bg-salmon text-white text-xl flex items-center justify-center border-2 border-plum shadow"
                        style={{ fontFamily: HAND_FONT }}
                      >
                        {k + 1}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {asking && (
            <div className="anim-fade-up">
              <button
                className="sticker mx-auto mb-2 px-5 py-2 flex items-center justify-center gap-2 font-display font-bold text-2xl text-plum"
                onClick={() => speak('எத்தனை ' + word.ta + '?', 'ta')}
              >
                எத்தனை <Art id={word.art} size={34} /> ?
              </button>
              <div className="flex justify-center gap-3">
                {options.map((v) => (
                  <button
                    key={v}
                    ref={(el) => {
                      answerRefs.current[v] = el;
                    }}
                    onClick={() => answer(v)}
                    className={`btn-chunky !min-w-20 !min-h-20 !text-3xl bg-sun ${wrong === v ? 'anim-wiggle' : ''} ${misses >= 2 && v === n ? 'anim-hint' : ''}`}
                    style={{ fontFamily: HAND_FONT }}
                  >
                    {v}
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
