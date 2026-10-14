import { useRef, useState } from 'react';
import { Art } from '../art';
import { WORDS, type WordCard } from '../data/content';
import { chimeGood, speak } from '../lib/speech';
import { fitSizes, sizesFor, slotGapFor, staircaseSlots } from '../lib/seriation';
import { EndCard, GameShell } from '../components/chrome';
import { pick, shuffle } from '../lib/util';
import { useElementSize } from '../hooks/useElementSize';
import { useFlash } from '../hooks/useFlash';
import { useFrozenLevel } from '../hooks/useFrozenLevel';
import { useInstruction } from '../hooks/useInstruction';
import { useRounds } from '../hooks/useRounds';
import { useTimers } from '../hooks/useTimers';
import { GuideHand } from '../components/hint';

/* seriation: tap items from biggest to smallest — a core early-math skill.
   Design: SHE builds the staircase — each correct tap glides the item DOWN
   into the answer line below the dealt row (biggest on the left). The dealt
   row never rearranges, and because the two rows are physically separate
   bands, a placed item can never cover an untapped one. Nothing ever
   appears, vanishes, or rearranges by itself; every change is caused by
   her hand and visible. */
const ROUNDS = 4;
const ROW_GAP = 26; // vertical gap between the dealt row and the answer line

// choreography budget (ms): grow-in 500 → play → last glide 600 → bob 600
// → hold 600 → row drifts out 700. Total after final tap ≈ 2500.
const T = { growIn: 500, glide: 600, bounce: 600, hold: 600, exit: 700 };

interface Board {
  word: WordCard;
  /** the dealt row, left to right, as size ranks (0 = biggest) */
  order: number[];
}

function deal(level: number): Board {
  return { word: pick(WORDS), order: shuffle(sizesFor(level).map((_, rank) => rank)) };
}

/** placed-then-happy → exiting → gone */
type Phase = 'play' | 'celebrate' | 'exit';

export default function Sizes({ onHome }: { onHome: () => void }) {
  const level = useFrozenLevel('sizes', 2);
  const [board, setBoard] = useState(() => deal(level));
  const [nextRank, setNextRank] = useState(0); // 0 = biggest
  const [phase, setPhase] = useState<Phase>('play');
  const { round, done, misses, miss, solve, restart } = useRounds('sizes', ROUNDS, () => {
    setBoard(deal(level));
    setNextRank(0);
    setPhase('play');
  });
  const [wrong, flashWrong] = useFlash<number>();
  const { later, clearAll } = useTimers();
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const { word, order } = board;

  // measured field — artwork sizes adapt so the row never overflows
  const fieldW = useElementSize(layerRef).w;

  useInstruction(
    'பெரியதிலிருந்து சிறியது வரை தொடு',
    'tap from biggest to smallest',
    [round],
    !done,
  );

  // fitted sizes + slots: the dealt row packs by RENDER order (the layout
  // never rearranges), the staircase slots mark where placed items line up
  // in the answer line below. Gaps are per-count minimums — a smaller item's
  // button is as wide as its artwork is tall, so without a real corridor a
  // neighbour swallows taps.
  const fitted = fitSizes(sizesFor(level), fieldW || 360);
  const slotGap = slotGapFor(fitted.sizes.length);
  const stairSlots = staircaseSlots(fitted.sizes, slotGap);
  const slots = staircaseSlots(
    order.map((rank) => fitted.sizes[rank]),
    slotGap,
  );
  const totalW = slots.length ? slots[slots.length - 1].x + slots[slots.length - 1].size / 2 : 0;
  // two bands: dealt row (height = biggest item) + gap + answer line below
  const rowH = fitted.sizes[0] * 2 + ROW_GAP;

  const tap = (rank: number) => {
    if (done || phase !== 'play') return; // celebrating / leaving — no ghost timers
    if (rank < nextRank) return; // already placed
    if (rank !== nextRank) {
      miss();
      flashWrong(rank);
      return;
    }
    chimeGood();
    speak(nextRank === 0 ? 'பெரியது!' : nextRank === order.length - 1 ? 'சிறியது!' : 'சரி!', 'ta');
    // The tapped item — and ONLY the tapped item — glides down into its
    // slot in the answer line (first-tried items on the left, in the order
    // she picked them). Nothing else ever moves: the rearrange-by-itself
    // was the confusion. Her hand is the only thing that changes the picture.
    const el = itemRefs.current[rank];
    if (el) {
      const s = fitted.sizes[rank];
      const startLeft = el.offsetLeft;
      const startTop = el.offsetTop;
      const slotLeft = stairSlots[rank].x - s / 2;
      const slotTop = rowH - s;
      el.style.left = `${slotLeft}px`;
      el.style.top = `${slotTop}px`;
      el.style.transform = `translate(${startLeft - slotLeft}px, ${startTop - slotTop}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `transform ${T.glide}ms cubic-bezier(0.3, 0.9, 0.3, 1.1)`;
          el.style.transform = '';
        });
      });
    }
    setNextRank(nextRank + 1);
    if (nextRank + 1 >= order.length) {
      // staircase complete → it bounces once, holds, then leaves as one object
      later(() => setPhase('celebrate'), T.glide + 80);
      later(() => setPhase('exit'), T.glide + T.bounce + T.hold);
      solve(T.glide + T.bounce + T.hold + T.exit + 80);
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
            active={phase === 'play' && nextRank < order.length && !done}
          />
          {/* centred with flexbox, NOT a transform — the celebration
              animations animate transform, and any transform-based
              centering on the same element would be clobbered by the
              keyframes (that's what caused the visible snaps) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`${phase === 'celebrate' ? 'anim-happy' : ''} ${phase === 'exit' ? 'anim-row-exit' : ''}`}
            >
              <div className="relative mx-auto" style={{ width: totalW, height: rowH }}>
                {order.map((rank, idx) => {
                  const placed = rank < nextRank;
                  const s = fitted.sizes[rank];
                  // dealt row on top (never rearranges) → answer line below;
                  // the bands never overlap, so nothing can cover a live item
                  const slot = placed ? stairSlots[rank] : slots[idx];
                  return (
                    <button
                      key={`${round}-${rank}`}
                      ref={(el) => {
                        itemRefs.current[rank] = el;
                      }}
                      onClick={() => tap(rank)}
                      disabled={placed || phase !== 'play'}
                      className={`absolute ${wrong === rank ? 'anim-wiggle' : ''} ${phase === 'play' && !placed && misses >= 2 && rank === nextRank ? 'anim-hint rounded-3xl' : ''}`}
                      style={{
                        left: slot.x - s / 2,
                        top: placed ? rowH - s : fitted.sizes[0] - s,
                        zIndex: placed ? 1 : 0,
                      }}
                      aria-label={`size ${rank}`}
                    >
                      {/* the entrance pop lives on the artwork, not the button:
                          a wiggle or hint on the button then never replays it,
                          and it cannot fight the glide's transform */}
                      <span
                        className="block anim-pop"
                        style={{ animationDelay: `${entranceDelay(idx)}ms` }}
                      >
                        <Art id={word.art} size={s} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </GameShell>
      {done && (
        <EndCard
          onAgain={() => {
            clearAll(); // no celebration timer of the old game may touch the fresh one
            restart();
          }}
          onHome={onHome}
        />
      )}
    </div>
  );
}
