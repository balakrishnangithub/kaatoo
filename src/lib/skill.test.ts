import { describe, expect, it } from 'vitest';
import {
  abilityAt,
  chooseLevel,
  DOWN,
  expected,
  knows,
  LAPSE,
  OPEN,
  priorSkill,
  roundScore,
  UP,
  updateSkill,
  type Ladder,
  type Skill,
} from './skill';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 15);
const FOUR: Ladder = { top: 3 };
const settled = (theta: number): Skill => ({ theta, u: 0, n: 40, at: NOW });

/** play rounds at whatever level the model picks; `answer` says how each goes */
function play(
  s: Skill,
  ladder: Ladder,
  rounds: number,
  answer: (level: number, i: number) => number,
) {
  let level = chooseLevel(s, ladder);
  const levels: number[] = [];
  for (let i = 0; i < rounds; i++) {
    if (i > 0) level = chooseLevel(s, ladder, level);
    levels.push(level);
    const chance = ladder.chance?.(level) ?? 0;
    s = updateSkill(s, { level, score: answer(level, i), chance }, NOW + i);
  }
  return { s, levels };
}

describe('skill — where a game starts', () => {
  it('a new game opens at the level the prior names, whatever the game', () => {
    for (const level of [0, 1, 2, 3]) expect(chooseLevel(priorSkill(level), FOUR)).toBe(level);
  });

  it('the prior is a guess she is expected to meet, not an exam: she knows it OPEN of the time', () => {
    expect(knows(priorSkill(2).theta, 2)).toBeCloseTo(OPEN);
  });

  it('a stage beyond the top level opens at the top, not past it', () => {
    expect(chooseLevel(priorSkill(3), { top: 2 })).toBe(2);
  });

  it('a sitting opens one notch safe: at a level she knows OPEN well, not merely UP well', () => {
    const s = settled(abilityAt(2, (UP + OPEN) / 2)); // between the two
    expect(chooseLevel(s, FOUR, 1)).toBe(2); // mid-sitting she would step up…
    expect(chooseLevel(s, FOUR)).toBe(1); // …but a new sitting opens one easier
  });
});

describe('skill — following her', () => {
  it('a child who gets everything right climbs every level, without an age ceiling', () => {
    const { levels } = play(priorSkill(0), FOUR, 15, () => 1);
    expect(levels[0]).toBe(0);
    expect(levels.at(-1)).toBe(3);
    // and never more than one step between rounds
    for (let i = 1; i < levels.length; i++)
      expect(Math.abs(levels[i] - levels[i - 1])).toBeLessThanOrEqual(1);
  });

  it('a new child climbs fast, a well-known one more steadily', () => {
    const roundsToStepUp = (s: Skill) => play(s, FOUR, 20, () => 1).levels.indexOf(1);
    const fresh = roundsToStepUp(priorSkill(0));
    const known = roundsToStepUp({ ...priorSkill(0), u: 0 });
    expect(fresh).toBeLessThanOrEqual(3);
    expect(known).toBeGreaterThan(fresh);
    expect(known).toBeLessThanOrEqual(6);
  });

  it('a child who keeps missing is brought down to the easiest level', () => {
    const { levels } = play(priorSkill(3), FOUR, 8, () => 0);
    expect(levels.at(-1)).toBe(0);
  });

  it('one miss at a level she knows well does not move her; repeated misses do', () => {
    let s = settled(abilityAt(2, 0.85));
    s = updateSkill(s, { level: 2, score: 0, chance: 0 }, NOW);
    expect(chooseLevel(s, FOUR, 2)).toBe(2);
    s = updateSkill(s, { level: 2, score: 0, chance: 0 }, NOW);
    s = updateSkill(s, { level: 2, score: 0, chance: 0 }, NOW);
    expect(chooseLevel(s, FOUR, 2)).toBe(1);
  });

  it('a child who is only guessing never climbs, however lucky the streaks', () => {
    const twoPictures: Ladder = { top: 3, chance: () => 1 / 2 };
    // right, wrong, right, wrong… exactly what tapping at random earns from two
    const { levels } = play(priorSkill(0), twoPictures, 40, (_, i) => (i % 2 === 0 ? 1 : 0));
    expect(Math.max(...levels)).toBe(0);
  });

  it('a lucky guess counts for less: a right answer from two moves her less than one from four', () => {
    const s = settled(abilityAt(1, 0.7));
    const fromTwo = updateSkill(s, { level: 1, score: 1, chance: 1 / 2 }, NOW).theta - s.theta;
    const fromFour = updateSkill(s, { level: 1, score: 1, chance: 1 / 4 }, NOW).theta - s.theta;
    expect(fromTwo).toBeGreaterThan(0);
    expect(fromTwo).toBeLessThan(fromFour);
  });

  it('a miss she was nearly sure to get right counts mostly as a lapse of attention', () => {
    const s = settled(abilityAt(2, 0.97));
    expect(expected(s.theta, 2)).toBeGreaterThanOrEqual(LAPSE);
    const lapse = s.theta - updateSkill(s, { level: 2, score: 0, chance: 0 }, NOW).theta;
    const t = settled(abilityAt(2, 0.7));
    const realMiss = t.theta - updateSkill(t, { level: 2, score: 0, chance: 0 }, NOW).theta;
    expect(lapse).toBeLessThan(realMiss / 2);
  });

  it('a round worth less (she was mashing) moves her less', () => {
    const s = settled(abilityAt(1, 0.7));
    const full = s.theta - updateSkill(s, { level: 1, score: 0, chance: 0 }, NOW).theta;
    const half =
      s.theta - updateSkill(s, { level: 1, score: 0, chance: 0, weight: 0.5 }, NOW).theta;
    expect(half).toBeCloseTo(full / 2);
  });

  it('partial credit sits between a clean round and a failed one', () => {
    const s = settled(abilityAt(1, 0.7));
    const after = (score: number) => updateSkill(s, { level: 1, score, chance: 0 }, NOW).theta;
    expect(after(0.5)).toBeGreaterThan(after(0));
    expect(after(0.5)).toBeLessThan(after(1));
  });

  it('ability never sinks so low that climbing back takes forever', () => {
    const { s } = play(priorSkill(0), FOUR, 50, () => 0);
    expect(s.theta).toBeGreaterThanOrEqual(-1);
    // from rock bottom, a couple of good sittings bring her back up
    expect(play(s, FOUR, 12, () => 1).levels.at(-1)).toBeGreaterThan(0);
  });
});

