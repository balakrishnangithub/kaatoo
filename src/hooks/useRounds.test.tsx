import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { useRounds } from './useRounds';
import { abilityAt, priorSkill, type Ladder } from '../lib/skill';
import { aboutToLevelUp, flush, renderWithStore, saved, seedProfile } from '../test/helpers';

/**
 * The round lifecycle every tap-choice game shares. The double-tap and the
 * leave-mid-celebration cases were real bugs in the games' hand-rolled copies.
 */

const ROUNDS = 3;
const DELAY = 700;
const LADDER: Ladder = { top: 3 };

/** the smallest possible game: "right" solves the round, "wrong" is a miss */
function Game({ onDeal, rounds = ROUNDS }: { onDeal?: () => void; rounds?: number }) {
  const [deals, setDeals] = useState(1);
  const r = useRounds('odd', {
    rounds,
    ladder: LADDER,
    deal: (level) => `dealt at ${level}`,
    onDeal: () => {
      setDeals((d) => d + 1);
      onDeal?.();
    },
  });
  return (
    <div>
      <span data-testid="board">{r.board}</span>
      <span data-testid="level">{r.level}</span>
      <span data-testid="round">{r.round}</span>
      <span data-testid="misses">{r.misses}</span>
      <span data-testid="solved">{String(r.solved)}</span>
      <span data-testid="done">{String(r.done)}</span>
      <span data-testid="deals">{deals}</span>
      <button onClick={() => r.solve(DELAY)}>right</button>
      <button onClick={r.miss}>wrong</button>
      <button onClick={r.restart}>again</button>
    </div>
  );
}

const text = (id: string) => screen.getByTestId(id).textContent;
const tap = (label: string) => fireEvent.click(screen.getByText(label));

describe('useRounds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    seedProfile({ settings: { sound: false } });
  });
  afterEach(() => vi.useRealTimers());

  it('a solved round locks, then the next one is dealt after the delay', async () => {
    renderWithStore(<Game />);
    tap('right');
    expect(text('solved')).toBe('true');
    expect(text('round')).toBe('0'); // the answered board stays while it is celebrated
    await flush(DELAY);
    expect(text('round')).toBe('1');
    expect(text('solved')).toBe('false');
    expect(text('deals')).toBe('2');
  });

  it('a double-tap on the right answer counts once — no skipped round', async () => {
    renderWithStore(<Game />);
    tap('right');
    tap('right');
    await flush(DELAY * 3);
    expect(text('round')).toBe('1');
    expect(saved().progress.odd.outcomes).toEqual([1]);
  });

  it('counts misses, and a round with a miss is not a clean one', async () => {
    renderWithStore(<Game />);
    tap('wrong');
    tap('wrong');
    expect(text('misses')).toBe('2');
    tap('right');
    expect(saved().progress.odd.outcomes).toEqual([0]);
    await flush(DELAY);
    expect(text('misses')).toBe('0'); // a new round starts clean
  });

  it('a wrong tap after the round is solved is ignored', () => {
    renderWithStore(<Game />);
    tap('right');
    tap('wrong');
    expect(text('misses')).toBe('0');
  });

  it('the last round ends the game instead of dealing a phantom round', async () => {
    renderWithStore(<Game />);
    for (let i = 0; i < ROUNDS; i++) {
      tap('right');
      await flush(DELAY);
    }
    expect(text('done')).toBe('true');
    expect(text('round')).toBe(String(ROUNDS - 1));
    expect(text('deals')).toBe(String(ROUNDS)); // one per round — none behind the end card
    expect(saved().progress.odd).toMatchObject({ plays: 1, wins: 1, outcomes: [1, 1, 1] });
  });

  it('restart deals a fresh first round', async () => {
    renderWithStore(<Game />);
    for (let i = 0; i < ROUNDS; i++) {
      tap('right');
      await flush(DELAY);
    }
    tap('again');
    expect(text('done')).toBe('false');
    expect(text('round')).toBe('0');
    expect(text('solved')).toBe('false');
    expect(text('deals')).toBe(String(ROUNDS + 1));
  });

  it('leaving mid-celebration disarms the pending advance', async () => {
    const onDeal = vi.fn();
    const { unmount } = renderWithStore(<Game onDeal={onDeal} />);
    tap('right');
    unmount();
    await flush(DELAY * 3);
    expect(onDeal).not.toHaveBeenCalled(); // no round is dealt into a screen she has left
  });
});

