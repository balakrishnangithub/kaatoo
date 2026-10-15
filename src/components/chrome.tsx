import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../lib/store';
import { chimeGood, speakPair } from '../lib/speech';
import { pick } from '../lib/util';
import { PRAISE } from '../data/content';
import { Art, type ArtId } from '../art';

/**
 * chrome.tsx — the shared "frame" every game is built from:
 *   HoldButton  parent gate (press-and-hold, toddlers can't tap through)
 *   GameShell   activity header with a way home
 *   EndCard     calm end-of-round card — finite play, natural stopping
 * Hooks and pure helpers live in src/hooks and src/lib, not here.
 */

/* ---------- press-and-hold button (parent gate) ---------- */
export function HoldButton({
  onDone,
  className = '',
  children,
  holdMs = 1400,
}: {
  onDone: () => void;
  className?: string;
  children: ReactNode;
  holdMs?: number;
}) {
  const [pct, setPct] = useState(0);
  const raf = useRef<number>(0);
  const start = useRef(0);

  const down = () => {
    // one hold, one clock: a second finger restarts it. Without this, each
    // extra finger started its own loop that nothing could cancel — and that
    // orphan went on to open the gate after every finger had lifted.
    cancelAnimationFrame(raf.current);
    start.current = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start.current) / holdMs);
      setPct(p);
      if (p >= 1) {
        onDone();
        setPct(0);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  const up = () => {
    cancelAnimationFrame(raf.current);
    setPct(0);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <button
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative overflow-hidden ${className}`}
    >
      <span
        className="absolute inset-y-0 left-0 bg-plum/15 transition-none"
        style={{ width: `${pct * 100}%` }}
        aria-hidden
      />
      <span className="relative">{children}</span>
    </button>
  );
}

/* ---------- activity header ---------- */
function HomeGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#563E79"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 11 L12 4 L20 11" />
      <path d="M7 10.5 V19 a1.5 1.5 0 0 0 1.5 1.5 h7 A1.5 1.5 0 0 0 17 19 V10.5" />
    </svg>
  );
}

export function GameShell({
  ta,
  en,
  art,
  onHome,
  children,
  tint = '#fff',
}: {
  ta: string;
  en: string;
  art: ArtId;
  onHome: () => void;
  children: ReactNode;
  tint?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 pb-2 sm:px-6 safe-top">
        <button
          onClick={onHome}
          aria-label="home"
          className="btn-chunky !min-h-12 !px-3.5 !py-2 shrink-0"
        >
          <HomeGlyph />
          <span className="font-display">வீடு</span>
        </button>
        <div
          className="sticker flex items-center gap-3 px-4 py-2 grow"
          style={{ background: tint }}
        >
          <div className="w-11 h-11 shrink-0">
            <Art id={art} size={44} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-lg text-plum">{ta}</div>
            <div className="text-xs text-plum/60 font-semibold tracking-wide">{en}</div>
          </div>
        </div>
      </div>
      <div className="grow flex flex-col min-h-0 px-4 sm:px-6 safe-bottom">{children}</div>
    </div>
  );
}

/* ---------- calm end-of-round card: finite play, natural stopping ---------- */

/** a button's two-line label: Tamil, with the English small beneath it */
function BiLabel({ ta, en }: { ta: string; en: string }) {
  return (
    <span>
      <span className="block leading-tight">{ta}</span>
      <span className="block text-[11px] font-semibold opacity-60 leading-tight">{en}</span>
    </span>
  );
}

export function EndCard({ onAgain, onHome }: { onAgain: () => void; onHome: () => void }) {
  const { goRest, expired, settings } = useStore();
  const [praise] = useState(() => pick(PRAISE));

  useEffect(() => {
    chimeGood();
    speakPair(praise.ta, praise.en, settings.english);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-cream/90 p-6">
      <div className="sticker anim-pop w-full max-w-sm p-8 text-center">
        <div className="mx-auto w-24 h-24 anim-float">
          <Art id="star" size={96} />
        </div>
        <div className="font-display font-bold text-3xl text-plum mt-2">{praise.ta}</div>
        <div className="text-plum/60 font-semibold mt-1">ஒரு சுற்று முடிந்தது · one round done</div>
        <div className="mt-6 flex flex-col gap-3">
          {/* when the session's time is up, rest is the only way on */}
          {!expired && (
            <>
              <button className="btn-chunky bg-sun" onClick={onAgain} aria-label="again">
                <span className="text-2xl leading-none" aria-hidden>
                  ↻
                </span>
                <BiLabel ta="மீண்டும்" en="again" />
              </button>
              <button className="btn-chunky" onClick={onHome} aria-label="home">
                <HomeGlyph />
                <BiLabel ta="வீடு" en="all games" />
              </button>
            </>
          )}
          <button
            className="btn-chunky bg-mint"
            onClick={goRest}
            aria-label={expired ? 'rest time' : 'rest'}
          >
            <span className="w-9 h-9 -my-1" aria-hidden>
              <Art id="moon" size={36} />
            </span>
            <BiLabel ta={expired ? 'ஓய்வு நேரம்' : 'ஓய்வு'} en={expired ? 'rest time' : 'rest'} />
          </button>
        </div>
      </div>
    </div>
  );
}
