import { useEffect, useRef, useState } from 'react';
import { Art, type ArtId } from '../art';
import { COLORS, SHAPES, WORDS } from '../data/content';
import { topLevel } from '../data/levels';
import { chimeGood, speak } from '../lib/speech';
import type { Ladder } from '../lib/skill';
import { EndCard, GameShell } from '../components/chrome';
import { sample, shuffle } from '../lib/util';
import { useFlash } from '../hooks/useFlash';
import { useInstruction } from '../hooks/useInstruction';
import { useRounds } from '../hooks/useRounds';
import { GuideHand } from '../components/hint';

/*
 levels: 0 = sort 2 colors · 1 = sort 3 colors · 2 = sort 2 shapes · 3 = animals vs food
 tap an item, then tap its basket — two-tap sorting suits small fingers
*/
interface Item {
  key: string;
  art: ArtId;
  fill?: string;
  bin: string;
  label: string; // full spoken name — "சிவப்பு வட்டம்", never just the colour
}
interface Bin {
  id: string;
  label: string;
  fill?: string;
  art?: ArtId;
}

const ROUNDS = 3;
const ROUND_ITEMS = 6;
/** every item is its own decision */
const LADDER: Ladder = { top: topLevel('sort'), steps: () => ROUND_ITEMS };

function buildRound(level: number): {
  items: Item[];
  bins: Bin[];
  prompt: string;
  promptEn: string;
} {
  if (level <= 1) {
    const colors = sample(COLORS, level === 0 ? 2 : 3);
    const shapes = sample(SHAPES, ROUND_ITEMS);
    const items: Item[] = Array.from({ length: ROUND_ITEMS }, (_, i) => {
      const c = colors[i % colors.length];
      return {
        key: `${c.id}-${i}`,
        art: shapes[i].id,
        fill: c.hex,
        bin: c.id,
        label: `${c.ta} ${shapes[i].ta}`,
      };
    });
    return {
      items: shuffle(items),
      bins: colors.map((c) => ({ id: c.id, label: c.ta, fill: c.hex })),
      prompt: 'ஒரே நிறத்தை ஒன்றாகப் போடு',
      promptEn: 'sort by color',
    };
  }
  if (level === 2) {
    const shapes = sample(SHAPES, 2);
    const items: Item[] = Array.from({ length: ROUND_ITEMS }, (_, i) => {
      const s = shapes[i % 2];
      const c = COLORS[i % 3];
      return { key: `${s.id}-${i}`, art: s.id, fill: c.hex, bin: s.id, label: `${c.ta} ${s.ta}` };
    });
    return {
      items: shuffle(items),
      bins: shapes.map((s) => ({ id: s.id, label: s.ta, art: s.id })),
      prompt: 'ஒரே வடிவத்தை ஒன்றாகப் போடு',
      promptEn: 'sort by shape',
    };
  }
  const animals = sample(
    WORDS.filter((w) => w.cat === 'animal'),
    3,
  );
  const foods = sample(
    WORDS.filter((w) => w.cat === 'food'),
    3,
  );
  const items: Item[] = shuffle([
    ...animals.map((w) => ({ key: w.art, art: w.art, bin: 'animal', label: w.ta })),
    ...foods.map((w) => ({ key: w.art, art: w.art, bin: 'food', label: w.ta })),
  ]);
  return {
    items,
    bins: [
      { id: 'animal', label: 'விலங்குகள்', art: 'cat' },
      { id: 'food', label: 'உணவு', art: 'mango' },
    ],
    prompt: 'விலங்கு, உணவு — பிரி',
    promptEn: 'animals here, food there',
  };
}