describe('skill — how sure it is', () => {
  it('each round makes it surer, and it counts the rounds', () => {
    const s = updateSkill(priorSkill(0), { level: 0, score: 1, chance: 0 }, NOW);
    expect(s.u).toBeLessThan(1);
    expect(s.n).toBe(1);
    expect(s.at).toBe(NOW);
  });

  it('time away makes it unsure again — a month later it moves as fast as for a new child', () => {
    const s = settled(abilityAt(1, 0.7));
    const step = (now: number) =>
      updateSkill(s, { level: 1, score: 1, chance: 0 }, now).theta - s.theta;
    const tomorrow = step(NOW + DAY);
    const nextMonth = step(NOW + 30 * DAY);
    const fresh =
      updateSkill({ ...s, u: 1, at: 0 }, { level: 1, score: 1, chance: 0 }, NOW).theta - s.theta;
    expect(nextMonth).toBeGreaterThan(tomorrow * 1.5);
    expect(nextMonth).toBeCloseTo(fresh);
  });
});

describe('skill — the band that keeps a game steady', () => {
  it('steps up only once the next level is known UP well', () => {
    expect(chooseLevel(settled(abilityAt(2, UP) - 0.01), FOUR, 1)).toBe(1);
    expect(chooseLevel(settled(abilityAt(2, UP) + 0.01), FOUR, 1)).toBe(2);
  });

  it('steps down only once the current level is known less than DOWN', () => {
    expect(chooseLevel(settled(abilityAt(2, DOWN) + 0.01), FOUR, 2)).toBe(2);
    expect(chooseLevel(settled(abilityAt(2, DOWN) - 0.01), FOUR, 2)).toBe(1);
  });

  it('moves one step at a time, and never off the ladder', () => {
    expect(chooseLevel(settled(10), FOUR, 0)).toBe(1);
    expect(chooseLevel(settled(-1), FOUR, 3)).toBe(2);
    expect(chooseLevel(settled(10), FOUR, 3)).toBe(3);
    expect(chooseLevel(settled(-1), FOUR, 0)).toBe(0);
    expect(chooseLevel(settled(10), { top: 2 }, 7)).toBe(2);
  });
});

describe('roundScore', () => {
  it('one decision: all or nothing', () => {
    expect(roundScore(0)).toBe(1);
    expect(roundScore(1)).toBe(0);
  });
  it('several decisions: each wrong try costs its share, never below zero', () => {
    expect(roundScore(0, 6)).toBe(1);
    expect(roundScore(3, 6)).toBe(0.5);
    expect(roundScore(9, 6)).toBe(0);
  });
});
