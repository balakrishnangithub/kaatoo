import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { useRounds } from './useRounds';
import { flush, renderWithStore, saved, seedProfile } from '../test/helpers';

/**
 * The round lifecycle every tap-choice game shares. The double-tap and the
 * leave-mid-celebration cases were real bugs in the games' hand-rolled copies.
 */

const ROUNDS = 3;
const DELAY = 700;

/** the smallest possible game: "right" solves the round, "wrong" is a miss */
function Game({ onDeal }: { onDeal?: () => void }) {
  const [deals, setDeals] = useState(1);
  const r = useRounds('odd', ROUNDS, () => {
    setDeals((d) => d + 1);
    onDeal?.();
  });
  return (
    <div>
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
