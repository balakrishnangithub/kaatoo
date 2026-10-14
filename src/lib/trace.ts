/*
 * Stroke understanding — a tiny in-browser classifier for toddler tracing.
 *
 * Instead of a neural model (overkill on a phone, drains battery), this judges
 * one completed stroke by its SHAPE: the stroke is resampled to 64 points and
 * compared against the guide template with a scale/position/rotation-invariant
 * symmetric Hausdorff distance over the normalised point sets.
 *
 * Two properties matter for a 2-year-old:
 *  - SYMMETRIC distance means the stroke must cover the WHOLE guide — colouring
 *    30% of a circle and drifting away does not count as finishing it.
 *  - The gates below separate "she TRIED to draw the shape" from "she scribbled"
 *    without ever punishing free scribble play.
 *
 * Runs in well under a millisecond on low-end hardware — no allocations in the
 * pointer path, judging happens only on finger-lift.
 */

export interface Pt {
  x: number;
  y: number;
}

/** the centred square the guide is drawn in: left, top, side (paper pixels) */
export interface GuideBox {
  l: number;
  t: number;
  s: number;
}

/** bounding box of a point set: width and height, plus its centre */
function bounds(pts: Pt[]): { w: number; h: number; cx: number; cy: number } {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

/** resample evenly by arc length */
function resample(pts: Pt[], n = 32): Pt[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => ({ ...pts[0] }));
  const segs: number[] = [0];
  for (let i = 1; i < pts.length; i++)
    segs.push(segs[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = segs[segs.length - 1];
  const step = total / (n - 1);
  const out: Pt[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const target = k * step;
    while (j < segs.length - 2 && segs[j + 1] < target) j++;
    const t = segs[j + 1] === segs[j] ? 0 : (target - segs[j]) / (segs[j + 1] - segs[j]);
    out.push({
      x: pts[j].x + (pts[j + 1].x - pts[j].x) * t,
      y: pts[j].y + (pts[j + 1].y - pts[j].y) * t,
    });
  }
  return out;
}

/** centre + uniform-scale to a unit box (rotation already irrelevant for Hausdorff) */
function normalizeUnit(pts: Pt[]): Pt[] {
  const { w, h, cx, cy } = bounds(pts);
  const s = Math.max(w, h);
  if (s < 1e-9) return [{ x: 0, y: 0 }];
  return pts.map((p) => ({ x: (p.x - cx) / s, y: (p.y - cy) / s }));
}

function meanMinDist(a: Pt[], b: Pt[]): number {
  let sum = 0;
  for (const p of a) {
    let best = Infinity;
    for (const q of b) {
      const d = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
      if (d < best) best = d;
    }
    sum += Math.sqrt(best);
  }
  return sum / a.length;
}

/**
 * symmetric mean-Hausdorff between normalised point sets.
 * 0 = identical outline. Symmetry = partial attempts score poorly:
 * both "every stroke point is near the guide" AND "every guide point was drawn over".
 */
function shapeDistance(strokeRaw: Pt[], templateRaw: Pt[]): number {
  const s = normalizeUnit(resample(strokeRaw, 64));
  const t = normalizeUnit(resample(templateRaw, 64));
  if (!s.length || !t.length) return 1;
  return (meanMinDist(s, t) + meanMinDist(t, s)) / 2;
}

/** |log(aspect ratio difference)| — circle-vs-oval, square-vs-rect discriminator */
function aspectLogDiff(a: Pt[], b: Pt[]): number {
  const ar = (pts: Pt[]) => {
    const { w, h } = bounds(pts);
    return (w + 1e-9) / (h + 1e-9);
  };
  return Math.abs(Math.log(ar(a) / ar(b)));
}

export type Verdict = 'match' | 'close' | 'scribble';

/** does the stroke wander all over the paper instead of committing to one shape? */
function wanders(strokeRaw: Pt[], guideBox: GuideBox): boolean {
  if (strokeRaw.length < 6) return false;
  const { w, h } = bounds(strokeRaw);
  return Math.hypot(w, h) > guideBox.s * 1.35;
}

/** A genuine shape attempt is CLOSED (ends near where it began) or TIGHT
 *  (path length close to its span). Open, over-long, sprawling strokes are
 *  scribbles — this is what separates "tried to draw" from "just scribbled". */
function looksIntentional(strokeRaw: Pt[]): boolean {
  if (strokeRaw.length < 6) return false;
  let len = 0;
  for (let i = 1; i < strokeRaw.length; i++)
    len += Math.hypot(strokeRaw[i].x - strokeRaw[i - 1].x, strokeRaw[i].y - strokeRaw[i - 1].y);
  const { w, h } = bounds(strokeRaw);
  const diag = Math.hypot(w, h);
  if (diag < 1e-6) return false;
  const a = strokeRaw[0];
  const b = strokeRaw[strokeRaw.length - 1];
  const closure = Math.hypot(a.x - b.x, a.y - b.y) / diag; // 0 = closed loop
  const tightness = len / diag; // 1 = straight line, ~3.1 = circle, high = tangled
  return closure < 0.45 || tightness < 2.6;
}

/* Thresholds measured against the real guide templates:
 *   honest wobbly attempts        0.02 – 0.07   → match
 *   recognisable but rough/nearby 0.08 – 0.14   → close
 *   unrelated shapes & lines      > 0.14        → scribble
 * The aspect guard keeps circle↔oval and square↔rect honest. */
const MATCH_D = 0.08;
const CLOSE_D = 0.14;
const ASPECT_GUARD = 0.3;

/**
 * Glyph tracing judge ("draw over the grey letter").
 *
 * A letter is a FILLED REGION at a known place on the paper, not an outline —
 * so unlike shapes, her stroke is judged in the guide box's own frame
 * (position and scale DO matter: a scribble in the corner is not the letter).
 *
 *   covered — what fraction of the letter's ink her stroke passed over
 *             (the whole letter, not 30% of it)
 *   onInk   — what fraction of her stroke stayed on the letter
 *
 * Measured behaviour (all handwritten Tamil/Latin/digit glyphs):
 *   honest traces (row sweeps, stroke-following)  covered ≥ 0.95, onInk ≥ 0.75
 *   wild scribbles / corner scribbles / tiny dots  rejected outright
 *   box-spanning zig-zags                          onInk collapses → rejected
 * Colouring densely over the letter is accepted — that IS the exercise.
 */
export function judgeGlyph(
  strokeRaw: Pt[],
  inkRaw: Pt[],
  guideBox?: GuideBox,
): { verdict: Verdict; score: number } {
  if (strokeRaw.length < 6) return { verdict: 'scribble', score: 0 };
  if (!guideBox) return { verdict: 'scribble', score: 0 };
  if (wanders(strokeRaw, guideBox)) return { verdict: 'scribble', score: 0 };
  if (!inkRaw.length) return { verdict: 'scribble', score: 0 };

  // stroke into the box frame (0..1), matching the rasterised ink fractions
  const s = resample(
    strokeRaw.map((p) => ({
      x: (p.x - guideBox.l) / guideBox.s,
      y: (p.y - guideBox.t) / guideBox.s,
    })),
    96,
  );
  const RV = 0.14; // "passed over" reach — generous wobble room (~33px on a phone)
  const RO = 0.09; // "stayed on ink" reach — stricter, so box-filling zig-zags fail
  let covered = 0;
  for (const q of inkRaw) {
    for (const p of s) {
      const d = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
      if (d < RV * RV) {
        covered++;
        break;
      }
    }
  }
  const coverRatio = covered / inkRaw.length;
  let on = 0;
  for (const p of s) {
    for (const q of inkRaw) {
      const d = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
      if (d < RO * RO) {
        on++;
        break;
      }
    }
  }
  const onRatio = on / s.length;

  if (coverRatio >= 0.75 && onRatio >= 0.55) return { verdict: 'match', score: 1 };
  if (coverRatio >= 0.5 && onRatio >= 0.4) return { verdict: 'close', score: 0.5 };
  return { verdict: 'scribble', score: 0 };
}

/**
 * Judge one completed stroke against a guide template.
 *  match    — clearly tried to draw this shape (credit it)
 *  close    — recognisable effort, a bit off (encourage, partial credit)
 *  scribble — free scribble (no judgement, just let her play)
 */
export function judgeStroke(
  strokeRaw: Pt[],
  templateRaw: Pt[],
  guideBox?: GuideBox,
): { verdict: Verdict; score: number } {
  if (guideBox && wanders(strokeRaw, guideBox)) return { verdict: 'scribble', score: 0 };
  if (!looksIntentional(strokeRaw)) return { verdict: 'scribble', score: 0 };
  const d = shapeDistance(strokeRaw, templateRaw);
  if (d < MATCH_D) {
    // same outline family but wrong proportions (circle→oval, square→rect)
    if (aspectLogDiff(strokeRaw, templateRaw) > ASPECT_GUARD)
      return { verdict: 'close', score: 0.5 };
    return { verdict: 'match', score: 1 };
  }
  if (d < CLOSE_D) return { verdict: 'close', score: 0.5 };
  return { verdict: 'scribble', score: 0 };
}
