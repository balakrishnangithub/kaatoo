import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StoreProvider } from '../lib/store';
import { aboutToLevelUp, nextLevel, seedProfile } from '../test/helpers';
import type { default as BubblesComponent } from './Bubbles';

/**
 * Regression test for the "phantom progress" bug Dhanvika's appa found:
 *
 *   round 1: pop all 12 bubbles → EndCard
 *   tap "again" quickly (round-1 backstop timers still armed)
 *   round 2: progress dots climbed with NO bubbles on screen (stale timers
 *   resolving against the cleared dedupe set), the round ended early, and
 *   the next restart came up empty — no bubbles, no progress.
 *
 * Root causes:
 *   1. backstop/pop-shrink setTimeouts outlived their bubble AND their round;
 *   2. the dedupe guard (resolvedIds) was cleared by restart(), re-arming
 *      every stale timer;
 *   3. the spawn room check mixed a global id counter with that per-round
 *      set, so after a restart `idRef - resolvedIds.size` was 12 ≥ MAX —
 *      spawning froze until phantom resolves happened to unfreeze it.
 *
 * Runs with ?fast (short backstops) under fake timers so the whole scenario
 * replays deterministically. Note: jsdom never fires CSS animationend, so
 * "float away" is exercised only through the real backstop timers here.
 */

const TOTAL = 12;

// Bubbles reads ?fast at module load (screenshot/test helper), so the import
// must happen AFTER the URL is set — hence dynamic, memoized per test file.
let Bubbles: typeof BubblesComponent;
async function loadGame() {
  if (!Bubbles) Bubbles = (await import('./Bubbles')).default;
}

function renderGame(progress: Record<string, object> = {}) {
  seedProfile({ settings: { sound: false, stageOverride: 0 }, progress });
  return render(
    <StoreProvider>
      <Bubbles onHome={() => {}} />
    </StoreProvider>,
  );
}

/** filled progress dots */
function dots(container: HTMLElement): number {
  return container.querySelectorAll('.bg-sage').length;
}

/** live (un-popped) bubble buttons inside the play field */
function bubbles(container: HTMLElement): HTMLElement[] {
  const field = container.querySelector('.overflow-hidden');
  return field ? Array.from(field.querySelectorAll('button[aria-label]')) : [];
}

async function flush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

/** Pop what is visible, advancing time, until the EndCard appears. One bubble
 *  a step by default — some float away; `every` pops them all, so none escape. */
async function playRound(container: HTMLElement, maxSteps = 80, every = false) {
  let pops = 0;
  for (let i = 0; i < maxSteps && !screen.queryByLabelText('again'); i++) {
    for (const b of every ? bubbles(container) : bubbles(container).slice(0, 1)) {
      fireEvent.pointerDown(b);
      pops++;
    }
    await flush(500);
  }
  return pops;
}

describe('Bubbles — restart integrity', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/?fast'); // must precede module load
    await loadGame();
  });
  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, '', '/');
  });

  it('pop all → try again immediately → fresh round, zero phantom progress', async () => {
    const { container } = renderGame();

    // --- round 1: pop the whole dozen ---
    const pops1 = await playRound(container);
    expect(screen.getByLabelText('again')).toBeInTheDocument();
    expect(dots(container)).toBe(TOTAL);
    expect(pops1).toBeGreaterThanOrEqual(1);

    // --- the trap: restart while round-1 backstop timers are still armed ---
    fireEvent.click(screen.getByLabelText('again'));
    expect(dots(container)).toBe(0); // clean slate

    // let every stale timer fire (fast-mode backstops are all ≤ 7s)
    await flush(9000);
    // stale resolves must not have moved the dots beyond real round-2 events
    expect(dots(container)).toBeLessThanOrEqual(bubbles(container).length + 2);

    // --- round 2 must deliver and complete a real dozen ---
    const pops2 = await playRound(container);
    expect(screen.getByLabelText('again')).toBeInTheDocument();
    expect(pops2).toBeGreaterThanOrEqual(1);
    expect(dots(container)).toBe(TOTAL);

    // --- round 3 (the observed "no bubbles, no progress" state) must work ---
    fireEvent.click(screen.getByLabelText('again'));
    await flush(3000);
    expect(bubbles(container).length).toBeGreaterThan(0);
    expect(dots(container)).toBeLessThan(TOTAL); // in progress, not zombied
  });

  it('the end card appears even when this round changes the difficulty level', async () => {
    // A field popped in full tips her level up. The level used to be read
    // live, so that change re-ran the spawn effect, whose cleanup disarmed the
    // timer about to show the end card — an empty field, twelve dots, and
    // nothing more, for as long as she waited.
    const { container } = renderGame(aboutToLevelUp('bubbles'));
    expect(bubbles(container)[0].querySelector('svg')).toBeNull(); // level 0: colours
    await playRound(container, 80, true);
    expect(nextLevel('bubbles', 0)).toBe(1); // the level did tip
    expect(screen.getByLabelText('again')).toBeInTheDocument();
    expect(dots(container)).toBe(TOTAL);

    // and the game goes on being playable afterwards — at the level she earned
    fireEvent.click(screen.getByLabelText('again'));
    await flush(3000);
    expect(bubbles(container).length).toBeGreaterThan(0);
    expect(bubbles(container)[0].querySelector('svg')).toBeTruthy(); // level 1: shapes
  });

  it('rapid double-restart leaves exactly one live round', async () => {
    const { container } = renderGame();
    await flush(1500);

    // pop a few, restart, restart again within a second
    const first = bubbles(container);
    if (first.length) fireEvent.pointerDown(first[0]);
    await flush(300);
    if (screen.queryByLabelText('again')) fireEvent.click(screen.getByLabelText('again'));
    else {
      await playRound(container);
      fireEvent.click(screen.getByLabelText('again'));
    }
    await flush(200);
    if (screen.queryByLabelText('again')) fireEvent.click(screen.getByLabelText('again'));

    // drain everything stale, then the game must still be playable to 12
    await flush(9000);
    const pops = await playRound(container);
    expect(screen.getByLabelText('again')).toBeInTheDocument();
    expect(dots(container)).toBe(TOTAL);
    expect(pops).toBeGreaterThanOrEqual(1);
  });
});
