import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { GameId } from '../data/content';
import { useGuide } from '../hooks/useGuide';

/**
 * Adaptive guiding hand.
 *
 * Research basis (Hiniker et al., "Touchscreen Prompts for Preschoolers", and
 * Vygotskian scaffolding / contingent fading):
 *  - A demonstrating hand is the strongest in-app prompt, but children under ~3
 *    mostly need a HUMAN model — so the app also invites the parent to model.
 *  - Help must be contingent: it appears only after idle time, shows the exact
 *    target, and disappears the moment the child acts.
 *  - Help must FADE as competence is demonstrated, or children become dependent.
 *
 * The engine therefore adapts automatically, with zero configuration:
 *  idleDelay = 2400ms on the very first plays of an activity,
 *              growing by +900ms per success until it stops appearing at all
 *              (after 4+ successes she gets no hand — she owns it).
 *  It dismisses instantly on any pointer-down anywhere.
 */

/** The pixel centre of a target element, relative to the layer the hand is
 *  rendered into (the positioned ancestor both of them share). */
function centerOf(target: HTMLElement, layer: HTMLElement): { x: number; y: number } {
  const t = target.getBoundingClientRect();
  const l = layer.getBoundingClientRect();
  return { x: t.left - l.left + t.width / 2, y: t.top - l.top + t.height / 2 };
}

interface GuideProps {
  /** the element the child should tap — a ref, or a getter resolved lazily.
   *  A getter is safest: it is re-evaluated when the hand fires, so targets
   *  that mount/re-mount after the first render are never stale. */
  target: RefObject<HTMLElement | null> | (() => HTMLElement | null);
  /** only guide while this is true (e.g. not solved / not done) */
  active: boolean;
  /** the layer (position:relative) the hand is absolutely positioned within */
  layerRef: RefObject<HTMLElement | null>;
  /** the activity being guided — adaptive fading is tracked per activity */
  guideKey: GameId;
  /** corrective mode: when provided, the hand appears ONLY right after a wrong
   *  attempt (this number increasing = a fresh miss) instead of after idling.
   *  Used by tap-choice games — help answers a mistake, it never anticipates. */
  fireSignal?: number;
}

export function GuideHand({ target, active, layerRef, guideKey, fireSignal }: GuideProps) {
  // adaptive fade: more success → wait longer before offering help → then stop
  const { plays, enabled } = useGuide(guideKey);
  const idleDelay = 2400 + plays * 900; // 2.4s → 3.3s → 4.2s → 5.1s → off
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const timer = useRef<number>(0);
  // signature of what the timer is currently scheduled for — the game around
  // the hand re-renders constantly (bubbles come and go), and without this the
  // idle timer would be cleared and restarted every time, so the hand could
  // never appear.
  const sig = useRef<{ t: HTMLElement; delay: number } | null>(null);
  // keep the latest resolver in a ref so timers/intervals always read FRESH targets
  const resolveRef = useRef<() => HTMLElement | null>(() => null);
  useEffect(() => {
    resolveRef.current = typeof target === 'function' ? target : () => target.current;
  });

  // never leave a pending timer behind when the hand unmounts
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // corrective mode: show the hand the moment she makes a wrong attempt
  const lastFire = useRef(0);
  useEffect(() => {
    if (fireSignal === undefined) return;
    if (fireSignal === 0) {
      lastFire.current = 0; // new round — resync so the next miss fires again
      return;
    }
    if (!active || !enabled || fireSignal === lastFire.current) return;
    lastFire.current = fireSignal;
    const t = resolveRef.current();
    const l = layerRef.current;
    if (t && t.isConnected && l) {
      setPos(centerOf(t, l));
      setVisible(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireSignal, active, enabled]);

  // no dep array: runs every render, but reschedules ONLY when the resolved
  // target (or the adaptive delay) actually changes — other renders are no-ops.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (fireSignal !== undefined) return; // corrective mode: no idle timer at all
    if (!active || !enabled) {
      sig.current = null;
      window.clearTimeout(timer.current);
      setVisible(false);
      return;
    }
    const t = resolveRef.current();
    if (!t) {
      sig.current = null;
      window.clearTimeout(timer.current);
      setVisible(false);
      return;
    }
    if (sig.current && sig.current.t === t && sig.current.delay === idleDelay) return;
    sig.current = { t, delay: idleDelay };
    window.clearTimeout(timer.current);
    setVisible(false);
    let tries = 0;
    const fire = () => {
      const cur = resolveRef.current(); // re-resolve NOW — never trust a stale ref
      const l = layerRef.current;
      if (cur && cur.isConnected && l) {
        setPos(centerOf(cur, l));
        setVisible(true);
      } else if (++tries < 10) {
        timer.current = window.setTimeout(fire, 350); // target not mounted yet — retry
      }
    };
    timer.current = window.setTimeout(fire, idleDelay);
  });

  // dismiss on ANY interaction — she clearly doesn't need the hint anymore
  useEffect(() => {
    if (!visible) return;
    const off = () => setVisible(false);
    window.addEventListener('pointerdown', off, { capture: true });
    return () => window.removeEventListener('pointerdown', off, { capture: true });
  }, [visible]);

  // keep pointing at the CENTRE even while the target moves (drifting bubbles)
  useEffect(() => {
    if (!visible) return;
    const follow = window.setInterval(() => {
      const t = resolveRef.current();
      const l = layerRef.current;
      if (t && t.isConnected && l) setPos(centerOf(t, l));
      else setVisible(false);
    }, 180);
    return () => window.clearInterval(follow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || !pos) return null;
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: pos.x, top: pos.y, transform: 'translate(-32%, -34%)' }}
      aria-hidden="true"
    >
      <HandSvg />
    </div>
  );
}

