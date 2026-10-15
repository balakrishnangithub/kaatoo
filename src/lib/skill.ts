/**
 * skill.ts — how difficult the next round should be, from what she has
 * actually done. Pure functions only (the store persists the state, the
 * useSkill hook drives it), so every rule here is unit-tested on its own.
 *
 * The model, in one paragraph: each game keeps one ability estimate `theta`,
 * measured in that game's own levels. After every round it moves Elo-style
 * towards what happened — up a little after an expected success, down more
 * after a surprising miss (as in Math Garden: Klinkenberg et al. 2011). Each
 * sitting opens at the hardest level she should know about four times in five
 * (OPEN): success-heavy, because toddlers look away from what is too hard as
 * surely as from what is too easy (Kidd et al. 2012).
 *
 * What makes it fit two-year-olds rather than adults:
 *  - luck is allowed for: on a two-picture question a guess is right half the
 *    time, so a right answer there says less than a right answer from four,
 *    and a child who is only guessing drifts down, never up;
 *  - age is only the opening guess. The step size starts large and shrinks as
 *    rounds come in, so after a couple of sittings her answers are all that
 *    count — and it grows again after time away, because little ones change fast;
 *  - a miss she would almost surely have got right is mostly a lapse of
 *    attention, not of skill (child psychophysics: lapses inflate thresholds);
 *  - between rounds the level moves at most one step, and only past a band —
 *    one unlucky round never flips the game into a different task.
 */

/** a sitting opens at the hardest level she knows at least this well */
export const OPEN = 0.8;
/** step up once she knows the NEXT level at least this well… */
export const UP = 0.75;
/** …and back down once she knows her current level less well than this */
export const DOWN = 0.5;
/** a miss where success was at least this likely counts mostly as a lapse */
export const LAPSE = 0.9;
/** how sharply knowing falls away per level above her ability */
const SLOPE = 1;
/** step size when settled … when unsure (new, or back after a long break) */
const K_SETTLED = 1.1;
const K_UNSURE = 3;
/** each round removes this much uncertainty (0 = well known, 1 = unknown) */
const SETTLE_PER_ROUND = 0.1;
/** a month away is as uncertain as a fresh start */
const UNSETTLE_PER_DAY = 1 / 30;
const DAY_MS = 24 * 60 * 60 * 1000;
/** ability never sinks so far below the easiest level that climbing back is slow */
const THETA_MIN = -1;

/** the persisted estimate for one game */
export interface Skill {
  /** ability, in the game's own levels */
  theta: number;
  /** uncertainty: 1 = new or long away, 0 = well known */
  u: number;
  /** rounds that have informed the estimate */
  n: number;
  /** when the last round was recorded (ms since epoch), 0 = never */
  at: number;
}

/** what a game says about its levels */
export interface Ladder {
  /** the hardest level (levels run 0 … top) */
  top: number;
  /** the chance a round at this level is solved cleanly by luck alone (default 0) */
  chance?: (level: number) => number;
  /** decisions in one round at this level, for partial credit (default 1) */
  steps?: (level: number) => number;
}

/** one finished round */
export interface RoundResult {
  /** the level the round was dealt at */
  level: number;
  /** how well it went: 1 = cleanly, 0 = not at all; partial credit in between */
  score: number;
  /** the luck-alone success rate of that round (see Ladder.chance) */
  chance: number;
  /** how much the round should count: 1 normally, less when she was mashing */
  weight?: number;
}

const logistic = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** how sure we are of a learner whose estimate was last touched at `at` */
function uncertainty(s: Skill, now: number): number {
  if (!s.at) return s.u;
  const days = Math.max(0, now - s.at) / DAY_MS;
  return clamp(s.u + days * UNSETTLE_PER_DAY, 0, 1);
}

/** how likely she is to really know a round at `level` — luck left out */
export function knows(theta: number, level: number): number {
  return logistic(SLOPE * (theta - level));
}

/** the chance she solves a round at `level` cleanly — by knowing or by luck */
export function expected(theta: number, level: number, chance = 0): number {
  return chance + (1 - chance) * knows(theta, level);
}

/** the ability at which she knows `level` with probability `p` (the inverse of `knows`) */
export function abilityAt(level: number, p: number): number {
  return level + Math.log(p / (1 - p)) / SLOPE;
}

/** the starting estimate: she knows `level` OPEN of the time */
export function priorSkill(level: number): Skill {
  return { theta: abilityAt(level, OPEN), u: 1, n: 0, at: 0 };
}

/** the estimate after one more round */
export function updateSkill(s: Skill, r: RoundResult, now: number): Skill {
  const u = uncertainty(s, now);
  const e = expected(s.theta, r.level, r.chance);
  let weight = r.weight ?? 1;
  // a miss she was nearly certain to get right: attention, not ability
  if (r.score < 1 && e >= LAPSE) weight *= 0.25;
  const k = (K_SETTLED + (K_UNSURE - K_SETTLED) * u) * weight;
  return {
    theta: Math.max(THETA_MIN, s.theta + k * (clamp(r.score, 0, 1) - e)),
    u: clamp(u - SETTLE_PER_ROUND, 0, 1),
    n: s.n + 1,
    at: now,
  };
}

/**
 * The level to deal next.
 *  - opening a sitting (`current` undefined): the hardest level she knows at
 *    least OPEN of the time — or the easiest, if none is that safe;
 *  - between rounds: one step up once she knows the next level UP well, one
 *    step down once she knows her current level less than DOWN, else stay.
 */
export function chooseLevel(s: Skill, ladder: Ladder, current?: number): number {
  const k = (level: number) => knows(s.theta, level);
  if (current === undefined) {
    let best = 0;
    for (let level = 1; level <= ladder.top; level++) if (k(level) >= OPEN) best = level;
    return best;
  }
  const at = clamp(Math.round(current), 0, ladder.top);
  if (at < ladder.top && k(at + 1) >= UP) return at + 1;
  if (at > 0 && k(at) < DOWN) return at - 1;
  return at;
}

/** the luck-alone success rate of a round at `level` */
export const chanceAt = (ladder: Ladder, level: number) => ladder.chance?.(level) ?? 0;

/**
 * Score for a round of several decisions: every wrong try costs its share.
 * A single-decision round is all or nothing — a miss there IS the round.
 */
export function roundScore(misses: number, steps = 1): number {
  if (misses <= 0) return 1;
  if (steps <= 1) return misses === 0 ? 1 : 0;
  return clamp(1 - misses / steps, 0, 1);
}

/** two misses closer together than this are mashing, not choosing */
export const MASH_MS = 450;
