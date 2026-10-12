import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { WORDS, type WordCard } from '../data/content';
import { chimeGood, chimeSoft, speak } from '../lib/speech';
import { fitSizes, sizesFor, staircaseSlots } from '../lib/seriation';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { sample } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand } from '../components/hint';

/* seriation: tap items from biggest to smallest — a core early-math skill.
   Design: SHE builds the staircase — each correct tap glides the item into
   its slot (biggest on the left). Nothing ever appears, vanishes, or
   rearranges by itself; every change is caused by her hand and visible. */
const ROUNDS = 4;

// choreography budget (ms): grow-in 500 → play → last glide 600 → bounce 800
// → hold 600 → row exits 700. Total after final tap ≈ 2600.
const T = { growIn: 500, glide: 600, bounce: 800, hold: 600, exit: 700 };

interface It {
  id: number; // rank: 0 = biggest
  size: number;
}

/** placed-then-happy → exiting → gone */
type Phase = 'play' | 'celebrate' | 'exit';

export default function Sizes({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome } = useStore();
  const [round, setRound] = useState(0);
  const [word, setWord] = useState<WordCard>(() => sample(WORDS, 1)[0]);
  const [items, setItems] = useState<It[]>([]);
  const [nextRank, setNextRank] = useState(0); // 0 = biggest
  const [wrong, setWrong] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [ended, setEnded] = useState(false);
  const [phase, setPhase] = useState<Phase>('play');
  const [shuffled, setShuffled] = useState(false); // false = staircase, true = spawn row
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const timersRef = useRef<number[]>([]); // every timeout we arm — restart/unmount disarms all
  const epochRef = useRef(0); // increments on restart — stale closures die with their epoch
  const done = ended || round >= ROUNDS;

  // Freeze the difficulty for the whole sitting. levelFor reads live store
  // state, so a level-up would otherwise retrigger the round effect MID-play
  // (level is a dep) and silently re-deal a bigger round — the "items changed
  // by themselves" bug. Snapshot once at mount; the new level applies next visit.
  const [level] = useState(() => levelFor('sizes', 2));

  // measured field — artwork sizes adapt so the row never overflows
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
    setWrong(null);
    setPhase('play');
    // spawn SHUFFLED (dealt to her), cut to the staircase on the first
    // correct tap; never spawn already-sorted — she must build that herself
    setShuffled(sizes.length > 1);
  }, [round, level]);

  useInstruction(
    'பெரியதிலிருந்து சிறியது வரை தொடு',
    'tap from biggest to smallest',
    [round],
    !done,
  );

  // fitted sizes + slots for both rows: the shuffled spawn row packs by
  // RENDER order, the staircase by rank. Gaps are per-count minimums —
  // a smaller item's button is as wide as its artwork is tall, so without
  // a real corridor a placed neighbour would swallow its taps.
  const fitted = fitSizes(sizesFor(level), fieldW || 360);
  const n = fitted.sizes.length;
  const slotGap = n <= 3 ? 12 : n === 4 ? 16 : 20;
  const stairSlots = staircaseSlots(fitted.sizes, slotGap);
  const spawnSlots = staircaseSlots(
    items.map((it) => fitted.sizes[it.id]),
    slotGap,
  );
  const slots = shuffled ? spawnSlots : stairSlots;
  const totalW = slots.length ? slots[slots.length - 1].x + slots[slots.length - 1].size / 2 : 0;

  // items carry id === rank (0 biggest)
  const tap = (it: It) => {
    if (done || phase !== 'play') return; // celebrating / leaving — no ghost timers
    if (it.id < nextRank) return; // already placed
    const el = itemRefs.current[it.id];
    if (it.id === nextRank) {
      chimeGood();
      speak(
        nextRank === 0 ? 'பெரியது!' : nextRank === items.length - 1 ? 'சிறியது!' : 'சரி!',
        'ta',
      );
      // FLIP the tapped item into its staircase slot. From the shuffled row
      // the whole row CUTS to the staircase at the same instant (staircase
      // slots can overlap spawn slots mid-glide — a placed item must never
      // cover a live one); inside the staircase slots never overlap, so the
      // glide stays visible for every later tap.
      if (el) {
        const startLeft = el.offsetLeft;
        const slotLeft = stairSlots[it.id].x - fitted.sizes[it.id] / 2;
        el.style.left = `${slotLeft}px`;
        el.style.transform = `translateX(${startLeft - slotLeft}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = `transform ${T.glide}ms cubic-bezier(0.3, 0.9, 0.3, 1.1)`;
            el.style.transform = '';
          });
        });
      }
      if (shuffled) setShuffled(false);
      const nr = nextRank + 1;
      setNextRank(nr);
      if (nr >= items.length) {
        recordOutcome('sizes', misses === 0);
        const epoch = epochRef.current;
        // staircase complete → it bounces once, holds, then leaves as one object
        later(() => {
          if (epoch !== epochRef.current) return;
          setPhase('celebrate');
        }, T.glide + 80);
        later(
          () => {
            if (epoch !== epochRef.current) return;
            setPhase('exit');
          },
          T.glide + T.bounce + T.hold,
        );
        later(
          () => {
            if (epoch !== epochRef.current) return;
            // last round: end here — no phantom question behind the end card
            if (round + 1 >= ROUNDS) {
              recordWin('sizes');
              setEnded(true);
            } else {
              setRound((r) => r + 1);
            }
          },
          T.glide + T.bounce + T.hold + T.exit + 80,
        );
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

  // entrance: left → right along the dealt row, one soft pop each
  const entranceDelay = (idx: number) => idx * 90;

  return (
    <div className="relative h-full">
      <GameShell
        ta="பெரியது சிறியது"
        en="big to small"
        art="elephant"
        onHome={onHome}
        tint="#B7E4C7"
      >
        <div ref={layerRef} className="relative grow min-h-0 py-4 overflow-hidden">
          {/* demonstrating hand points at the centre of the next-biggest one */}
          <GuideHand
            fireSignal={misses}
            target={() => itemRefs.current[nextRank] ?? null}
            layerRef={layerRef}
            guideKey="sizes"
            active={phase === 'play' && items.length > 0 && nextRank < items.length && !done}
          />
          <div
            className={`absolute inset-x-0 top-1/2 -translate-y-1/2 ${phase === 'celebrate' ? 'anim-happy' : ''} ${phase === 'exit' ? 'anim-row-exit' : ''}`}
          >
            <div className="relative mx-auto" style={{ width: totalW, height: fitted.sizes[0] }}>
              {items.map((it, idx) => {
                const placed = it.id < nextRank;
                // shuffled: slots follow render order (the dealt row);
                // staircase: slots follow rank — her taps build it left→right
                const slot = shuffled ? slots[idx] : slots[it.id];
                return (
                  <button
                    key={`${round}-${it.id}`}
                    ref={(el) => {
                      itemRefs.current[it.id] = el;
                    }}
                    onClick={() => tap(it)}
                    disabled={placed || phase !== 'play'}
                    className={`absolute bottom-0 ${phase === 'play' && !placed ? 'anim-pop' : ''} ${wrong === it.id ? 'anim-wiggle' : ''} ${phase === 'play' && !placed && misses >= 2 && it.id === nextRank ? 'anim-hint rounded-3xl' : ''}`}
                    style={{
                      left: slot.x - fitted.sizes[it.id] / 2,
                      animationDelay:
                        phase === 'play' && !placed ? `${entranceDelay(idx)}ms` : undefined,
                      zIndex: placed ? 1 : 0,
                    }}
                    aria-label={`size ${it.id}`}
                  >
                    <Art id={word.art} size={fitted.sizes[it.id] ?? it.size} />
                  </button>
                );
              })}
            </div>
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