export default function Sort({ onHome }: { onHome: () => void }) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  // each wrong basket costs the round a share of its score, and drives the
  // corrective guide hand
  const {
    board: data,
    round,
    done,
    solved,
    misses,
    miss,
    solve,
    restart,
  } = useRounds('sort', {
    rounds: ROUNDS,
    ladder: LADDER,
    deal: buildRound,
    onDeal: () => {
      setPlaced([]);
      setSelected(null);
    },
  });
  const [wrongBin, flashWrongBin] = useFlash<string>();
  // drag state: pointer down starts a potential drag; movement turns it real
  const [drag, setDrag] = useState<{ key: string; x: number; y: number } | null>(null);
  const pressRef = useRef<{ key: string; x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const dragPos = useRef<{ key: string; x: number; y: number } | null>(null);
  const dragRaf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(dragRaf.current), []);

  useInstruction(data.prompt, data.promptEn, [round], !done);

  const remaining = data.items.filter((it) => !placed.includes(it.key));
  const selItem = data.items.find((i) => i.key === selected) ?? null;
  const dragItem = data.items.find((i) => i.key === drag?.key) ?? null;

  // guide targets: an item to pick, or — once picked — its correct basket.
  // resolved lazily at fire time so freshly mounted buttons are never stale.
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const binRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const resolveGuide = () =>
    selItem
      ? (binRefs.current[selItem.bin] ?? null)
      : remaining[0]
        ? (itemRefs.current[remaining[0].key] ?? null)
        : null;

  const place = (item: Item, bin: Bin) => {
    if (solved) return;
    if (item.bin !== bin.id) {
      miss();
      flashWrongBin(bin.id);
      return;
    }
    chimeGood();
    speak(item.label, 'ta');
    setPlaced((p) => [...p, item.key]);
    setSelected(null);
    if (placed.length + 1 >= data.items.length) solve(650);
  };

  const tapBin = (bin: Bin) => {
    if (selItem) place(selItem, bin);
    else speak(bin.label, 'ta');
  };

  /* real drag-and-drop (deliberate, deeper processing per touchscreen studies) —
     with tap-tap kept as the always-available easier path for small hands */
  const itemDown = (e: React.PointerEvent, key: string) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pressRef.current = { key, x: e.clientX, y: e.clientY };
    draggedRef.current = false;
  };
  const itemMove = (e: React.PointerEvent) => {
    const p = pressRef.current;
    if (!p) return;
    if (!draggedRef.current && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 14) {
      draggedRef.current = true;
      setSelected(null);
    }
    if (draggedRef.current) {
      // rAF-throttle: one render per frame max, not one per pointer event (battery)
      dragPos.current = { key: p.key, x: e.clientX, y: e.clientY };
      if (!dragRaf.current) {
        dragRaf.current = requestAnimationFrame(() => {
          dragRaf.current = 0;
          if (dragPos.current) setDrag(dragPos.current);
        });
      }
    }
  };
  /** the finger is off the item: no frame may still be waiting to redraw the ghost */
  const endDrag = () => {
    pressRef.current = null;
    dragPos.current = null;
    setDrag(null);
  };
  const itemUp = (e: React.PointerEvent, it: Item) => {
    const wasDrag = pressRef.current !== null && draggedRef.current;
    endDrag();
    if (wasDrag) {
      // dropped: find the basket under the finger
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const binEl = el?.closest('[data-bin]');
      const bin = data.bins.find((b) => b.id === binEl?.getAttribute('data-bin'));
      if (bin) place(it, bin);
      return;
    }
    // a simple tap: select / deselect (the tap-tap path)
    setSelected(selected === it.key ? null : it.key);
    speak(it.label, 'ta');
  };

  return (
    <div className="relative h-full">
      <GameShell ta="வகைப்படுத்து" en="sort it" art="starshape" onHome={onHome} tint="#CDB4DB">
        <div ref={layerRef} className="relative grow flex flex-col min-h-0">
          <GuideHand
            target={resolveGuide}
            layerRef={layerRef}
            guideKey="sort"
            active={!done && remaining.length > 0}
            fireSignal={misses}
          />
          {/* baskets */}
          <div
            className={`relative grid gap-3 ${data.bins.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} max-w-lg mx-auto w-full`}
          >
            {data.bins.map((b) => (
              <button
                key={b.id}
                ref={(el) => {
                  binRefs.current[b.id] = el;
                }}
                onClick={() => tapBin(b)}
                data-bin={b.id}
                className={`sticker p-3 flex flex-col items-center gap-1 transition-transform active:scale-95 ${wrongBin === b.id ? 'anim-wiggle' : ''} ${
                  selected && misses >= 2 && selItem?.bin === b.id ? 'anim-hint' : ''
                }`}
                style={{ borderColor: b.fill ?? 'rgba(86,62,121,0.16)', borderWidth: 3 }}
              >
                {b.fill ? (
                  <div
                    className="w-12 h-12 rounded-full border-4 border-plum/20"
                    style={{ background: b.fill }}
                  />
                ) : (
                  b.art && <Art id={b.art} size={48} />
                )}
                <div className="font-display font-bold text-plum">{b.label}</div>
                <div className="flex gap-1 flex-wrap justify-center min-h-6">
                  {data.items
                    .filter((i) => i.bin === b.id && placed.includes(i.key))
                    .map((i) => (
                      <div key={i.key} className="anim-pop">
                        {/* placed items keep their own colour — the colour IS the lesson */}
                        <Art id={i.art} fill={i.fill} size={24} />
                      </div>
                    ))}
                </div>
              </button>
            ))}
          </div>

          {/* tray */}
          <div className="relative grow min-h-0 flex items-center">
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto w-full">
              {remaining.map((it) => (
                <button
                  key={it.key}
                  ref={(el) => {
                    itemRefs.current[it.key] = el;
                  }}
                  onPointerDown={(e) => itemDown(e, it.key)}
                  onPointerMove={itemMove}
                  onPointerUp={(e) => itemUp(e, it)}
                  onPointerCancel={endDrag}
                  className={`sticker aspect-square p-2 flex items-center justify-center transition-all active:scale-95 ${
                    selected === it.key ? 'ring-4 ring-sage -translate-y-2' : ''
                  } ${drag?.key === it.key ? 'opacity-30' : ''}`}
                  style={{ touchAction: 'none' }}
                >
                  <Art id={it.art} fill={it.fill} size={76} />
                </button>
              ))}
            </div>
          </div>
          {/* dragged item ghost follows the finger in real time. The pop-in sits
              on an inner element: on the ghost itself its keyframes would
              override the transform that centres it under the finger. */}
          {drag && dragItem && (
            <div
              className="fixed pointer-events-none z-50"
              style={{ left: drag.x, top: drag.y, transform: 'translate(-50%,-60%) scale(1.1)' }}
            >
              <div className="anim-pop">
                <Art id={dragItem.art} fill={dragItem.fill} size={76} />
              </div>
            </div>
          )}
        </div>
      </GameShell>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
