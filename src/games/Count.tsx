import { useRef, useState } from 'react';
import { Art } from '../art';
import { NUMBERS, WORDS, type WordCard } from '../data/content';
import { chimeGood, speak, speakPair } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { HAND_FONT, pick, sample, shuffle } from '../lib/util';
import { useFlash } from '../hooks/useFlash';
import { useFrozenLevel } from '../hooks/useFrozenLevel';
import { useInstruction } from '../hooks/useInstruction';
import { useRounds } from '../hooks/useRounds';
import { useTimers } from '../hooks/useTimers';
import { GuideHand } from '../components/hint';

const ROUNDS = 5;

function rangeFor(level: number): [number, number] {
  if (level === 0) return [1, 3];
  if (level === 1) return [2, 5];
  if (level === 2) return [3, 7];
  return [5, 10];
}

interface Board {
  word: WordCard;
  n: number; // how many to count
  options: number[]; // the answer buttons
}

function deal(level: number): Board {
  const [lo, hi] = rangeFor(level);
  const n = lo + Math.floor(Math.random() * (hi - lo + 1));
  const near = NUMBERS.map((x) => x.n).filter(
    (x) => x !== n && x >= Math.max(1, lo - 1) && x <= hi + 1,
  );
  return { word: pick(WORDS), n, options: shuffle([n, ...sample(near, 2)]) };
}

/** "one fish", "three buses" — the English the voice echoes after the count */
function countEn(n: number, word: WordCard): string {
  const [one, many] = word.counting ?? [word.en, `${word.en}s`];
  return `${NUMBERS[n - 1].en} ${n === 1 ? one : many}`;
}

export default function Count({ onHome }: { onHome: () => void }) {
  const { settings } = useStore();
  const level = useFrozenLevel('count', 3);
  const [board, setBoard] = useState(() => deal(level));
  const [tapped, setTapped] = useState<number[]>([]);
  const [asking, setAsking] = useState(false);
  const { round, done, solved, misses, miss, solve, restart } = useRounds('count', ROUNDS, () => {
    setBoard(deal(level));
    setTapped([]);
    setAsking(false);
  });
  const [wrong, flashWrong] = useFlash<number>();
  const { later } = useTimers();
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const answerRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const { word, n, options } = board;
  const question = 'எத்தனை ' + word.ta + '?';

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
    const next = [...tapped, i];
    speak(NUMBERS[next.length - 1].ta, 'ta');
    chimeGood();
    setTapped(next);
    if (next.length === n) {
      later(() => {
        setAsking(true);
        speak(question, 'ta');
      }, 700);
    }
  };

  const answer = (v: number) => {
    if (solved) return;
    if (v === n) {
      chimeGood();
      speakPair(`${n} ${word.ta}!`, countEn(n, word), settings.english);
      solve(900);
    } else {
      miss();
      flashWrong(v);
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
            active={!solved && !done}
            fireSignal={misses}
          />
          <div
            className={`grid gap-3 w-full mx-auto ${cols === 2 ? 'grid-cols-2 max-w-xs' : cols === 3 ? 'grid-cols-3 max-w-md' : 'grid-cols-4 max-w-md'}`}
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
                onClick={() => speak(question, 'ta')}
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
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
