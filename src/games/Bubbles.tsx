import { useEffect, useRef, useState } from 'react';
import { Art, type ArtId } from '../art';
import { COLORS, NUMBERS, SHAPES } from '../data/content';
import { chimePop, speak } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { HAND_FONT, pick } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand } from '../components/hint';

const TOTAL = 12;
const MAX_ON_SCREEN = 5;
const PARAMS =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();
const FROZEN = PARAMS.has('freeze'); // screenshot helper: bubbles hover mid-field
const FAST = PARAMS.has('fast'); // test helper: short flights, quick spawns

interface B {
  id: number;
  x: number; // vw offset inside field (%)
  size: number;
  dur: number;
  art?: ArtId;
  num?: number;
  tint: string;
  label: string;
  popped: boolean;
}

export default function Bubbles({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome } = useStore();
  const level = levelFor('bubbles', 3);
  const [bubbles, setBubbles] = useState<B[]>([]);
  const [resolved, setResolved] = useState(0); // popped OR floated away
  const [done, setDone] = useState(false);
  const idRef = useRef(0);
  const spawnedRef = useRef(0);
  const resolvedIds = useRef<Set<number>>(new Set());
  const poppedCount = useRef(0);
  const layerRef = useRef<HTMLDivElement>(null);
  const leadBubbleRef = useRef<HTMLButtonElement>(null);
  // measured field height — the drift distance adapts to any screen size, so a
  // bubble is resolved the moment it has fully floated out of view
  const [fieldH, setFieldH] = useState(0);
  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFieldH(el.clientHeight));
    ro.observe(el);
    setFieldH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useInstruction('குமிழிகளைத் தொட்டு உடை', 'pop the bubbles');

  function makeBubble(lv: number): B {
    idRef.current += 1;
    const base: Omit<B, 'art' | 'num' | 'label' | 'tint'> = {
      id: idRef.current,
      x: 4 + Math.random() * 76,
      size: 84 + Math.random() * 44,
      dur: FAST ? 4 + Math.random() * 1.5 : 10 + Math.random() * 4,
      popped: false,
    };
    if (lv === 0) {
      const c = pick(COLORS);
      return { ...base, tint: c.hex, label: c.ta };
    }
    if (lv === 1) {
      const s = pick(SHAPES);
      return { ...base, tint: '#ffffff', art: s.id, label: s.ta };
    }
    const n = pick(NUMBERS.slice(0, lv === 2 ? 5 : 10));
    return { ...base, tint: '#ffffff', num: n.n, label: n.ta };
  }

  /** Every bubble resolves exactly once — popped or escaped — so the round ALWAYS ends. */
  const resolve = (id: number, popped: boolean, label?: string) => {
    if (resolvedIds.current.has(id)) return; // dedupe: drift may end during pop-shrink
    resolvedIds.current.add(id);

    if (popped && label) {
      chimePop();
      speak(label, 'ta');
      poppedCount.current += 1;
      // popped bubbles stop intercepting touches instantly and leave fast,
      // so a fresh bubble behind them is tappable right away
      setBubbles((bs) => bs.map((b) => (b.id === id ? { ...b, popped: true } : b)));
      window.setTimeout(() => setBubbles((bs) => bs.filter((b) => b.id !== id)), 130);
    } else {
      setBubbles((bs) => bs.filter((b) => b.id !== id));
    }

    const n = resolvedIds.current.size;
    setResolved(n);
    if (n >= TOTAL) {
      recordWin('bubbles');
      recordOutcome('bubbles', poppedCount.current >= TOTAL / 2);
      window.setTimeout(() => setDone(true), popped ? 450 : 600);
    }
  };

  /** Spawn only when there is room — never evict a live bubble. */
  const spawn = () => {
    if (spawnedRef.current >= TOTAL) return;
    if (idRef.current - resolvedIds.current.size >= MAX_ON_SCREEN) return;
    spawnedRef.current += 1;
    const b = makeBubble(level);
    setBubbles((bs) => [...bs, b]);
    // Backstop: even if the animationend event is swallowed (power-saving,
    // background tab, browser quirk), the bubble ALWAYS resolves.
    window.setTimeout(() => resolve(b.id, false), (b.dur + 1.5) * 1000);
  };

  useEffect(() => {
    spawn();
    spawn();
    const id = window.setInterval(
      () => {
        if (document.hidden) return; // don't run the round while she's not looking
        spawn();
      },
      FAST ? 500 : 1300,
    );
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const restart = () => {
    spawnedRef.current = 0;
    poppedCount.current = 0;
    resolvedIds.current.clear();
    setBubbles([]);
    setResolved(0);
    setDone(false);
    spawn();
    spawn();
  };

  return (
    <div className="relative h-full">
      <GameShell ta="குமிழிகள்" en="pop & discover" art="balloon" onHome={onHome} tint="#A9D6E5">
        <div
          ref={layerRef}
          className="relative grow overflow-hidden rounded-3xl border-3 border-plum/10 bg-sky/25"
        >
          {/* guiding hand points at the leading bubble's center */}
          <GuideHand
            target={leadBubbleRef}
            layerRef={layerRef}
            guideKey="bubbles"
            active={bubbles.length > 0 && !done}
          />
          {/* progress: quiet dots — each bubble that leaves (popped or floated away) fills one */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${i < resolved ? 'bg-sage' : 'bg-plum/15'}`}
              />
            ))}
          </div>
          {bubbles.map((b, idx) => (
            <button
              key={b.id}
              ref={idx === 0 ? leadBubbleRef : undefined}
              onPointerDown={() => !b.popped && resolve(b.id, true, b.label)}
              onAnimationEnd={(e) => {
                if (e.animationName === 'drift') resolve(b.id, false);
              }}
              className="absolute"
              style={{
                left: `${b.x}%`,
                bottom: -160,
                width: b.size,
                height: b.size,
                // exits the field exactly when fully out of view (dynamic per screen)
                ['--rise' as never]: `-${(fieldH || window.innerHeight * 1.2) + 175 + b.size}px`,
                animation: `drift ${b.dur}s linear forwards`,
                animationPlayState: FROZEN ? 'paused' : undefined,
                animationDelay: FROZEN ? `${-(3 + (b.id % 4) * 1.7)}s` : undefined,
                pointerEvents: b.popped ? 'none' : undefined,
              }}
              aria-label={b.label}
            >
              <span
                className="block w-full h-full rounded-full transition-transform duration-200"
                style={{
                  transform: b.popped ? 'scale(0)' : 'scale(1)',
                  background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), ${b.tint}66 45%, ${b.tint}33 75%, rgba(255,255,255,0.55))`,
                  border: `3px solid ${b.tint}`,
                  boxShadow: 'inset -6px -8px 14px rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.art && <Art id={b.art} size={Math.round(b.size * 0.52)} />}
                {b.num !== undefined && (
                  <span
                    className="text-plum"
                    style={{ fontSize: b.size * 0.4, fontFamily: HAND_FONT }}
                  >
                    {b.num}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </GameShell>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
