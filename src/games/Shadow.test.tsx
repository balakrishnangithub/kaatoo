import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import Shadow from './Shadow';
import {
  aboutToLevelUp,
  artOf,
  flush,
  installFakeSpeech,
  renderWithStore,
  saved,
  seedProfile,
} from '../test/helpers';

const options = (c: HTMLElement) =>
  [...c.querySelectorAll('button[aria-label="shadow option"]')] as HTMLElement[];
/** the full-colour picture whose shadow she is looking for */
const picture = (c: HTMLElement) =>
  c.querySelector('button.sticker[aria-label]:not([aria-label="shadow option"])')!;
const rightShadow = (c: HTMLElement) => options(c).find((o) => artOf(o) === artOf(picture(c)))!;
const revealed = (c: HTMLElement) => options(c).filter((o) => !o.querySelector('.shadowify'));

describe('Shadow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('the right shadow lights up in colour and the round advances once', async () => {
    seedProfile({ settings: { sound: false } });
    const { container } = renderWithStore(<Shadow onHome={() => {}} />);
    const right = rightShadow(container);
    fireEvent.click(right);
    fireEvent.click(right); // an excited double-tap
    expect(revealed(container)).toEqual([right]);
    expect(saved().progress.shadow.outcomes).toEqual([1]);
    await flush(1000);
    expect(revealed(container)).toEqual([]); // a new round, all shadows again
  });

  it('a level-up on the winning tap never re-deals the board mid-celebration', async () => {
    seedProfile({ settings: { sound: false }, progress: aboutToLevelUp('shadow') });
    const { container } = renderWithStore(<Shadow onHome={() => {}} />);
    const before = artOf(picture(container));
    fireEvent.click(rightShadow(container));
    expect(saved().progress.shadow.outcomes).toEqual([1, 1, 1, 1]); // the level did tip
    await flush(50);
    expect(artOf(picture(container))).toBe(before);
    expect(revealed(container).length).toBe(1); // still showing what she found
  });

  it('the opening instruction is heard in full, then the first prompt — nothing is cut off', async () => {
    const voice = installFakeSpeech();
    seedProfile({ settings: { english: true } });
    renderWithStore(<Shadow onHome={() => {}} />);
    await flush(20_000);
    expect(voice.cancelled).toEqual([]);
    expect(voice.spoken.slice(0, 2)).toEqual(['சரியான நிழலைத் தொடு', 'touch the matching shadow']);
    expect(voice.spoken[2]).toMatch(/— நிழலைத் தொடு$/);
    expect(voice.spoken).toHaveLength(3);
  });
});
