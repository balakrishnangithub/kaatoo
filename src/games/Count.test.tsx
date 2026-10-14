import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import Count from './Count';
import { WORDS } from '../data/content';
import {
  aboutToLevelUp,
  flush,
  installFakeSpeech,
  renderWithStore,
  saved,
  seedProfile,
} from '../test/helpers';

const items = (c: HTMLElement) => [...c.querySelectorAll('.grid button')] as HTMLElement[];
/** the number buttons under "எத்தனை?" */
const answers = (c: HTMLElement) =>
  [...c.querySelectorAll('.anim-fade-up .flex button')] as HTMLElement[];
const badges = (c: HTMLElement) => c.querySelectorAll('.grid button .bg-salmon').length;

/** count every item, wait for the question, and return the right answer's button */
async function countAll(c: HTMLElement) {
  const all = items(c);
  for (const item of all) fireEvent.click(item);
  await flush(800);
  return answers(c).find((b) => b.textContent === String(all.length))!;
}

describe('Count', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('a double-tap on the right number counts once and skips no round', async () => {
    seedProfile({ settings: { sound: false } });
    const { container } = renderWithStore(<Count onHome={() => {}} />);
    const right = await countAll(container);
    fireEvent.click(right);
    fireEvent.click(right);
    await flush(1000);
    expect(saved().progress.count.outcomes).toEqual([1]);
    // round two is a fresh, uncounted board — not round three
    expect(badges(container)).toBe(0);
    fireEvent.click(await countAll(container));
    expect(saved().progress.count.outcomes).toEqual([1, 1]);
  });

  it('a level-up on the winning tap never re-deals the board mid-celebration', async () => {
    seedProfile({ settings: { sound: false }, progress: aboutToLevelUp('count') });
    const { container } = renderWithStore(<Count onHome={() => {}} />);
    const counted = items(container).length;
    fireEvent.click(await countAll(container));
    expect(saved().progress.count.outcomes).toEqual([1, 1, 1, 1]); // the level did tip
    await flush(50);
    // …but what she just counted and answered is still on screen
    expect(badges(container)).toBe(counted);
    expect(answers(container).length).toBe(3);
  });

  it('a wrong number wiggles, and the round is no longer a clean one', async () => {
    seedProfile({ settings: { sound: false } });
    const { container } = renderWithStore(<Count onHome={() => {}} />);
    const right = await countAll(container);
    const wrong = answers(container).find((b) => b !== right)!;
    fireEvent.click(wrong);
    expect(wrong.className).toContain('anim-wiggle');
    fireEvent.click(right);
    expect(saved().progress.count.outcomes).toEqual([0]);
  });

  it('leaving right after the last item asks no question into the next screen', async () => {
    const voice = installFakeSpeech();
    seedProfile();
    const { container, unmount } = renderWithStore(<Count onHome={() => {}} />);
    await flush(5000); // let the instruction finish
    for (const item of items(container)) fireEvent.click(item);
    unmount(); // she tapped home inside the 700 ms before "எத்தனை?"
    await flush(5000);
    expect(voice.spoken.some((line) => line.startsWith('எத்தனை'))).toBe(false);
  });

  describe('the English echo of the count', () => {
    /** play one round with a fixed word and count; return the English line spoken */
    async function echoFor(en: string, n: number) {
      const voice = installFakeSpeech();
      seedProfile({ settings: { english: true } });
      const index = WORDS.findIndex((w) => w.en === en);
      // level 0 counts 1–3: steer the random count, then the random word
      const rolls = [(n - 1) / 3 + 0.01, index / WORDS.length + 0.001];
      vi.spyOn(Math, 'random').mockImplementation(() => rolls.shift() ?? 0.5);
      const { container, unmount } = renderWithStore(<Count onHome={() => {}} />);
      expect(items(container).length).toBe(n);
      fireEvent.click(await countAll(container));
      await flush(3000); // long enough for the echo to be said (or cut by the next round)
      unmount();
      vi.restoreAllMocks();
      const numerals = ['one', 'two', 'three'];
      return [...voice.spoken, ...voice.cancelled].find((l) => l.startsWith(numerals[n - 1]));
    }

    it('one of something is singular', async () => {
      expect(await echoFor('cat', 1)).toBe('one cat');
    });
    it('regular plurals just take an s', async () => {
      expect(await echoFor('cat', 3)).toBe('three cats');
    });
    it('irregular plurals come from the word list', async () => {
      expect(await echoFor('fish', 2)).toBe('two fish');
      expect(await echoFor('bus', 3)).toBe('three buses');
      expect(await echoFor('mango', 2)).toBe('two mangoes');
    });
    it('grapes are counted in bunches', async () => {
      expect(await echoFor('grapes', 1)).toBe('one bunch of grapes');
      expect(await echoFor('grapes', 3)).toBe('three bunches of grapes');
    });
  });
});
