import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import Pattern from './Pattern';
import {
  aboutToLevelUp,
  artOf,
  flush,
  installFakeSpeech,
  renderWithStore,
  saved,
  seedProfile,
} from '../test/helpers';

const options = (c: HTMLElement) => [...c.querySelectorAll('.grid button')] as HTMLElement[];
/** the model row: [0] is the header chip, [1] the sequence strip */
const strip = (c: HTMLElement) => c.querySelectorAll('.sticker')[1];
const stripArt = (c: HTMLElement) =>
  [...strip(c).querySelectorAll('svg')].map((svg) => svg.innerHTML);
/** at level 1 the row is A B A B — what comes next looks like the first tile */
const nextInPattern = (c: HTMLElement) => options(c).find((o) => artOf(o) === stripArt(c)[0])!;

describe('Pattern', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('the voice is never cut off: instruction, each tile by name, then "correct!"', async () => {
    const voice = installFakeSpeech();
    seedProfile({ settings: { stageOverride: 1 } }); // level 1: extend an AB pattern
    const { container } = renderWithStore(<Pattern onHome={() => {}} />);
    await flush(30_000);
    // the instruction opens the round, the four tiles are named, then the question again
    expect(voice.cancelled).toEqual([]);
    expect(voice.spoken).toHaveLength(6);
    expect(voice.spoken[0]).toBe('அடுத்தது என்ன?');
    expect(voice.spoken[5]).toBe('அடுத்தது என்ன?');

    fireEvent.click(nextInPattern(container));
    await flush(700);
    expect(voice.spoken[6]).toBe('சரி!'); // used to be swallowed every single time
  });

  it('answering while the tiles are still being named stops the naming, not the praise', async () => {
    const voice = installFakeSpeech();
    seedProfile({ settings: { stageOverride: 1 } });
    const { container } = renderWithStore(<Pattern onHome={() => {}} />);
    await flush(2500); // the instruction is done, the naming is under way
    const named = voice.spoken.length;
    fireEvent.click(nextInPattern(container));
    await flush(800);
    expect(voice.spoken.slice(named)).toEqual(['சரி!']);
  });

  it('a level-up on the winning tap never re-deals the row mid-celebration', async () => {
    seedProfile({
      settings: { sound: false, stageOverride: 1 },
      progress: aboutToLevelUp('pattern'),
    });
    const { container } = renderWithStore(<Pattern onHome={() => {}} />);
    const before = stripArt(container).slice(0, 4);
    const right = nextInPattern(container);
    fireEvent.click(right);
    fireEvent.click(right); // an excited double-tap
    expect(saved().progress.pattern.outcomes).toEqual([1, 1, 1, 1]); // tipped, and counted once
    await flush(50);
    expect(stripArt(container).slice(0, 4)).toEqual(before);
    expect(stripArt(container)).toHaveLength(5); // the "?" slot now shows her answer
  });

  it('copy mode: the row is built piece by piece, and only the last piece ends the round', async () => {
    seedProfile({ settings: { sound: false, stageOverride: 0 } }); // level 0: copy
    const { container } = renderWithStore(<Pattern onHome={() => {}} />);
    const model = stripArt(container);
    for (let i = 0; i < model.length; i++) {
      expect(saved().progress.pattern?.outcomes ?? []).toEqual([]);
      fireEvent.click(options(container).find((o) => artOf(o) === model[i])!);
    }
    expect(saved().progress.pattern.outcomes).toEqual([1]);
  });
});
