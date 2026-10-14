import { useEffect, useMemo, useRef, useState } from 'react';
import { Art, type ArtId } from '../art';
import { COLORS, NUMBERS, PRAISE_EFFORT, SHAPES } from '../data/content';
import { chimeGood, chimeSoft, chimeTap, speak, speakPair } from '../lib/speech';
import { judgeStroke, judgeGlyph, type GuideBox, type Pt } from '../lib/trace';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { HAND_FONT, pick } from '../lib/util';
import { useGuide } from '../hooks/useGuide';
import { useTimers } from '../hooks/useTimers';
import { HandSvg } from '../components/hint';

type Tool = 'draw' | ArtId;

/* tracing content carries an internal stage: a 2-year-old meets circles, squares
   and the first glyphs; stars, hearts and Latin letters arrive later */
const ART_LADDER: ArtId[][] = [
  ['circle', 'square', 'triangle'], // stage 0 · 2-3y
  ['rect', 'oval'], // stage 1 · 3-4y
  ['starshape', 'heart'], // stage 2 · 4-5y
  [], // stage 3 · 5-6y
];
const GLYPH_LADDER: string[][] = [['1', '2', 'அ'], ['3', '4', '5', 'ஆ'], ['A', 'B', 'C'], ['இ']];
const STAMPS: ArtId[] = ['star', 'heart', 'flower', 'sun'];
const INKS = ['#563E79', ...COLORS.map((c) => c.hex)];

/* outlines matching art/shapes.tsx geometry (240×240 viewBox) so the demo
   hand and the shape templates sit exactly on the grey picture she sees */
const GUIDE_PATHS: Record<string, string> = {
  circle: 'M120 56 a64 64 0 1 1 -0.01 0 Z',
  oval: 'M120 52 a50 68 0 1 1 -0.01 0 Z',
  square: 'M56 56 H184 V184 H56 Z',
  rect: 'M44 76 H196 V164 H44 Z',
  triangle: 'M120 50 L200 188 L40 188 Z',
  starshape: 'M120 44 L145 96 L202 100 L158 138 L172 194 L120 162 L68 194 L82 138 L38 100 L95 96 Z',
  heart:
    'M120 200 C58 152 42 112 62 84 C78 62 108 64 120 90 C132 64 162 62 178 84 C198 112 182 152 120 200 Z',
};

interface StampMark {
  art: ArtId;
  x: number; // fraction
  y: number;
  size: number;
}

/* sample points along an SVG path without rendering it */
function samplePath(d: string, n = 64): Pt[] {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  const len = path.getTotalLength();
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const p = path.getPointAtLength((i / n) * len);
    out.push({ x: p.x / 240, y: p.y / 240 });
  }
  return out;
}

