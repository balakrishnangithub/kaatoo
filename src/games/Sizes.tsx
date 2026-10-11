import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { WORDS, type WordCard } from '../data/content';
import { chimeGood, chimeSoft, speak } from '../lib/speech';
import { fitSizes, sizesFor } from '../lib/seriation';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { sample } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand } from '../components/hint';

/* seriation: tap items from biggest to smallest — a core early-math skill */
const ROUNDS = 4;

interface It {
  id: number;
  size: number;
}

export default function Sizes({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome } = useStore();
  const [round, setRound] = useState(0);
  const [word, setWord] = useState<WordCard>(() => sample(WORDS, 1)[0]);
  const [items, setItems] = useState<It[]>([]);
  const [nextRank, setNextRank] = useState(0); // 0 = biggest
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [ended, setEnded] = useState(false);
  const [ordered, setOrdered] = useState(false); // celebration: items slide into sorted order
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const preRects = useRef<Record<number, DOMRect>>({});
  const timersRef = useRef<number[]>([]); // every timeout we arm — restart/unmount disarms all
  const epochRef = useRef(0); // increments on restart — stale closures die with their epoch
  const done = ended || round >= ROUNDS;

  // Freeze the difficulty for the whole sitting. levelFor reads live store
  // state, so a level-up would otherwise retrigger the round effect MID-play
  // (level is a dep) and silently re-deal a bigger round — the "items changed
  // by themselves" bug. Snapshot once at mount; the new level applies next visit.
  const [level] = useState(() => levelFor('sizes', 2));

  // measured field width — artwork sizes adapt so the row never overflows
  const [fieldW, setFieldW] = useState(0);
  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFieldW(el.clientWidth));
    ro.observe(el);
    setFieldW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  /** Every timeout goes through here so a reset can disarm the whole batch. */
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timersRef.current.push(t);
  };
  const disarmAll = () => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  };
  useEffect(() => disarmAll, []); // unmount: nothing fires into a dead screen

  useEffect(() => {
    const sizes = sizesFor(level);
    setWord(sample(WORDS, 1)[0]);
    setItems(
      sizes
        .map((s, rank) => ({ id: rank, size: s, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ id, size }) => ({ id, size })),
    );
    setNextRank(0);
    setMisses(0);
    setOrdered(false);
  }, [round, level]);

  useInstruction(
    'பெரியதிலிருந்து சிறியது வரை தொடு',
    'tap from biggest to smallest',
    [round],
    !done,
  );

  // fitted artwork sizes + gap for the current field — computed once per render
  const fitted = fitSizes(sizesFor(level), fieldW || 360);

  // items carry id === rank (0 biggest)
  const tap = (it: It) => {
    if (done || ordered) return; // round over / celebrating — taps must not queue ghost timers
    if (it.id < nextRank) return; // already done
    if (it.id === nextRank) {
      chimeGood();
      speak(
        nextRank === 0 ? 'பெரியது!' : nextRank === items.length - 1 ? 'சிறியது!' : 'சரி!',
        'ta',
      );
      const nr = nextRank + 1;
      setNextRank(nr);
      if (nr >= items.length) {
        recordOutcome('sizes', misses === 0);
        const epoch = epochRef.current;
        // celebration: the row rearranges itself into biggest→smallest order
        // (FLIP: remember where each item is, reorder, glide them over)
        const rects: Record<number, DOMRect> = {};
        for (const it of items) {
          const el = itemRefs.current[it.id];
          if (el) rects[it.id] = el.getBoundingClientRect();
        }
        preRects.current = rects;
        later(() => {
          if (epoch !== epochRef.current) return; // restarted meanwhile
          setOrdered(true);
        }, 550);
        later(() => {
          if (epoch !== epochRef.current) return;
          // last round: end here — no phantom question behind the end card
          if (round + 1 >= ROUNDS) {
            recordWin('sizes');
            setEnded(true);
          } else {
            setRound((r) => r + 1);
          }
        }, 2600); // let the sorted row land — the celebration IS the reward
      }
    } else {
      chimeSoft();
      setWrong(it.id);
      setMisses((m) => m + 1);
      const epoch = epochRef.current;
      later(() => {
        if (epoch !== epochRef.current) return;
        setWrong(null);
      }, 450);
    }
  };

  return (
    <div className="relative h-full">
      <GameShell
        ta="பெரியது சிறியது"
        en="big to small"
        art="elephant"
        onHome={onHome}
        tint="#B7E4C7"
      >
        <div ref={layerRef} className="relative grow flex items-center justify-center min-h-0 py-4">
          {/* demonstrating hand points at the centre of the next-biggest one */}
          <GuideHand
            fireSignal={misses}
            target={() => itemRefs.current[nextRank] ?? null}
            layerRef={layerRef}
            guideKey="sizes"
            active={items.length > 0 && nextRank < items.length && !done}
          />
          <div className="flex items-end justify-center" style={{ gap: fitted.gap }}>
            {/* once she finishes, the items glide into biggest→smallest order —
                the arrangement itself becomes the reward (FLIP animation) */}
            {(ordered ? [...items].sort((a, b) => a.id - b.id) : items).map((it, idx) => {
              const cleared = it.id < nextRank;
              const displaySize = fitted.sizes[it.id] ?? it.size;
              return (
                <button
                  // round in the key: next round's object is a NEW element, not a
                  // morph of the old one — no cross-round animation/reuse glitches
                  key={`${round}-${it.id}`}
                  ref={(el) => {
                    const prev = itemRefs.current[it.id];
                    itemRefs.current[it.id] = el;
                    // FLIP: if this item just moved (reorder), glide from its old spot
                    if (ordered && el && prev && preRects.current[it.id]) {
                      const oldR = preRects.current[it.id];
                      const newR = el.getBoundingClientRect();
                      const dx = oldR.left - newR.left;
                      if (Math.abs(dx) > 1) {
                        el.style.transition = 'none';
                        el.style.transform = `translateX(${dx}px)`;
                        requestAnimationFrame(() => {
                          requestAnimationFrame(() => {
                            el.style.transition = `transform 0.55s cubic-bezier(0.3, 0.9, 0.3, 1.2) ${idx * 90}ms, opacity 0.4s`;
                            el.style.transform = '';
                          });
                        });
                      }
                    }
                  }}
                  onClick={() => tap(it)}
                  disabled={cleared || ordered}
                  className={`transition-all active:scale-95 ${wrong === it.id ? 'anim-wiggle' : ''} ${!ordered && misses >= 2 && it.id === nextRank ? 'anim-hint rounded-3xl' : ''} ${ordered ? 'cursor-default' : ''}`}
                  style={{ opacity: cleared && !ordered ? 0.25 : 1 }}
                  aria-label={`size ${it.id}`}
                >
                  <Art id={word.art} size={displaySize} />
                </button>
              );
            })}
          </div>
        </div>
      </GameShell>
      {done && (
        <EndCard
          onAgain={() => {
            epochRef.current += 1; // kill every pending round-advance/celebration timer…
            disarmAll(); // …so the fresh game is never auto-advanced by the old one
            setEnded(false);
            setRound(0);
          }}
          onHome={onHome}
        />
      )}
    </div>
  );
}
