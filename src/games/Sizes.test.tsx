import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Sizes from './Sizes';
import { fitSizes, sizesFor, staircaseSlots } from '../lib/seriation';
import { StoreProvider } from '../lib/store';

/**
 * Regression tests for the sizes game:
 *
 *   Layout — the row must fit the field on every supported device, stay
 *   strictly descending, and never shrink below a tappable floor.
 *
 *   Choreography — every visible change must be caused by a tap and happen
 *   visibly: a correct tap places the item (no ghost-fade), the completed
 *   staircase celebrates and leaves as one object, and stale timers from a
 *   previous game can never mutate a fresh one ("items changed by
 *   themselves"). The glide itself is FLIP movement — verified in a real
 *   browser, not jsdom.
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

describe('Sizes — responsive layout (the overflow bug)', () => {
  // the devices this app must run well on, CSS px widths of the play field
  const FIELDS = [221, 251, 273, 360, 645]; // M53, iPhone13, S23U(rounded), small, Tab S7

  it('row never overflows the field at any level — the actual bug', () => {
    for (const level of [0, 1, 2]) {
      for (const w of FIELDS) {
        const { sizes, gap } = fitSizes(sizesFor(level), w);
        const total = sizes.reduce((a, b) => a + b, 0) + gap * (sizes.length - 1);
        // hard invariant: the row fits the field itself — nothing goes off-screen.
        // (on the narrowest field the tappability floor may push past the 92%
        // comfort budget by design, but never past the field edge)
        expect(total, `level ${level} on ${w}px: row ${total}px`).toBeLessThanOrEqual(w);
        expect(gap).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('sizes stay strictly descending (seriation never distorted)', () => {
    for (const level of [0, 1, 2]) {
      for (const w of FIELDS) {
        const { sizes } = fitSizes(sizesFor(level), w);
        for (let i = 1; i < sizes.length; i++) {
          expect(sizes[i - 1], `level ${level} @${w}px idx ${i}`).toBeGreaterThan(sizes[i]);
        }
      }
    }
  });

  it('tappability floor is the target; only field-fit may dip below it', () => {
    // per-count floors: 3 items ≥ 48px, 4 items ≥ 40px, 5 items ≥ 30px — met
    // whenever the field can afford them; never broken by more than 6px even
    // on the narrowest phone (the packed row fitting the field wins ties)
    const floors: Record<number, number> = { 0: 48, 1: 40, 2: 30 };
    for (const level of [0, 1, 2]) {
      for (const w of FIELDS) {
        const { sizes } = fitSizes(sizesFor(level), w);
        expect(Math.min(...sizes), `level ${level} @${w}px`).toBeGreaterThanOrEqual(
          floors[level] - 6,
        );
      }
    }
    // on fields with room, the floor is fully respected
    for (const level of [0, 1, 2]) {
      for (const w of [360, 645]) {
        const { sizes } = fitSizes(sizesFor(level), w);
        expect(Math.min(...sizes), `level ${level} @${w}px`).toBeGreaterThanOrEqual(floors[level]);
      }
    }
    const roomy = fitSizes(sizesFor(2), 645);
    expect(roomy.sizes).toEqual([140, 116, 94, 74, 56]); // untouched on the tablet
    expect(roomy.gap).toBe(20);
  });

  it('staircase slots: one per rank, biggest on the left, real button gaps', () => {
    // same per-count minimum the game uses — the corridor that keeps a placed
    // big item from covering its smaller neighbour's taps
    const gapFor = (count: number) => (count <= 3 ? 12 : count === 4 ? 16 : 20);
    for (const level of [0, 1, 2]) {
      for (const w of FIELDS) {
        const { sizes } = fitSizes(sizesFor(level), w);
        const gap = gapFor(sizes.length);
        const slots = staircaseSlots(sizes, gap);
        expect(slots.length, `level ${level}`).toBe(sizes.length);
        let prevRight = -Infinity;
        for (const s of slots) {
          const left = s.x - s.size / 2;
          const right = s.x + s.size / 2;
          expect(s.size, `level ${level} rank ${s.rank}`).toBe(sizes[s.rank]);
          expect(
            left - prevRight,
            `level ${level} @${w} rank ${s.rank} gap`,
          ).toBeGreaterThanOrEqual(gap);
          prevRight = right;
        }
        // slots span exactly the packed row width
        const span = prevRight - (slots[0].x - slots[0].size / 2);
        expect(span).toBeCloseTo(sizes.reduce((a, b) => a + b, 0) + gap * (sizes.length - 1));
        // and the packed row still fits the field on the narrowest device
        expect(span, `level ${level} @${w}px row ${span}px`).toBeLessThanOrEqual(w);
      }
    }
  });
});

describe('Sizes — choreography integrity', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('a correct tap places the item — no ghost-fade, it stays fully visible', async () => {
    const { container } = renderGame();
    await flush(100);
    const buttons = sizeButtons(container);
    fireEvent.click(buttons.get(0)!);
    await flush(100);
    // placed = fully opaque and disabled; nothing fades away anymore
    expect(buttons.get(0)!.style.opacity).not.toBe('0.25');
    expect(buttons.get(0)!).toBeDisabled();
    expect(buttons.get(1)!).not.toBeDisabled(); // next is live
  });

  it('restart never auto-advances the fresh game, and it stays playable', async () => {
    const { container } = renderGame();
    await flush(100);

    // play through all 4 rounds
    for (let r = 0; r < 4; r++) {
      const n = await finishRound(container);
      expect(n).toBeGreaterThanOrEqual(3);
      await flush(3000); // glide + bounce + hold + exit
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
    expect(buttons.get(0)!).toBeDisabled(); // placed state applied
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
    expect(fresh.get(0)!).not.toBeDisabled(); // nothing pre-placed
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
    for (const [, el] of buttons) expect(el).not.toBeDisabled();
    expect(screen.queryByLabelText('again')).not.toBeInTheDocument();
  });
});