/* rasterise a glyph and keep its ink pixels as coverage targets + bbox */
function glyphInk(ch: string): { pts: Pt[]; bbox: { x: number; y: number; w: number; h: number } } {
  const c = document.createElement('canvas');
  c.width = 240;
  c.height = 240;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `170px ${HAND_FONT}`; // the very stack the grey guide is drawn in
  ctx.fillText(ch, 120, 126);
  const img = ctx.getImageData(0, 0, 240, 240).data;
  const pts: Pt[] = [];
  let minX = 240,
    minY = 240,
    maxX = 0,
    maxY = 0;
  for (let y = 0; y < 240; y += 4) {
    for (let x = 0; x < 240; x += 4) {
      if (img[(y * 240 + x) * 4 + 3] > 100) {
        pts.push({ x: x / 240, y: y / 240 });
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const stride = Math.max(1, Math.ceil(pts.length / 420));
  return {
    pts: pts.filter((_, i) => i % stride === 0),
    bbox: { x: minX / 240, y: minY / 240, w: (maxX - minX) / 240, h: (maxY - minY) / 240 },
  };
}

/* demo path for glyphs: slow sweeps across the ink — "draw over the grey mark" */
function sweepPath(b: { x: number; y: number; w: number; h: number }): Pt[] {
  const rows = 4;
  const pts: Pt[] = [];
  const pad = 0.03;
  for (let r = 0; r < rows; r++) {
    const y = b.y + (b.h * (r + 0.5)) / rows;
    const x0 = Math.max(0, b.x - pad);
    const x1 = Math.min(1, b.x + b.w + pad);
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push({ x: r % 2 ? x1 - (x1 - x0) * t : x0 + (x1 - x0) * t, y });
    }
  }
  return pts;
}

/* the demonstrating hand: traces the path slowly, then fades (scaffolding) */
function TraceDemo({
  pts,
  box,
  loops,
  nonce,
  onDone,
}: {
  pts: Pt[];
  box: GuideBox;
  loops: number;
  nonce: number;
  onDone: () => void;
}) {
  const [pos, setPos] = useState<Pt | null>(null);

  useEffect(() => {
    if (pts.length < 2) return;
    let raf = 0;
    let cancelled = false;
    const total = pts.length - 1;
    const DURATION = Math.min(6800, 1600 + total * 60);
    let start = 0;
    let loop = 0;
    setPos(pts[0]);
    const tick = (t: number) => {
      if (cancelled) return;
      if (!start) start = t;
      let p = (t - start) / DURATION;
      if (p >= 1) {
        loop++;
        if (loop >= loops) {
          onDone();
          return;
        }
        start = t;
        p = 0;
      }
      const fi = p * total;
      const i = Math.floor(fi);
      const f = fi - i;
      const a = pts[i];
      const b = pts[Math.min(i + 1, total)];
      setPos({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
      raf = requestAnimationFrame(tick);
    };
    const to = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, 600);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(to);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  if (!pos) return null;
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: box.l + pos.x * box.s,
        top: box.t + pos.y * box.s,
        transform: 'translate(-32%,-34%)',
      }}
    >
      <HandSvg size={56} />
    </div>
  );
}

export default function Draw({ onHome }: { onHome: () => void }) {
  const { expired, recordWin, recordOutcome, settings, stage } = useStore();
  // the demonstrating hand fades with practice, like the guiding hand elsewhere
  const { plays, enabled: demoAllowed } = useGuide('draw');
  const { later } = useTimers();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('draw');
  const [ink, setInk] = useState(INKS[0]);
  const [brush, setBrush] = useState(8);
  const [guideIdx, setGuideIdx] = useState(0);
  const [guideOn, setGuideOn] = useState(true);
  const [stamps, setStamps] = useState<StampMark[]>([]);
  const [done, setDone] = useState(false);
  const [paper, setPaper] = useState({ w: 0, h: 0 });
  const [celebrated, setCelebrated] = useState(false);
  const [demoOn, setDemoOn] = useState(true);
  const [demoNonce, setDemoNonce] = useState(0);
  const strokesRef = useRef<Map<number, Pt[]>>(new Map()); // one stroke per finger (multi-touch)
  const scribblesRef = useRef(0); // consecutive free-scribbles this guide

  // drawing has no score — but when the session timer expires we gently end
  useEffect(() => {
    if (expired) {
      recordWin('draw');
      setDone(true);
    }
  }, [expired, recordWin]);

  // canvas sizing (+ paper size for the guide box). Everything is measured from
  // the canvas itself — the box her finger actually draws in — so strokes land
  // under the finger whatever border or padding the paper around it has.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      setPaper({ w: r.width, h: r.height });
      const img = canvas.width
        ? canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
        : null;
      canvas.width = Math.max(1, r.width * dpr);
      canvas.height = Math.max(1, r.height * dpr);
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (img) ctx.putImageData(img, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrapRef.current!);
    return () => ro.disconnect();
  }, []);

  // guides filtered by her stage — content carries its own minimum age
  const guides = useMemo<string[]>(() => {
    const out: string[] = [];
    for (let st = 0; st <= stage; st++) out.push(...ART_LADDER[st], ...GLYPH_LADDER[st]);
    return out;
  }, [stage]);
  const guideCount = guides.length;
  const current = guides[guideIdx % guideCount];
  const guide = current && GUIDE_PATHS[current] ? (current as ArtId) : null;
  const glyph = current && !GUIDE_PATHS[current] ? current : null;

  // guide box: centered square the demo hand & templates live in
  const box = useMemo(() => {
    const s = Math.max(120, Math.min(300, paper.w * 0.62, paper.h * 0.66));
    return { l: (paper.w - s) / 2, t: (paper.h - s) / 2, s };
  }, [paper]);

  // handwriting fonts must be loaded before a glyph is rasterised into the
  // trace template, otherwise she'd be judged against the digital letterform
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    const mark = () => {
      if (live) setFontsReady(true);
    };
    if (document.fonts) {
      Promise.all([
        document.fonts.load('170px Kavivanar', 'அ'),
        document.fonts.load('170px Andika', 'A2'),
      ])
        .then(mark)
        .catch(mark);
      document.fonts.ready.then(mark).catch(() => {});
    } else mark();
    return () => {
      live = false;
    };
  }, []);

  // What she is invited to trace, worked out once per guide: the template her
  // strokes are judged against (normalised space) and the path the demo hand
  // follows. Nothing to trace until the paper is laid out — and, for a glyph,
  // until its handwriting font has arrived.
  const laidOut = paper.w > 0;
  const { template, demoPts } = useMemo<{ template: Pt[]; demoPts: Pt[] }>(() => {
    if (laidOut && guide) {
      const d = GUIDE_PATHS[guide];
      return { template: samplePath(d, 96), demoPts: samplePath(d) };
    }
    if (laidOut && glyph && fontsReady) {
      const inked = glyphInk(glyph);
      return { template: inked.pts, demoPts: sweepPath(inked.bbox) };
    }
    return { template: [], demoPts: [] };
  }, [guide, glyph, laidOut, fontsReady]);

  // name the guide + replay the demo when it changes
  useEffect(() => {
    scribblesRef.current = 0;
    if (!guideOn || done) return; // …and never behind the end card
    if (guide) {
      const def = SHAPES.find((s) => s.id === guide);
      if (def) speakPair(def.ta, def.en, settings.english);
    } else if (glyph) {
      const num = NUMBERS.find((n) => String(n.n) === glyph);
      if (num) speakPair(num.ta, num.en, settings.english);
      else speak(glyph, /[அ-ஔ]/.test(glyph) ? 'ta' : 'en');
    }
    if (demoAllowed) {
      setDemoOn(true);
      setDemoNonce((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideIdx, guideOn]);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };

  const clear = () => {
    const c = canvasRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setStamps([]);
  };

  const complete = () => {
    setCelebrated(true);
    chimeGood();
    recordWin('draw');
    recordOutcome('draw', true);
    const praise = pick(PRAISE_EFFORT);
    speakPair(praise.ta, praise.en, settings.english);
    // through `later`: if she goes home mid-celebration, this must not fire
    // into a canvas that no longer exists
    later(() => {
      clear();
      setGuideIdx((g) => (g + 1) % guideCount);
      setCelebrated(false);
    }, 2400);
  };

  const down = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    setDemoOn(false); // she took over — the model steps aside
    const { x, y, w, h } = pos(e);
    if (tool !== 'draw') {
      setStamps((s) => [...s.slice(-24), { art: tool as ArtId, x: x / w, y: y / h, size: 54 }]);
      chimeTap();
      setTool('draw');
      return;
    }
    // multi-touch: every finger gets its OWN stroke — never one thick line
    // stretched between fingers
    strokesRef.current.set(e.pointerId, [{ x, y }]);
    const ctx = canvasRef.current!.getContext('2d')!;
    ctx.strokeStyle = ink;
    ctx.lineWidth = brush;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };
  const move = (e: React.PointerEvent) => {
    const strokePts = strokesRef.current.get(e.pointerId);
    if (!strokePts || tool !== 'draw') return;
    const { x, y } = pos(e);
    const last = strokePts[strokePts.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) < 2.5) return; // coalesce — battery-friendly
    strokePts.push({ x, y });
    const ctx = canvasRef.current!.getContext('2d')!;
    // draw only the new segment — concurrent fingers never connect
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  /* completion is judged only when the finger lifts: did THIS stroke try to be
     the guide shape? A recognised attempt completes the picture; scribbles stay
     scribbles — no false rewards, and free drawing is never punished. */
  const up = (e: React.PointerEvent) => {
    const strokePts = strokesRef.current.get(e.pointerId);
    if (!strokePts) return;
    strokesRef.current.delete(e.pointerId);
    if (!guideOn || celebrated || done || !template.length) return;
    const { verdict } = glyph
      ? judgeGlyph(strokePts, template, box) // letters: trace-over-ink coverage
      : judgeStroke(strokePts, template, box); // shapes: outline match
    if (verdict === 'match') {
      complete();
    } else if (verdict === 'close') {
      chimeSoft(); // recognisable effort — gentle encouragement, no reward yet
      speak('கிட்டத்தட்ட முடிந்தது!', 'ta'); // "almost there!"
    } else {
      // free scribble: if she's scribbled a lot without trying the shape,
      // replay the demo once so the invitation is visible again
      scribblesRef.current += 1;
      if (scribblesRef.current >= 6 && demoAllowed) {
        scribblesRef.current = 0;
        setDemoOn(true);
        setDemoNonce((n) => n + 1);
      }
    }
  };

  return (
    <div className="relative h-full">
      <GameShell ta="வரையலாம்" en="draw & scribble" art="flower" onHome={onHome} tint="#F5CAC3">
        {/* paper */}
        <div
          ref={wrapRef}
          className="relative grow min-h-0 rounded-3xl overflow-hidden border-3 border-plum/10 bg-white"
        >
          {/* tracing guide beneath the canvas */}
          {guideOn && (
            <div
              className="absolute flex items-center justify-center pointer-events-none"
              style={{ left: box.l, top: box.t, width: box.s, height: box.s }}
            >
              {guide && <Art id={guide} size={box.s} className="opacity-[0.15]" />}
              {glyph && (
                <span
                  className="text-plum opacity-[0.2]"
                  style={{ fontSize: box.s * 0.92, fontFamily: HAND_FONT }}
                >
                  {glyph}
                </span>
              )}
            </div>
          )}
          {/* demonstrating hand — shows the motion, then steps aside */}
          {guideOn && demoOn && !celebrated && !done && demoPts.length > 1 && (
            <TraceDemo
              pts={demoPts}
              box={box}
              loops={plays < 2 ? 2 : 1}
              nonce={demoNonce}
              onDone={() => setDemoOn(false)}
            />
          )}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ touchAction: 'none' }}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          />
          {/* the pop-in sits on an inner element: on the stamp itself its
              keyframes would override the transform that centres it on her tap */}
          {stamps.map((s, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                transform: 'translate(-50%,-50%)',
              }}
            >
              <div className="anim-pop">
                <Art id={s.art} size={s.size} />
              </div>
            </div>
          ))}
          {/* celebration: the traced picture blooms in full colour */}
          {celebrated && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/60 z-10">
              <div className="anim-pop">
                {guide && <Art id={guide} size={Math.min(220, box.s * 0.8)} />}
                {glyph && (
                  <span
                    className="text-salmon"
                    style={{ fontSize: Math.min(200, box.s * 0.78), fontFamily: HAND_FONT }}
                  >
                    {glyph}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* tools */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {INKS.map((c) => (
              <button
                key={c}
                aria-label={c}
                onClick={() => {
                  setInk(c);
                  setTool('draw');
                }}
                className="rounded-full transition-transform active:scale-90"
                style={{
                  width: 40,
                  height: 40,
                  background: c,
                  border:
                    ink === c && tool === 'draw'
                      ? '4px solid #563E79'
                      : '3px solid rgba(86,62,121,0.25)',
                  transform: ink === c && tool === 'draw' ? 'scale(1.15)' : undefined,
                }}
              />
            ))}
            <button
              onClick={() => setBrush((b) => (b === 8 ? 18 : 8))}
              className="btn-chunky !min-h-10 !px-3 text-sm"
              aria-label="brush size"
            >
              {brush === 8 ? '● சிறியது' : '⬤ பெரியது'}
            </button>
          </div>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {STAMPS.map((s) => (
              <button
                key={s}
                onClick={() => setTool(s)}
                className={`sticker !rounded-2xl p-1.5 active:scale-90 transition-transform ${tool === s ? 'ring-4 ring-sage' : ''}`}
                aria-label={`stamp ${s}`}
              >
                <Art id={s} size={34} />
              </button>
            ))}
            <button
              className={`btn-chunky !min-h-11 text-sm ${guideOn ? 'bg-sun' : ''}`}
              onClick={() => setGuideOn((g) => !g)}
            >
              {guideOn ? 'வடிவம் ✓' : 'வடிவம்'}
            </button>
            <button
              className="btn-chunky !min-h-11 text-sm"
              onClick={() => {
                setGuideIdx((g) => (g + 1) % guideCount);
                setGuideOn(true);
                chimeTap();
              }}
            >
              அடுத்தது →
            </button>
            <button
              className="btn-chunky !min-h-11 text-sm bg-coral"
              onClick={() => {
                clear();
                chimeTap();
              }}
            >
              அழி
            </button>
          </div>
        </div>
      </GameShell>
      {done && (
        <EndCard
          onAgain={() => {
            clear();
            setDone(false);
          }}
          onHome={onHome}
        />
      )}
    </div>
  );
}
