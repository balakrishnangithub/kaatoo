import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Sizes from './Sizes';
import { StoreProvider } from '../lib/store';

/**
 * Regression test for the "round changed by itself" bug:
 *
 *   - tapping "again" on the EndCard let stale 550ms/2400ms timers fire into
 *     the fresh game, auto-advancing or re-ordering it ("didn't wait,
 *     changed on its own");
 *   - and the fresh round must be immediately playable with every item live.
 *
 * Fix under test: all timeouts are tracked and disarmed on restart/unmount,
 * and closures are epoch-tagged so nothing from the old game can mutate the
 * new one. (The DOM-level half of the bug — element reuse across rounds —
 * is covered by key={round-id} and verified in a real browser, not jsdom.)
 */

function renderGame() {
  localStorage.clear();
  return render(
    <StoreProvider>
      <Sizes onHome={() => {}} />
    </StoreProvider>,
  );
}

/** size buttons by rank — aria-label carries it: "size 0" … "size n" */
function sizeButtons(container: HTMLElement): Map<number, HTMLElement> {
  const map = new Map<number, HTMLElement>();
  for (const el of container.querySelectorAll('button[aria-label^="size "]')) {
    const rank = Number((el.getAttribute('aria-label') || '').replace('size ', ''));
    map.set(rank, el as HTMLElement);
  }
  return map;
}

async function flush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/** tap ranks 0..n-1 in order (biggest → smallest) */
async function finishRound(container: HTMLElement) {
  const buttons = sizeButtons(container);
  const n = buttons.size;
  for (let rank = 0; rank < n; rank++) {
    const el = buttons.get(rank);
    if (el) fireEvent.click(el);
    await flush(50);
  }
  return n;
}

describe('Sizes — round transition integrity', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('restart never auto-advances the fresh game, and it stays playable', async () => {
    const { container } = renderGame();
    await flush(100);

    // play through all 4 rounds
    for (let r = 0; r < 4; r++) {
      const n = await finishRound(container);
      expect(n).toBeGreaterThanOrEqual(3);
      await flush(3000); // celebration + transition
    }
    expect(screen.getByLabelText('again')).toBeInTheDocument();

    // restart — then drain EVERY stale timer: the fresh game must sit still
    fireEvent.click(screen.getByLabelText('again'));
    await flush(10000);
    expect(screen.queryByLabelText('again')).not.toBeInTheDocument(); // not re-ended

    // and the fresh round is playable: tapping biggest works immediately
    const buttons = sizeButtons(container);
    fireEvent.click(buttons.get(0)!);
    await flush(100);
    expect(buttons.get(0)!.style.opacity).toBe('0.25'); // cleared state applied
  });

  it('double-tap on the final item queues exactly one transition', async () => {
    const { container } = renderGame();
    await flush(100);
    const buttons = sizeButtons(container);
    const n = buttons.size;
    for (let rank = 0; rank < n - 1; rank++) fireEvent.click(buttons.get(rank)!);
    await flush(50);

    // smallest item tapped twice in quick succession (excited toddler!)
    const last = buttons.get(n - 1)!;
    fireEvent.click(last);
    fireEvent.click(last);
    await flush(3000);

    // round advanced exactly once: a new playable round, not round +2
    expect(screen.queryByLabelText('again')).not.toBeInTheDocument();
    const fresh = sizeButtons(container);
    expect(fresh.size).toBe(n);
    expect(fresh.get(0)!.style.opacity).not.toBe('0.25'); // nothing pre-cleared
  });

  it('restart during the celebration window does not corrupt the fresh game', async () => {
    const { container } = renderGame();
    await flush(100);

    for (let r = 0; r < 4; r++) {
      await finishRound(container);
      await flush(3000);
    }
    expect(screen.getByLabelText('again')).toBeInTheDocument();

    // restart INSTANTLY (inside the old timers' tail)
    fireEvent.click(screen.getByLabelText('again'));
    await flush(100);

    // the fresh game must have a full, untouched first round
    const buttons = sizeButtons(container);
    expect(buttons.size).toBeGreaterThanOrEqual(3);
    for (const [, el] of buttons) expect(el.style.opacity).not.toBe('0.25');
    expect(screen.queryByLabelText('again')).not.toBeInTheDocument();
  });
});