/** A pointing finger that taps, with an expanding ripple on the touch point. */
export function HandSvg({ size = 62 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="hand-tap"
      style={{ filter: 'drop-shadow(0 3px 4px rgba(86,62,121,0.35))' }}
    >
      <circle
        className="hand-ripple"
        cx="23"
        cy="20"
        r="9"
        fill="none"
        stroke="#563E79"
        strokeWidth="2.5"
      />
      <circle
        className="hand-ripple hand-ripple-2"
        cx="23"
        cy="20"
        r="9"
        fill="none"
        stroke="#84A59D"
        strokeWidth="2.5"
      />
      <g stroke="#563E79" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M22 4 L22 24 C14 22 12 28 15 33 L24 44 C28 49 34 51 40 49 C47 47 50 42 50 35 L50 24 C50 20 44 20 43 24 L43 20 C43 16 37 16 36 20 L36 17 C36 13 30 13 29 17 L29 6 C29 2 22 2 22 6 Z"
          fill="#FFFDF8"
        />
      </g>
    </svg>
  );
}

/**
 * SwipeableCard — the ONE card interaction across the whole app.
 * Follows the finger in real time (with a little tilt), springs back when
 * released early, flies off past a threshold; a short touch (no slide) is a
 * tap — so tap, swipe, and tap-hold all feel natural.
 * Pass `behindNext` / `behindPrev` to show the neighbouring card UNDER the
 * current one: as she drags, the next card is revealed and grows into place,
 * like pulling the top card off a little deck.
 */
export function SwipeableCard({
  onSwipe,
  onTap,
  className = '',
  faceClassName = '',
  children,
  ariaLabel,
  behindNext,
  behindPrev,
}: {
  onSwipe?: (dir: 1 | -1) => void; // 1 = next, -1 = previous
  onTap?: () => void;
  className?: string; // wrapper layout (sizing)
  faceClassName?: string; // the card face visuals (sticker, padding…)
  children: ReactNode;
  ariaLabel?: string;
  behindNext?: ReactNode;
  behindPrev?: ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [flying, setFlying] = useState(false);
  const [resetting, setResetting] = useState(false); // deck reset must not animate
  const [dragging, setDragging] = useState(false); // finger on the card — no spring transition while it is
  const startX = useRef<number | null>(null);
  const dxRef = useRef(0);
  const raf = useRef(0);
  const flyTimer = useRef(0);
  // leaving mid-swipe must not turn the page (or speak) on a screen that is gone
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      window.clearTimeout(flyTimer.current);
    },
    [],
  );

  const down = (e: React.PointerEvent) => {
    if (flying) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    setDragging(true);
  };
  const move = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    dxRef.current = e.clientX - startX.current;
    // rAF-throttle: render once per frame, not once per pointer event (battery)
    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        raf.current = 0;
        setDx(dxRef.current);
      });
    }
  };
  const up = () => {
    if (startX.current === null) return;
    const d = dxRef.current;
    startX.current = null;
    dxRef.current = 0;
    setDragging(false);
    cancelAnimationFrame(raf.current);
    raf.current = 0;
    if (Math.abs(d) < 12) {
      setDx(0);
      onTap?.();
    } else if (d < -60 || d > 60) {
      const dir: 1 | -1 = d < -60 ? 1 : -1;
      // fly the top card off; the card underneath is already fully revealed,
      // then the deck silently resets with the new card on top
      setFlying(true);
      setDx(d < -60 ? -460 : 460);
      flyTimer.current = window.setTimeout(() => {
        onSwipe?.(dir); // parent swaps the content to the card that was underneath
        setFlying(false);
        setResetting(true); // jump back to centre with no transition — the reveal already happened
        setDx(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setResetting(false)));
      }, 170);
    } else {
      setDx(0);
    }
  };

  // the card underneath emerges as the top card slides away
  const progress = Math.min(1, Math.abs(dx) / 160);
  const behind = dx <= 0 ? behindNext : behindPrev;

  return (
    <div className={`relative ${className}`}>
      {behind !== undefined && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: progress, transform: `scale(${0.92 + 0.08 * progress})` }}
          aria-hidden="true"
        >
          <div className={`w-full h-full ${faceClassName}`}>{behind}</div>
        </div>
      )}
      <div
        role="button"
        aria-label={ariaLabel}
        className={`relative w-full h-full cursor-grab active:cursor-grabbing select-none ${faceClassName}`}
        style={{
          transform: `translateX(${dx}px) rotate(${dx / 30}deg)`,
          transition:
            dragging || resetting
              ? 'none'
              : flying
                ? 'transform 0.17s ease-in'
                : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.4)',
          touchAction: 'pan-y',
          visibility: flying && Math.abs(dx) > 400 ? 'hidden' : 'visible',
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {children}
      </div>
    </div>
  );
}
