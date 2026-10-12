import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import Odd from './Odd';
import { StoreProvider } from '../lib/store';

/**
 * Regression tests for the vanishing match-model:
 * the difficulty level used to be read LIVE from progress, so a correct tap
 * that crossed the level-up threshold re-dealt the round MID-question — the
 * "find the same" reference image disappeared (or appeared) by itself, and
 * the spoken prompt no longer matched the screen. The level is now frozen
 * for the whole sitting; it only applies on the next visit.
 */

function seed(outcomes: number[]) {
  localStorage.clear();
  localStorage.setItem(
    'kaatoo-v1',
    JSON.stringify({
      settings: {
        name: 'test',
        birth: '2024-09-13',
        sessionMin: 15,
        sound: false,
        english: false,
        guide: true,
        stageOverride: 0,
        onboarded: true,
      },
      progress: { odd: { plays: 3, wins: 3, outcomes } },
      milestones: {},
    }),
  );
}

function renderGame() {
  return render(
    <StoreProvider>
      <Odd onHome={() => {}} />
    </StoreProvider>,
  );
}

/** artwork fingerprint, size-independent (digits normalised away) */
const norm = (el: Element) => el.innerHTML.replace(/\d+(\.\d+)?/g, '#');

/** the level-0 match-model: the only sticker button with an aria-label */
function modelButton(container: HTMLElement) {
  return container.querySelector('button.sticker[aria-label]');
}

function tiles(container: HTMLElement) {
  return [...container.querySelectorAll('.grid button')] as HTMLElement[];
}

function matchingTile(container: HTMLElement) {
  const m = modelButton(container);
  if (!m) return null;
  const target = norm(m);
  return tiles(container).find((t) => norm(t) === target) ?? null;
}

async function flush(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('Odd one out — the vanishing model (live-level regression)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('a level-up on the tap never re-deals the question mid-round', async () => {
    seed([1, 1, 1]); // next clean correct tap → acc 1.0 → live level would jump 0→1
    const { container } = renderGame();

    // level 0: the match-model and its prompt are on screen
    expect(modelButton(container)).toBeTruthy();
    expect(container.textContent).toContain('இதே மாதிரி எது?');
    const dealtArt = tiles(container).map((t) => norm(t));

    const correct = matchingTile(container);
    expect(correct).toBeTruthy();
    fireEvent.click(correct!);

    // the tap really did record a clean outcome — the old code re-dealt here
    const saved = JSON.parse(localStorage.getItem('kaatoo-v1') || '{}');
    expect(saved.progress.odd.outcomes).toEqual([1, 1, 1, 1]);

    // …but nothing on screen may change until the round advances: the model
    // and prompt stay, and the dealt tiles are untouched
    expect(modelButton(container)).toBeTruthy();
    expect(container.textContent).toContain('இதே மாதிரி எது?');
    expect(tiles(container).map((t) => norm(t))).toEqual(dealtArt);

    // after the advance, the next round is STILL a find-the-same round —
    // the frozen level holds for the whole sitting
    await flush(800);
    expect(modelButton(container)).toBeTruthy();
    expect(container.textContent).toContain('இதே மாதிரி எது?');
  });

  it('a wrong tap never re-deals either — it wiggles and the round stays', async () => {
    seed([]);
    const { container } = renderGame();
    const dealtArt = tiles(container).map((t) => norm(t));
    const wrongTile = tiles(container).find((t) => t !== matchingTile(container))!;
    fireEvent.click(wrongTile);
    expect(wrongTile.className).toContain('anim-wiggle');
    expect(modelButton(container)).toBeTruthy();
    expect(tiles(container).map((t) => norm(t))).toEqual(dealtArt);
    await flush(500); // wiggle settles
    expect(modelButton(container)).toBeTruthy();
    expect(tiles(container).map((t) => norm(t))).toEqual(dealtArt);
  });
});