describe('useRounds — each round at her level', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** a stored estimate: she knows `level` this well, and the estimate is settled */
  const settledAt = (level: number, p = 0.8) => ({
    odd: { plays: 9, wins: 9, skill: { theta: abilityAt(level, p), u: 0, n: 30, at: 0 } },
  });

  it('a new game opens where her age suggests, and deals its board at that level', () => {
    seedProfile({ settings: { sound: false, stageOverride: 2 } });
    renderWithStore(<Game />);
    expect(text('level')).toBe('2');
    expect(text('board')).toBe('dealt at 2');
  });

  it('her own record beats her age: a skilled two-year-old opens high', () => {
    seedProfile({ settings: { sound: false }, progress: settledAt(3) });
    renderWithStore(<Game />);
    expect(text('level')).toBe('3');
  });

  it('a clean round that tips the estimate deals the NEXT round one level up', async () => {
    seedProfile({ settings: { sound: false }, progress: aboutToLevelUp('odd') });
    renderWithStore(<Game />);
    expect(text('level')).toBe('0');
    tap('right');
    expect(text('board')).toBe('dealt at 0'); // nothing changes under her finger…
    await flush(DELAY);
    expect(text('level')).toBe('1'); // …the change arrives with the next round
    expect(text('board')).toBe('dealt at 1');
  });

  it('rounds that needed tries bring the level back down', async () => {
    seedProfile({ settings: { sound: false }, progress: settledAt(2) });
    renderWithStore(<Game rounds={5} />);
    expect(text('level')).toBe('2');
    for (const expectedNext of ['2', '1']) {
      tap('wrong');
      await flush(1000);
      tap('right');
      await flush(DELAY);
      expect(text('level')).toBe(expectedNext); // one such round is not enough; two are
    }
  });

  it('every fourth round is one step easier, without moving her level', async () => {
    seedProfile({ settings: { sound: false }, progress: settledAt(2, 0.8) });
    renderWithStore(<Game rounds={5} />);
    const seen: string[] = [];
    for (let round = 0; round < 5; round++) {
      seen.push(text('level'));
      tap('right');
      await flush(DELAY);
    }
    // clean rounds that are not yet enough to step up: level 2 throughout — but
    // the fourth is dealt at 1, and the fifth is back at 2
    expect(seen).toEqual(['2', '2', '2', '1', '2']);
  });

  it('the estimate is saved after every round', async () => {
    seedProfile({ settings: { sound: false } });
    renderWithStore(<Game />);
    tap('right');
    const s = saved().progress.odd.skill;
    expect(s.n).toBe(1);
    expect(s.theta).toBeGreaterThan(priorSkill(0).theta);
  });

  it('a burst of wrong taps (mashing) costs less than the same misses made one by one', async () => {
    const thetaAfterTwoMisses = async (gapMs: number) => {
      seedProfile({ settings: { sound: false }, progress: settledAt(1, 0.7) });
      const { unmount } = renderWithStore(<Game />);
      tap('wrong');
      await flush(gapMs);
      tap('wrong');
      tap('right');
      const theta = saved().progress.odd.skill.theta;
      unmount();
      return theta;
    };
    const considered = await thetaAfterTwoMisses(2000);
    const mashed = await thetaAfterTwoMisses(100);
    expect(mashed).toBeGreaterThan(considered);
  });
});
